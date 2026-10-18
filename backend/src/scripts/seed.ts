/**
 * Seeds data visible on the live site (docs/09 Part C). Idempotent: upserts by legacyId / slug.
 * With LEGACY_SITE_DIR set, also copies the book PDFs from <dir>/Books_pdf into private storage.
 * Usage: npm run seed
 */
import path from 'node:path';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Book } from '../models/Book';
import { Course } from '../models/Course';
import { CourseVideo } from '../models/CourseVideo';
import { Doctor } from '../models/Doctor';
import { Event } from '../models/Event';
import { getSettings } from '../models/Settings';
import { importFile } from '../services/storage';
import { initDb } from './init-db';
import books from './seed-data/books.json';
import courseVideos from './seed-data/course-videos.json';
import courses from './seed-data/courses.json';
import doctors from './seed-data/doctors.json';
import events from './seed-data/events.json';

export async function seedCourses(): Promise<number> {
  for (const c of courses) {
    await Course.updateOne(
      { legacyId: c.legacyId },
      {
        $set: {
          slug: c.slug,
          title: c.title,
          description: c.description,
          image: c.image,
          price: c.price,
          discountPercent: c.discountPercent,
          videoCount: c.videoCount,
          popularRank: c.popularRank,
          isPublished: true,
        },
        $setOnInsert: { legacyId: c.legacyId, createdAt: new Date(c.createdAt) },
      },
      { upsert: true, timestamps: false },
    );
  }
  return courses.length;
}

/** Videos captured from course_details.php (YouTube IDs, titles, order). */
export async function seedCourseVideos(): Promise<number> {
  const byLegacy = new Map((await Course.find({}, 'legacyId')).map((c) => [c.legacyId, c._id]));
  let n = 0;
  for (const v of courseVideos) {
    const course = byLegacy.get(v.courseLegacyId);
    if (!course) continue;
    await CourseVideo.updateOne(
      { course, sortOrder: v.sortOrder },
      { $set: { title: v.title, youtubeId: v.youtubeId, isFree: v.isFree, durationSec: v.durationSec, isPublished: true } },
      { upsert: true, runValidators: true },
    );
    n++;
  }
  for (const id of byLegacy.values()) {
    await Course.updateOne({ _id: id }, { $set: { videoCount: await CourseVideo.countDocuments({ course: id, isPublished: true }) } });
  }
  return n;
}

/** Books 27, 28 and 30 have no price yet: their detail pages need a login, so the price wasn't captured. */
export async function seedBooks(): Promise<number> {
  for (const { legacyId, pdf, ...b } of books) {
    // Keep a PDF that is already in storage; copy it from the old site when available.
    const copied = env.LEGACY_SITE_DIR ? await importFile('private', pdf, path.join(env.LEGACY_SITE_DIR, pdf)) : null;
    await Book.updateOne(
      { legacyId },
      { $set: { ...b, isPublished: true, ...(copied ? { pdf: copied } : {}) }, $setOnInsert: copied ? {} : { pdf } },
      { upsert: true, runValidators: true },
    );
  }
  return books.length;
}

export async function seedDoctors(): Promise<number> {
  for (const { slug, ...d } of doctors) {
    await Doctor.updateOne({ slug }, { $set: { ...d, isActive: true } }, { upsert: true, runValidators: true });
  }
  return doctors.length;
}

export async function seedEvents(): Promise<number> {
  for (const { legacyId, startDate, ...e } of events) {
    await Event.updateOne(
      { legacyId },
      { $set: { ...e, startDate: startDate ? new Date(startDate) : null, isPublished: true } },
      { upsert: true, runValidators: true },
    );
  }
  return events.length;
}

async function main() {
  await connectDb(env.MONGODB_URI);
  await initDb();
  await getSettings(); // creates the default site settings
  const counts = {
    courses: await seedCourses(),
    'course videos': await seedCourseVideos(),
    books: await seedBooks(),
    doctors: await seedDoctors(),
    events: await seedEvents(),
  };
  // eslint-disable-next-line no-console
  console.log(`Seeded ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}.`);
  if (!env.LEGACY_SITE_DIR) {
    // eslint-disable-next-line no-console
    console.log('LEGACY_SITE_DIR is not set: book PDFs were not copied into storage.');
  }
}

if (require.main === module) {
  main()
    .catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDb());
}
