import { Router } from 'express';
import { z } from 'zod';
import { requireUser, sessionUser } from '../../middleware/auth';
import { formLimiter } from '../../middleware/rateLimit';
import { imageField, uploadedFile, uploadFields } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { Order } from '../../models/Order';
import { Payment } from '../../models/Payment';
import { createPaymentSchema, type CreatePaymentInput } from '../../shared/schemas/purchases';
import type { PaymentCreated } from '../../shared/types/catalog';
import { createPayment } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';
import { toOrderSummary, toPaymentSummary } from '../catalog/serializers';

export const paymentsRouter = Router();
export const ordersRouter = Router();

const ITEM_FIELDS = 'title slug cover image';
const objectId = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id') });

/** Book (PDF / hard copy) or course purchase: UPI transaction ID + screenshot, reviewed by the admin. */
paymentsRouter.post(
  '/',
  requireUser,
  formLimiter,
  uploadFields([imageField('screenshot')]),
  validate({ body: createPaymentSchema }),
  asyncHandler(async (req, res) => {
    const { payment, emailSent } = await createPayment(sessionUser(req), req.body as CreatePaymentInput, uploadedFile(req, 'screenshot'));
    await payment.populate('item', ITEM_FIELDS);
    const data: PaymentCreated = { payment: toPaymentSummary(payment), emailSent };
    res.status(201).json({ data });
  }),
);

paymentsRouter.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const payments = await Payment.find({ user: sessionUser(req).id }).sort({ createdAt: -1 }).populate('item', ITEM_FIELDS);
    res.json({ data: payments.map(toPaymentSummary) });
  }),
);

paymentsRouter.get(
  '/:id',
  requireUser,
  validate({ params: objectId }),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ _id: req.params.id, user: sessionUser(req).id }).populate('item', ITEM_FIELDS);
    if (!payment) throw notFound('Payment not found');
    res.json({ data: toPaymentSummary(payment) });
  }),
);

/** My Orders: every purchase of the user, with shipping progress for hard copies. */
ordersRouter.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const userId = sessionUser(req).id;
    const [payments, orders] = await Promise.all([
      Payment.find({ user: userId }).sort({ createdAt: -1 }).populate('item', ITEM_FIELDS),
      Order.find({ user: userId }),
    ]);
    const byPayment = new Map(orders.map((o) => [String(o.payment), o]));
    res.json({ data: payments.map((p) => toOrderSummary(p, byPayment.get(String(p._id)) ?? null)) });
  }),
);

ordersRouter.get(
  '/:orderNumber',
  requireUser,
  validate({ params: z.object({ orderNumber: z.string().regex(/^ORD\d{17}$/, 'Invalid order number') }) }),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ orderNumber: req.params.orderNumber, user: sessionUser(req).id }).populate('item', ITEM_FIELDS);
    if (!payment) throw notFound('Order not found');
    const order = payment.order ? await Order.findById(payment.order) : null;
    res.json({ data: toOrderSummary(payment, order) });
  }),
);
