import { Router } from 'express';
import { z } from 'zod';
import { Course, toCourseSummary } from '../../models/Course';
import { CourseVideo } from '../../models/CourseVideo';
import { validate } from '../../middleware/validate';
import type { CourseDetailResponse, CourseVideo as CourseVideoDto } from '../../shared/types/catalog';
import type { HomeCourses } from '../../shared/types/course';
import { coursePurchaseStatus, hasEntitlement } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';

export const coursesRouter = Router();

const HOME_LIST_SIZE = 3;

const listQuery = z.object({ home: z.enum(['1', 'true']).optional() });

coursesRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    if (req.query.home) {
      const [newest, popular] = await Promise.all([
        Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(HOME_LIST_SIZE),
        Course.find({ isPublished: true, popularRank: { $ne: null } }).sort({ popularRank: 1 }).limit(HOME_LIST_SIZE),
      ]);
      const data: HomeCourses = { newArrivals: newest.map(toCourseSummary), popular: popular.map(toCourseSummary) };
      return res.json({ data });
    }
    // Catalogue order on live: newest first (8, 7, 6, 5).
    const courses = await Course.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ data: courses.map(toCourseSummary) });
  }),
);

/** course_details.php: the course and, for a logged-in user, whether they bought it. */
coursesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
    if (!course) throw notFound('Course not found');
    const user = req.session.user;
    const data: CourseDetailResponse = {
      course: toCourseSummary(course),
      purchase: user ? await coursePurchaseStatus(user.id, course._id) : null,
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
    const course = await Course.findOne({ slug: req.params.slug, isPublished: true }, '_id');
    if (!course) throw notFound('Course not found');
    const user = req.session.user;
    const owned = user ? await hasEntitlement(user.id, 'course', course._id) : false;
    const videos = await CourseVideo.find({ course: course._id, isPublished: true }).sort({ sortOrder: 1, createdAt: 1 });
    const data: CourseVideoDto[] = videos.map((v, i) => {
      const canAccess = Boolean(user) && (owned || v.isFree === true);
      return {
        id: String(v._id),
        order: v.sortOrder || i + 1,
        title: v.title,
        isFree: v.isFree ?? false,
        durationSec: v.durationSec ?? null,
        canAccess,
        ...(canAccess ? { youtubeId: v.youtubeId } : {}),
      };
    });
    res.json({ data });
  }),
);
