import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ITEM_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../shared/constants';
import { addressSchema } from './shared';

const ITEM_MODEL = { book_pdf: 'Book', book_hardcopy: 'Book', course: 'Course' } as const;

/**
 * MySQL `payments` (+ course payments): a UPI transaction ID and screenshot that an admin approves.
 * purchase_type 'pdf' → book_pdf, 'hardbook' → book_hardcopy.
 */
const paymentSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ITEM_TYPES, required: true },
    item: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: function (this: { itemType: keyof typeof ITEM_MODEL }) {
        return ITEM_MODEL[this.itemType];
      },
    },
    amount: { type: Number, required: true, min: 0 }, // paise, set by the server
    /** Method chosen on payment.php (books always use UPI). */
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'upi' },
    upiTransactionId: { type: String, required: true, trim: true },
    /** Private storage key of the payment screenshot (PHP: uploads/<time>_<name>). */
    screenshot: { type: String, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    /** ORD + YYYYMMDDHHMMSS + 3 digits. PHP stored this in payments.order_id for PDFs. */
    orderNumber: { type: String, required: true, unique: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' }, // hard copy only
    shippingAddress: {
      type: addressSchema,
      required: function (this: { itemType: string }) {
        return this.itemType === 'book_hardcopy';
      },
    },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, itemType: 1, item: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
// The same UPI transaction can't be claimed twice, unless the earlier claim was rejected.
paymentSchema.index(
  { itemType: 1, upiTransactionId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } },
);

export type PaymentAttrs = InferSchemaType<typeof paymentSchema>;
export type PaymentDoc = HydratedDocument<PaymentAttrs>;
export const Payment = model('Payment', paymentSchema);
