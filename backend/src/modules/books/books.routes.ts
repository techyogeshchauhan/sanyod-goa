import { Router } from 'express';
import { z } from 'zod';
import { Book } from '../../models/Book';
import { validate } from '../../middleware/validate';
import type { BookDetailResponse } from '../../shared/types/catalog';
import { bookPurchaseStatus } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';
import { toBookDetail, toBookSummary } from '../catalog/serializers';

export const booksRouter = Router();

const bookQuery = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(100).optional(),
  language: z.string().trim().max(80).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

function regexEscape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** books.php: published books, in admin order then newest first. */
booksRouter.get(
  '/',
  validate({ query: bookQuery }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof bookQuery>;
    const filter: Record<string, unknown> = { isPublished: true };
    if (query.category) filter.category = query.category;
    if (query.language) filter.language = query.language;
    if (query.featured === 'true') filter.isFeatured = true;
    if (query.featured === 'false') filter.isFeatured = false;
    if (query.q) {
      const matcher = new RegExp(regexEscape(query.q), 'i');
      filter.$or = ['title', 'author', 'description', 'category', 'language'].map((field) => ({ [field]: matcher }));
    }
    const books = await Book.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ data: books.map(toBookSummary) });
  }),
);

booksRouter.get(
  '/filters',
  asyncHandler(async (_req, res) => {
    const filter = { isPublished: true };
    const [categories, languages] = await Promise.all([
      Book.distinct('category', { ...filter, category: { $nin: ['', null] } }),
      Book.distinct('language', { ...filter, language: { $nin: ['', null] } }),
    ]);
    res.json({
      data: {
        categories: (categories as string[]).sort((a, b) => a.localeCompare(b)),
        languages: (languages as string[]).sort((a, b) => a.localeCompare(b)),
      },
    });
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
