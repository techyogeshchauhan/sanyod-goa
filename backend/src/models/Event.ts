import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { EVENT_CATEGORIES } from '../shared/constants';

/** Programmes on programes.php: retreats, seminars & workshops, online classes. */
const eventSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true }, // data-event-id
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    description: { type: String, default: '' },
    badge: { type: String, trim: true }, // Featured, Popular, Workshop, New, Online
    /** null for "Online - Anytime" programmes. */
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    /** Display text as on the PHP cards ("October 15, 2026", "9:00 AM - 5:00 PM", "Flexible"). */
    dateText: { type: String, trim: true },
    timeText: { type: String, trim: true },
    durationText: { type: String, trim: true }, // "3 Days", "3 Hours"
    location: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 }, // paise
    /** Public path, e.g. /Books/retreat.jpg */
    image: { type: String },
    capacity: { type: Number, min: 0 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    ctaLabel: { type: String, enum: ['Book Now', 'Enroll Now'], default: 'Book Now' },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

eventSchema.index({ category: 1, isPublished: 1, sortOrder: 1 });

export type EventAttrs = InferSchemaType<typeof eventSchema>;
export type EventDoc = HydratedDocument<EventAttrs>;
export const Event = model('Event', eventSchema);
