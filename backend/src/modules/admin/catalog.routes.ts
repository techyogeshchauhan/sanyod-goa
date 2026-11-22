import { Router } from 'express';
import { imageField, pdfField, uploadedFile, uploadFields } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { Book, type BookDoc } from '../../models/Book';
import { Course, type CourseDoc } from '../../models/Course';
import { CourseVideo, type CourseVideoDoc } from '../../models/CourseVideo';
import { Entitlement } from '../../models/Entitlement';
import { Payment } from '../../models/Payment';
import {
  bookFormSchema,
  courseFormSchema,
  idParamSchema,
  listQuerySchema,
  reorderVideosSchema,
  videoFormSchema,
  type BookFormInput,
  type CourseFormInput,
  type ListQuery,
} from '../../shared/schemas/admin';
import type { AdminBook, AdminCourse, AdminVideo } from '../../shared/types/admin';
import { deleteStored, publicUrl, saveUpload } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { badRequest, conflict, notFound } from '../../utils/errors';
import { audit, createdAt, defined, paged, searchFilter, skip, slugify, uniqueSlug } from './helpers';
import { z } from 'zod';

export const catalogRouter = Router();

const isLegacyPath = (v: string | null | undefined) => Boolean(v && v.startsWith('/'));

// ---- Books -----------------------------------------------------------------------

function toAdminBook(b: BookDoc, sales: number): AdminBook {
  return {
    id: String(b._id),
    legacyId: b.legacyId ?? null,
    slug: b.slug,
    title: b.title,
    author: b.author ?? '',
    description: b.description ?? '',
    category: b.category ?? '',
    language: b.language ?? '',
    isFeatured: b.isFeatured ?? false,
    pricePdf: b.pricePdf ?? null,
    priceHardcopy: b.priceHardcopy ?? null,
    hardcopyAvailable: b.hardcopyAvailable ?? true,
    pages: b.pages ?? null,
    publishedYear: b.publishedYear ?? null,
    rating: b.rating ?? null,
    reviewCount: b.reviewCount ?? null,
    cover: publicUrl(b.cover) ?? '',
    hasPdf: Boolean(b.pdf),
    isPublished: b.isPublished ?? true,
    sortOrder: b.sortOrder ?? 0,
    sales,
    createdAt: createdAt(b),
  };
}

async function salesByItem(ids: unknown[]): Promise<Map<string, number>> {
  const rows = await Payment.aggregate<{ _id: unknown; n: number }>([
    { $match: { item: { $in: ids }, status: 'approved' } },
    { $group: { _id: '$item', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

catalogRouter.get(
  '/books',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = { ...searchFilter(q.q, ['title', 'author', 'slug']), ...(q.status ? { isPublished: q.status === 'published' } : {}) };
    const [items, total] = await Promise.all([
      Book.find(filter).select('+pdf').sort({ sortOrder: 1, createdAt: -1 }).skip(skip(q)).limit(q.pageSize),
      Book.countDocuments(filter),
    ]);
    const sales = await salesByItem(items.map((b) => b._id));
    res.json(paged(items.map((b) => toAdminBook(b, sales.get(String(b._id)) ?? 0)), total, q));
  }),
);

catalogRouter.get(
  '/books/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).select('+pdf');
    if (!book) throw notFound('Book not found');
    const sales = await salesByItem([book._id]);
    res.json({ data: toAdminBook(book, sales.get(String(book._id)) ?? 0) });
  }),
);

const bookUpload = uploadFields([imageField('cover'), pdfField('pdf')]);

function bookFields(input: BookFormInput) {
  return defined({
    title: input.title,
    author: input.author ?? '',
    description: input.description,
    category: input.category ?? '',
    language: input.language ?? '',
    isFeatured: input.isFeatured ?? false,
    pricePdf: input.pricePdf,
    // Each format is priced explicitly in the catalogue; never infer a price from another format.
    priceHardcopy: input.priceHardcopy,
    hardcopyAvailable: input.hardcopyAvailable,
    // An emptied optional field is null, which clears it (defined() keeps nulls).
    pages: input.pages,
    publishedYear: input.publishedYear,
    rating: input.rating,
    reviewCount: input.reviewCount,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder ?? 0,
    legacyId: input.legacyId ?? undefined,
  });
}

catalogRouter.post(
  '/books',
  bookUpload,
  validate({ body: bookFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as BookFormInput;
    const cover = uploadedFile(req, 'cover');
    if (!cover) throw badRequest('Please upload a cover image', { cover: 'Please upload a cover image' });
    const slug = await uniqueSlug(Book, input.slug ?? slugify(input.title, 'book'));
    const coverKey = await saveUpload('public', 'books', cover, 'cover');
    const pdf = uploadedFile(req, 'pdf');
    const pdfKey = pdf ? await saveUpload('private', 'books', pdf, 'book') : undefined;
    try {
      const book = await Book.create({ ...bookFields(input), slug, cover: coverKey, pdf: pdfKey });
      await audit(req, 'book.create', 'Book', book._id, { title: book.title });
      res.status(201).json({ data: toAdminBook(book, 0) });
    } catch (err) {
      await deleteStored('public', coverKey);
      await deleteStored('private', pdfKey);
      throw err;
    }
  }),
);

catalogRouter.patch(
  '/books/:id',
  bookUpload,
  validate({ params: idParamSchema, body: bookFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as BookFormInput;
    const book = await Book.findById(req.params.id).select('+pdf');
    if (!book) throw notFound('Book not found');
    Object.assign(book, bookFields(input));
    if (input.slug && input.slug !== book.slug) book.slug = await uniqueSlug(Book, input.slug, book._id);
    const cover = uploadedFile(req, 'cover');
    const pdf = uploadedFile(req, 'pdf');
    const oldCover = book.cover;
    const oldPdf = book.pdf;
    if (cover) book.cover = await saveUpload('public', 'books', cover, 'cover');
    if (pdf) book.pdf = await saveUpload('private', 'books', pdf, 'book');
    await book.save();
    if (cover && !isLegacyPath(oldCover)) await deleteStored('public', oldCover);
    if (pdf && oldPdf && !oldPdf.startsWith('Books_pdf/')) await deleteStored('private', oldPdf);
    await audit(req, 'book.update', 'Book', book._id, { title: book.title, cover: Boolean(cover), pdf: Boolean(pdf) });
    const sales = await salesByItem([book._id]);
    res.json({ data: toAdminBook(book, sales.get(String(book._id)) ?? 0) });
  }),
);

catalogRouter.delete(
  '/books/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).select('+pdf');
    if (!book) throw notFound('Book not found');
    if (await Payment.exists({ item: book._id })) {
      throw conflict('HAS_PURCHASES', 'This book has purchases. Unpublish it instead of deleting it.');
    }
    await book.deleteOne();
    if (!isLegacyPath(book.cover)) await deleteStored('public', book.cover);
    await deleteStored('private', book.pdf);
    await audit(req, 'book.delete', 'Book', book._id, { title: book.title });
    res.status(204).end();
  }),
);

