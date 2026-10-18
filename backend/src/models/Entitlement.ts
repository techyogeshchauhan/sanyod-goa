import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ENTITLEMENT_TYPES } from '../shared/constants';

const ITEM_MODEL = { book_pdf: 'Book', course: 'Course' } as const;

/**
 * What a user may open (PDF reader, paid course videos). Created when an admin approves a payment.
 * PHP had no table for this: it re-checked payments.payment_status = 'approved' on every page.
 */
const entitlementSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ENTITLEMENT_TYPES, required: true },
    item: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: function (this: { itemType: keyof typeof ITEM_MODEL }) {
        return ITEM_MODEL[this.itemType];
      },
    },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    grantedAt: { type: Date, default: Date.now },
    /** null = lifetime access. */
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

entitlementSchema.index({ user: 1, itemType: 1, item: 1 }, { unique: true });

export type EntitlementAttrs = InferSchemaType<typeof entitlementSchema>;
export type EntitlementDoc = HydratedDocument<EntitlementAttrs>;
export const Entitlement = model('Entitlement', entitlementSchema);
