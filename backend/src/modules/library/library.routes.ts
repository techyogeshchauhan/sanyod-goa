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

/** `book` must have been loaded with `+pdf`; `orderNumber` comes from the grant's payment. */
async function libraryBook(book: BookDoc, grantedAt: Date, orderNumber: string | null): Promise<LibraryBook> {
  return {
    ...toBookDetail(book),
    purchasedAt: grantedAt.toISOString(),
    orderNumber,
    fileSizeBytes: await fileSize(book.pdf),
  };
}

async function orderNumberOf(paymentId: unknown): Promise<string | null> {
  if (!paymentId) return null;
  const payment = await Payment.findById(paymentId, 'orderNumber').lean();
  return payment?.orderNumber ?? null;
}

/** my_books.php: books the user may read. */
libraryRouter.get(
  '/books',
  asyncHandler(async (req, res) => {
    const grants = await Entitlement.find({ user: sessionUser(req).id, itemType: 'book_pdf', ...active() }).sort({ grantedAt: -1 });
    // Books (with their PDF key) and payments in two parallel queries, not two per book.
    const paymentIds = grants.map((g) => g.payment).filter(Boolean);
    const [books, payments] = await Promise.all([
      Book.find({ _id: { $in: grants.map((g) => g.item) } }).select('+pdf'),
      paymentIds.length ? Payment.find({ _id: { $in: paymentIds } }, 'orderNumber').lean() : Promise.resolve([]),
    ]);
    const bookById = new Map(books.map((b) => [String(b._id), b]));
    const orderById = new Map(payments.map((p) => [String(p._id), p.orderNumber ?? null]));
    const data = await Promise.all(
      grants.flatMap((g) => {
        const book = bookById.get(String(g.item));
        return book ? [libraryBook(book, g.grantedAt ?? new Date(), orderById.get(String(g.payment)) ?? null)] : [];
      }),
    );
    res.json({ data: data satisfies LibraryBook[] });
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
    res.json({ data: await libraryBook(book, grant.grantedAt ?? new Date(), await orderNumberOf(grant.payment)) });
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