// ---- Courses ------------------------------------------------------------------------

function toAdminCourse(c: CourseDoc, students: number): AdminCourse {
  return {
    id: String(c._id),
    legacyId: c.legacyId ?? null,
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    image: publicUrl(c.image) ?? '',
    price: c.price,
    discountPercent: c.discountPercent ?? 0,
    level: c.level ?? '',
    hasCertificate: c.hasCertificate ?? false,
    popularRank: c.popularRank ?? null,
    videoCount: c.videoCount ?? 0,
    isPublished: c.isPublished ?? true,
    sortOrder: c.sortOrder ?? 0,
    students,
    createdAt: createdAt(c),
  };
}

async function studentsByCourse(ids: unknown[]): Promise<Map<string, number>> {
  const rows = await Entitlement.aggregate<{ _id: unknown; n: number }>([
    { $match: { item: { $in: ids }, itemType: 'course' } },
    { $group: { _id: '$item', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

/** Keeps Course.videoCount equal to its published videos. */
async function refreshVideoCount(courseId: unknown) {
  const n = await CourseVideo.countDocuments({ course: courseId, isPublished: true });
  await Course.updateOne({ _id: courseId }, { $set: { videoCount: n } });
}

catalogRouter.get(
  '/courses',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = { ...searchFilter(q.q, ['title', 'slug']), ...(q.status ? { isPublished: q.status === 'published' } : {}) };
    const [items, total] = await Promise.all([
      Course.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip(q)).limit(q.pageSize),
      Course.countDocuments(filter),
    ]);
    const students = await studentsByCourse(items.map((c) => c._id));
    res.json(paged(items.map((c) => toAdminCourse(c, students.get(String(c._id)) ?? 0)), total, q));
  }),
);

catalogRouter.get(
  '/courses/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw notFound('Course not found');
    const students = await studentsByCourse([course._id]);
    res.json({ data: toAdminCourse(course, students.get(String(course._id)) ?? 0) });
  }),
);

const courseUpload = uploadFields([imageField('image')]);

function courseFields(input: CourseFormInput) {
  return defined({
    title: input.title,
    description: input.description,
    price: input.price ?? undefined,
    // Emptied fields fall back to their defaults instead of keeping the old value.
    discountPercent: input.discountPercent ?? 0,
    level: input.level ?? '',
    hasCertificate: input.hasCertificate,
    popularRank: input.popularRank,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder ?? 0,
    legacyId: input.legacyId ?? undefined,
  });
}

catalogRouter.post(
  '/courses',
  courseUpload,
  validate({ body: courseFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as CourseFormInput;
    const image = uploadedFile(req, 'image');
    if (!image) throw badRequest('Please upload a course image', { image: 'Please upload a course image' });
    const slug = await uniqueSlug(Course, input.slug ?? slugify(input.title, 'course'));
    const key = await saveUpload('public', 'courses', image, 'course');
    try {
      const course = await Course.create({ ...courseFields(input), slug, image: key });
      await audit(req, 'course.create', 'Course', course._id, { title: course.title });
      res.status(201).json({ data: toAdminCourse(course, 0) });
    } catch (err) {
      await deleteStored('public', key);
      throw err;
    }
  }),
);

