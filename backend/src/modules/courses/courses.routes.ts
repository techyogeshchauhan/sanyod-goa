import { Router } from 'express';
import { z } from 'zod';
import { Course, toCourseSummary } from '../../models/Course';
import { CourseVideo } from '../../models/CourseVideo';
import { validate } from '../../middleware/validate';
import type { CourseDetailResponse, CourseVideo as CourseVideoDto } from '../../shared/types/catalog';
import type { HomeCourses } from '../../shared/types/course';
import { browserCache, cached } from '../../services/cache';
import { coursePurchaseStatus, hasEntitlement } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';

export const coursesRouter = Router();

const HOME_LIST_SIZE = 3;

const listQuery = z.object({ home: z.enum(['1', 'true']).optional() });

/** A published course by slug (cached): its id and public summary. */
function publishedCourse(slug = '') {
  return cached(`course:${slug}`, async () => {
    const course = await Course.findOne({ slug, isPublished: true });
    return course ? { id: String(course._id), summary: toCourseSummary(course) } : null;
  });
}

/** The published videos of a course (cached), without anything user-specific. */
function publishedVideos(courseId: string) {
  return cached(`course-videos:${courseId}`, async () => {
    const videos = await CourseVideo.find({ course: courseId, isPublished: true }, 'title isFree durationSec youtubeId sortOrder')
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return videos.map((v) => ({
      id: String(v._id),
      sortOrder: v.sortOrder ?? 0,
      title: v.title,
      isFree: v.isFree ?? false,
      durationSec: v.durationSec ?? null,
      youtubeId: v.youtubeId,
    }));
  });
}

coursesRouter.get(
  '/',
  browserCache(),
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    if (req.query.home) {
      const data = await cached<HomeCourses>('courses:home', async () => {
        const [newest, popular] = await Promise.all([
          Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(HOME_LIST_SIZE),
          Course.find({ isPublished: true, popularRank: { $ne: null } }).sort({ popularRank: 1 }).limit(HOME_LIST_SIZE),
        ]);
        return { newArrivals: newest.map(toCourseSummary), popular: popular.map(toCourseSummary) };
      });
      return res.json({ data });
    }
    // Catalogue order on live: newest first (8, 7, 6, 5).
    const data = await cached('courses:list', async () => {
      const courses = await Course.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: -1 });
      return courses.map(toCourseSummary);
    });
    res.json({ data });
  }),
);

/** course_details.php: the course and, for a logged-in user, whether they bought it. */
coursesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const course = await publishedCourse(req.params.slug);
    if (!course) throw notFound('Course not found');
    const user = req.session.user;
    const data: CourseDetailResponse = {
      course: course.summary,
      purchase: user ? await coursePurchaseStatus(user.id, course.id) : null,
    };
    res.json({ data });
  }),
);

/**
 * get_videos.php replacement. Every visitor sees the list; the YouTube ID is only sent for
 * free videos or to users who own the course (live sent all links to everyone: D-12).
 */
coursesRouter.get(
  '/:slug/videos',
  asyncHandler(async (req, res) => {
    const course = await publishedCourse(req.params.slug);
    if (!course) throw notFound('Course not found');
    const user = req.session.user;
    // Ownership and the video list don't depend on each other: one round trip instead of two.
    const [owned, videos] = await Promise.all([
      user ? hasEntitlement(user.id, 'course', course.id) : Promise.resolve(false),
      publishedVideos(course.id),
    ]);
    const data: CourseVideoDto[] = videos.map((v, i) => {
      const canAccess = Boolean(user) && (owned || v.isFree);
      return {
        id: v.id,
        order: v.sortOrder || i + 1,
        title: v.title,
        isFree: v.isFree,
        durationSec: v.durationSec,
        canAccess,
        ...(canAccess ? { youtubeId: v.youtubeId } : {}),
      };
    });
    res.json({ data });
  }),
);
