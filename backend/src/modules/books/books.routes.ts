import { Router } from 'express';
import { z } from 'zod';
import { Book } from '../../models/Book';
import { validate } from '../../middleware/validate';
import type { BookDetailResponse } from '../../shared/types/catalog';
import { browserCache, cached } from '../../services/cache';
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
  browserCache(),
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
    const load = async () => (await Book.find(filter).sort({ sortOrder: 1, createdAt: -1 })).map(toBookSummary);
    // The plain list (what the Books page asks for) is cached; searches and filters go to the database.
    const filtered = Object.keys(filter).length > 1;
    const data = filtered ? await load() : await cached('books:list', load);
    res.json({ data });
  }),
);

booksRouter.get(
  '/filters',
  browserCache(),
  asyncHandler(async (_req, res) => {
    const data = await cached('books:filters', async () => {
      const filter = { isPublished: true };
      const [categories, languages] = await Promise.all([
        Book.distinct('category', { ...filter, category: { $nin: ['', null] } }),
        Book.distinct('language', { ...filter, language: { $nin: ['', null] } }),
      ]);
      return {
        categories: (categories as string[]).sort((a, b) => a.localeCompare(b)),
        languages: (languages as string[]).sort((a, b) => a.localeCompare(b)),
      };
    });
    res.json({ data });
  }),
);

/** books_details.php: the book plus, for a logged-in user, their purchase status. */
booksRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = req.params.slug ?? '';
    const book = await cached(`book:${slug}`, async () => {
      const doc = await Book.findOne({ slug, isPublished: true });
      return doc ? { id: String(doc._id), detail: toBookDetail(doc) } : null;
    });
    if (!book) throw notFound('Book not found!');
    const user = req.session.user;
    const data: BookDetailResponse = {
      book: book.detail,
      purchase: user ? await bookPurchaseStatus(user.id, book.id) : null,
    };
    res.json({ data });
  }),
);