catalogRouter.patch(
  '/courses/:id',
  courseUpload,
  validate({ params: idParamSchema, body: courseFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as CourseFormInput;
    const course = await Course.findById(req.params.id);
    if (!course) throw notFound('Course not found');
    Object.assign(course, courseFields(input));
    if (input.slug && input.slug !== course.slug) course.slug = await uniqueSlug(Course, input.slug, course._id);
    const image = uploadedFile(req, 'image');
    const oldImage = course.image;
    if (image) course.image = await saveUpload('public', 'courses', image, 'course');
    await course.save();
    if (image && !isLegacyPath(oldImage)) await deleteStored('public', oldImage);
    await audit(req, 'course.update', 'Course', course._id, { title: course.title });
    const students = await studentsByCourse([course._id]);
    res.json({ data: toAdminCourse(course, students.get(String(course._id)) ?? 0) });
  }),
);

catalogRouter.delete(
  '/courses/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw notFound('Course not found');
    if (await Payment.exists({ item: course._id })) {
      throw conflict('HAS_PURCHASES', 'This course has purchases. Unpublish it instead of deleting it.');
    }
    await CourseVideo.deleteMany({ course: course._id });
    await course.deleteOne();
    if (!isLegacyPath(course.image)) await deleteStored('public', course.image);
    await audit(req, 'course.delete', 'Course', course._id, { title: course.title });
    res.status(204).end();
  }),
);

// ---- Course videos ----------------------------------------------------------------------

function toAdminVideo(v: CourseVideoDoc): AdminVideo {
  return {
    id: String(v._id),
    title: v.title,
    youtubeId: v.youtubeId,
    isFree: v.isFree ?? false,
    durationSec: v.durationSec ?? null,
    isPublished: v.isPublished ?? true,
    sortOrder: v.sortOrder ?? 0,
  };
}

catalogRouter.get(
  '/courses/:id/videos',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const videos = await CourseVideo.find({ course: req.params.id }).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ data: videos.map(toAdminVideo) });
  }),
);

type VideoInput = z.output<typeof videoFormSchema>;

catalogRouter.post(
  '/courses/:id/videos',
  validate({ params: idParamSchema, body: videoFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as VideoInput;
    const course = await Course.findById(req.params.id, '_id title');
    if (!course) throw notFound('Course not found');
    const last = await CourseVideo.findOne({ course: course._id }).sort({ sortOrder: -1 });
    const video = await CourseVideo.create({
      course: course._id,
      title: input.title,
      youtubeId: input.youtube,
      isFree: input.isFree,
      isPublished: input.isPublished,
      durationSec: input.durationMinutes != null ? Math.round(input.durationMinutes * 60) : undefined,
      sortOrder: input.sortOrder ?? (last?.sortOrder ?? 0) + 1,
    });
    await refreshVideoCount(course._id);
    await audit(req, 'video.create', 'CourseVideo', video._id, { course: course.title, title: video.title });
    res.status(201).json({ data: toAdminVideo(video) });
  }),
);

catalogRouter.patch(
  '/videos/:id',
  validate({ params: idParamSchema, body: videoFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as VideoInput;
    const video = await CourseVideo.findById(req.params.id);
    if (!video) throw notFound('Video not found');
    video.title = input.title;
    video.youtubeId = input.youtube;
    video.isFree = input.isFree;
    video.isPublished = input.isPublished;
    // An empty duration clears it.
    video.durationSec = input.durationMinutes != null ? Math.round(input.durationMinutes * 60) : undefined;
    if (input.sortOrder != null) video.sortOrder = input.sortOrder;
    await video.save();
    await refreshVideoCount(video.course);
    await audit(req, 'video.update', 'CourseVideo', video._id, { title: video.title });
    res.json({ data: toAdminVideo(video) });
  }),
);

catalogRouter.delete(
  '/videos/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const video = await CourseVideo.findById(req.params.id);
    if (!video) throw notFound('Video not found');
    await video.deleteOne();
    await refreshVideoCount(video.course);
    await audit(req, 'video.delete', 'CourseVideo', video._id, { title: video.title });
    res.status(204).end();
  }),
);

catalogRouter.post(
  '/courses/:id/videos/reorder',
  validate({ params: idParamSchema, body: reorderVideosSchema }),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    await CourseVideo.bulkWrite(
      ids.map((id, i) => ({ updateOne: { filter: { _id: id, course: req.params.id }, update: { $set: { sortOrder: i + 1 } } } })),
    );
    await audit(req, 'video.reorder', 'Course', req.params.id);
    const videos = await CourseVideo.find({ course: req.params.id }).sort({ sortOrder: 1 });
    res.json({ data: videos.map(toAdminVideo) });
  }),
);
