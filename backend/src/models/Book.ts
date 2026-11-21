import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/** MySQL `books`: id, book_title, book_author, price, description, cover, pdf. */
const bookSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true }, // books_details.php?books=26
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    category: { type: String, trim: true, default: '' },
    language: { type: String, trim: true, default: '' },
    isFeatured: { type: Boolean, default: false },
    /** paise; null = price not set yet, the book can't be bought. */
    pricePdf: { type: Number, min: 0, default: null },
    /** paise; set explicitly for this book (null = not for sale). */
    priceHardcopy: { type: Number, min: 0, default: null },
    hardcopyAvailable: { type: Boolean, default: true },
    pages: { type: Number, min: 1 },
    publishedYear: { type: Number, min: 1900, max: 2100 },
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, min: 0 },
    /** Public path, e.g. /Books/book_6944e13695250.png */
    cover: { type: String, required: true },
    /** Private storage key, e.g. Books_pdf/bookpdf_6944e136963a3.pdf. Never served directly. */
    pdf: { type: String, select: false },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bookSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });

export type BookAttrs = InferSchemaType<typeof bookSchema>;
export type BookDoc = HydratedDocument<BookAttrs>;
export const Book = model('Book', bookSchema);
