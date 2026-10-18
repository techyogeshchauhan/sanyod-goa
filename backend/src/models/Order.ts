import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ORDER_STATUSES } from '../shared/constants';
import { addressSchema } from './shared';

/** MySQL `orders`: physical delivery of a hard-copy book. Created together with its payment. */
const orderSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    orderNumber: { type: String, required: true, unique: true }, // same as the payment's
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 }, // paise
    shippingAddress: { type: addressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    courier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES, required: true },
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: 'Admin' },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export type OrderAttrs = InferSchemaType<typeof orderSchema>;
export type OrderDoc = HydratedDocument<OrderAttrs>;
export const Order = model('Order', orderSchema);
