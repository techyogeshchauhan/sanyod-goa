import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import type { CourseSummary } from '../shared/types/course';
import { originalPrice } from '../shared/utils/text';
import { publicUrl } from '../services/storage';

const courseSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** Public path (frontend/public), e.g. /Courses/1769870100_109497.png */
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // paise
    discountPercent: { type: Number, default: 0, min: 0, max: 99 },
    level: { type: String, default: '' },
    hasCertificate: { type: Boolean, default: false },
    /** Denormalised count of published videos. */
    videoCount: { type: Number, default: 0, min: 0 },
    /** Position in the home page "Most Popular" list (1 = first); null = not listed. */
    popularRank: { type: Number, default: null },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

courseSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });

export type CourseAttrs = InferSchemaType<typeof courseSchema>;
export type CourseDoc = HydratedDocument<CourseAttrs>;
export const Course = model('Course', courseSchema);

export function toCourseSummary(c: CourseDoc): CourseSummary {
  return {
    id: c.id as string,
    legacyId: c.legacyId ?? null,
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    image: publicUrl(c.image) ?? '',
    price: c.price,
    discountPercent: c.discountPercent ?? 0,
    originalPrice: originalPrice(c.price, c.discountPercent ?? 0),
    videoCount: c.videoCount ?? 0,
    level: c.level ?? '',
    hasCertificate: c.hasCertificate ?? false,
  };
}
