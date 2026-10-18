import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { BOOKING_STATUSES } from '../shared/constants';

/** Booking modal on programes.php: name, email, phone and the UPI transaction ID. No login required. */
const eventBookingSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // set when the visitor is logged in
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    amount: { type: Number, required: true, min: 0 }, // paise, copied from the event
    upiTransactionId: { type: String, required: true, trim: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

eventBookingSchema.index({ event: 1, status: 1, createdAt: -1 });
// A UPI transaction can back only one active booking.
eventBookingSchema.index(
  { upiTransactionId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } },
);

export type EventBookingAttrs = InferSchemaType<typeof eventBookingSchema>;
export type EventBookingDoc = HydratedDocument<EventBookingAttrs>;
export const EventBooking = model('EventBooking', eventBookingSchema);
