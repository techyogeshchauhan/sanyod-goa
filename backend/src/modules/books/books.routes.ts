import { Router } from 'express';
import { Book } from '../../models/Book';
import type { BookDetailResponse } from '../../shared/types/catalog';
import { bookPurchaseStatus } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';
import { toBookDetail, toBookSummary } from '../catalog/serializers';

export const booksRouter = Router();

/** books.php: published books, in admin order then newest first. */
booksRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const books = await Book.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ data: books.map(toBookSummary) });
  }),
);

/** books_details.php: the book plus, for a logged-in user, their purchase status. */
booksRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const book = await Book.findOne({ slug: req.params.slug, isPublished: true });
    if (!book) throw notFound('Book not found!');
    const user = req.session.user;
    const data: BookDetailResponse = {
      book: toBookDetail(book),
      purchase: user ? await bookPurchaseStatus(user.id, book._id) : null,
    };
    res.json({ data });
  }),
);
