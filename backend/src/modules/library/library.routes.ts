import { stat } from 'node:fs/promises';
import { Router } from 'express';
import { z } from 'zod';
import { requireUser, sessionUser } from '../../middleware/auth';
import { Book, type BookDoc } from '../../models/Book';
import { Course, toCourseSummary, type CourseDoc } from '../../models/Course';
import { Entitlement } from '../../models/Entitlement';
import { Payment } from '../../models/Payment';
import type { LibraryBook, LibraryCourse } from '../../shared/types/catalog';
import { resolveKey, sendPrivateFile } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { forbidden, notFound } from '../../utils/errors';
import { validate } from '../../middleware/validate';
import { toBookDetail } from '../catalog/serializers';

export const libraryRouter = Router();

libraryRouter.use(requireUser);

const active = () => ({ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

async function fileSize(key: string | null | undefined): Promise<number | null> {
  if (!key) return null;
  try {
    return (await stat(resolveKey('private', key))).size;
  } catch {
    return null;
  }
}

async function libraryBook(book: BookDoc, grantedAt: Date, paymentId: unknown): Promise<LibraryBook> {
  const payment = paymentId ? await Payment.findById(paymentId, 'orderNumber') : null;
  const withPdf = await Book.findById(book._id).select('+pdf');
  return {
    ...toBookDetail(book),
    purchasedAt: grantedAt.toISOString(),
    orderNumber: payment?.orderNumber ?? null,
    fileSizeBytes: await fileSize(withPdf?.pdf),
  };
}

/** my_books.php: books the user may read. */
libraryRouter.get(
  '/books',
  asyncHandler(async (req, res) => {
    const grants = await Entitlement.find({ user: sessionUser(req).id, itemType: 'book_pdf', ...active() }).sort({ grantedAt: -1 });
    const books = await Book.find({ _id: { $in: grants.map((g) => g.item) } });
    const byId = new Map(books.map((b) => [String(b._id), b]));
    const data: LibraryBook[] = [];
    for (const g of grants) {
      const book = byId.get(String(g.item));
      if (book) data.push(await libraryBook(book, g.grantedAt ?? new Date(), g.payment));
    }
    res.json({ data });
  }),
);

async function entitledBook(userId: string, slug: string) {
  const book = await Book.findOne({ slug }).select('+pdf');
  if (!book) throw notFound('Book not found');
  const grant = await Entitlement.findOne({ user: userId, itemType: 'book_pdf', item: book._id, ...active() });
  if (!grant) throw forbidden('You have not purchased this book yet.', 'NOT_PURCHASED');
  return { book, grant };
}

/** view_book.php: one purchased book. */
libraryRouter.get(
  '/books/:slug',
  asyncHandler(async (req, res) => {
    const { book, grant } = await entitledBook(sessionUser(req).id, String(req.params.slug));
    res.json({ data: await libraryBook(book, grant.grantedAt ?? new Date(), grant.payment) });
  }),
);

/** read_pdf.php: the PDF itself, only for its owner. `?download=1` saves it as a file. */
libraryRouter.get(
  '/books/:slug/pdf',
  validate({ query: z.object({ download: z.enum(['0', '1']).optional() }) }),
  asyncHandler(async (req, res) => {
    const { book } = await entitledBook(sessionUser(req).id, String(req.params.slug));
    if (!book.pdf) throw notFound('The PDF for this book is not available yet. Please contact us.');
    await sendPrivateFile(res, book.pdf, { download: req.query.download === '1', filename: `${book.slug}.pdf` });
  }),
);

/** my_courses.php: courses the user has unlocked. */
libraryRouter.get(
  '/courses',
  asyncHandler(async (req, res) => {
    const grants = await Entitlement.find({ user: sessionUser(req).id, itemType: 'course', ...active() }).sort({ grantedAt: -1 });
    const courses = await Course.find({ _id: { $in: grants.map((g) => g.item) } });
    const byId = new Map(courses.map((c) => [String(c._id), c as CourseDoc]));
    const data: LibraryCourse[] = grants.flatMap((g) => {
      const course = byId.get(String(g.item));
      return course
        ? [{ ...toCourseSummary(course), purchasedAt: (g.grantedAt ?? new Date()).toISOString(), expiresAt: g.expiresAt ? g.expiresAt.toISOString() : null }]
        : [];
    });
    res.json({ data });
  }),
);
