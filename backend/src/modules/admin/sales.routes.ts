import { Router } from 'express';
import type { Types } from 'mongoose';
import { sessionAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Book } from '../../models/Book';
import { Consultation } from '../../models/Consultation';
import { Course } from '../../models/Course';
import { EventBooking } from '../../models/EventBooking';
import { ContactMessage, GuidanceRequest } from '../../models/FormSubmissions';
import { Order, type OrderDoc } from '../../models/Order';
import { Payment, type PaymentDoc } from '../../models/Payment';
import { User } from '../../models/User';
import { ITEM_TYPES, ORDER_STATUSES } from '../../shared/constants';
import {
  idParamSchema,
  listQuerySchema,
  rejectPaymentSchema,
  updateOrderSchema,
  type ListQuery,
} from '../../shared/schemas/admin';
import type { AdminOrder, AdminPayment, DashboardStats, UserRef } from '../../shared/types/admin';
import type { ItemType, OrderStatus } from '../../shared/types/catalog';
import { approvePayment, rejectPayment, updateOrderStatus } from '../../services/purchases';
import { sendPrivateFile } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';
import { toAddress } from '../catalog/serializers';
import { audit, createdAt, escapeRegex, iso, paged, skip } from './helpers';

export const salesRouter = Router();

const userRef = (u: unknown): UserRef | null => {
  if (!u || typeof u !== 'object' || !('email' in u)) return null;
  const v = u as { _id: Types.ObjectId; name: string; email: string };
  return { id: String(v._id), name: v.name, email: v.email };
};
const itemRef = (i: unknown) => {
  if (i && typeof i === 'object' && 'title' in i) {
    const v = i as { _id: Types.ObjectId; title: string };
    return { id: String(v._id), title: v.title };
  }
  return { id: String(i ?? ''), title: '(deleted item)' };
};

export function toAdminPayment(p: PaymentDoc): AdminPayment {
  const item = itemRef(p.item);
  const reviewer = p.reviewedBy as unknown as { username?: string } | null;
  return {
    id: String(p._id),
    orderNumber: p.orderNumber,
    user: userRef(p.user),
    itemType: p.itemType,
    itemId: item.id,
    itemTitle: item.title,
    amount: p.amount,
    paymentMethod: p.paymentMethod ?? 'upi',
    upiTransactionId: p.upiTransactionId,
    status: p.status ?? 'pending',
    rejectionReason: p.rejectionReason ?? null,
    reviewedBy: reviewer && typeof reviewer === 'object' && 'username' in reviewer ? (reviewer.username ?? null) : null,
    reviewedAt: iso(p.reviewedAt),
    orderId: p.order ? String(p.order) : null,
    shippingAddress: toAddress(p.shippingAddress),
    createdAt: createdAt(p),
  };
}

function toAdminOrder(o: OrderDoc): AdminOrder {
  const pay = o.payment as unknown as { _id: Types.ObjectId; status?: string } | null;
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    user: userRef(o.user),
    bookTitle: itemRef(o.book).title,
    amount: o.amount,
    paymentStatus: (pay && typeof pay === 'object' && 'status' in pay ? pay.status : null) as AdminOrder['paymentStatus'],
    paymentId: String(pay && typeof pay === 'object' && '_id' in pay ? pay._id : o.payment),
    status: o.status ?? 'pending',
    courier: o.courier ?? null,
    trackingNumber: o.trackingNumber ?? null,
    shippingAddress: toAddress(o.shippingAddress) ?? { fullName: '', phone: '', address: '', city: '', state: '', pincode: '' },
    statusHistory: (o.statusHistory ?? []).map((h) => ({ status: h.status, at: iso(h.at) ?? '' })),
    createdAt: createdAt(o),
  };
}

const populatePayment = (q: ReturnType<typeof Payment.find> | ReturnType<typeof Payment.findById>) =>
  q.populate('user', 'name email').populate('item', 'title').populate('reviewedBy', 'username');

// ---- Dashboard -----------------------------------------------------------------

salesRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [users, newUsers, pendingByType, ordersByStatus, consultations, bookings, contact, guidance, revenue, revenueMonth, recent] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: monthStart } }),
        Payment.aggregate<{ _id: ItemType; n: number }>([{ $match: { status: 'pending' } }, { $group: { _id: '$itemType', n: { $sum: 1 } } }]),
        Order.aggregate<{ _id: OrderStatus; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
        Consultation.countDocuments({ status: 'pending' }),
        EventBooking.countDocuments({ status: 'pending' }),
        ContactMessage.countDocuments({ status: 'new' }),
        GuidanceRequest.countDocuments({ status: 'new' }),
        Payment.aggregate<{ total: number }>([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Payment.aggregate<{ total: number }>([
          { $match: { status: 'approved', reviewedAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        populatePayment(Payment.find().sort({ createdAt: -1 }).limit(8)),
      ]);
    const pendingPayments = Object.fromEntries(ITEM_TYPES.map((t) => [t, 0])) as Record<ItemType, number>;
    for (const r of pendingByType) pendingPayments[r._id] = r.n;
    const orders = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const r of ordersByStatus) orders[r._id] = r.n;
    const data: DashboardStats = {
      users,
      newUsersThisMonth: newUsers,
      pendingPayments,
      ordersByStatus: orders,
      pendingConsultations: consultations,
      pendingBookings: bookings,
      newMessages: contact + guidance,
      revenueThisMonth: revenueMonth[0]?.total ?? 0,
      revenueTotal: revenue[0]?.total ?? 0,
      recentPayments: (recent as PaymentDoc[]).map(toAdminPayment),
    };
    res.json({ data: { ...data, admin: req.session.admin } });
  }),
);

// ---- Payments ------------------------------------------------------------------

async function paymentFilter(q: ListQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.itemType) filter.itemType = q.itemType;
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), 'i');
    const [users, books, courses] = await Promise.all([
      User.find({ $or: [{ name: re }, { email: re }] }, '_id').limit(200),
      Book.find({ title: re }, '_id').limit(200),
      Course.find({ title: re }, '_id').limit(200),
    ]);
    filter.$or = [
      { orderNumber: re },
      { upiTransactionId: re },
      { user: { $in: users.map((u) => u._id) } },
      { item: { $in: [...books, ...courses].map((d) => d._id) } },
    ];
  }
  return filter;
}

salesRouter.get(
  '/payments',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = await paymentFilter(q);
    const [items, total] = await Promise.all([
      populatePayment(Payment.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize)),
      Payment.countDocuments(filter),
    ]);
    res.json(paged((items as PaymentDoc[]).map(toAdminPayment), total, q));
  }),
);

salesRouter.get(
  '/payments/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const payment = (await populatePayment(Payment.findById(req.params.id))) as PaymentDoc | null;
    if (!payment) throw notFound('Payment not found');
    res.json({ data: toAdminPayment(payment) });
  }),
);

/** The uploaded payment screenshot (private file). */
salesRouter.get(
  '/payments/:id/screenshot',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id, 'screenshot orderNumber');
    if (!payment) throw notFound('Payment not found');
    await sendPrivateFile(res, payment.screenshot, { filename: `${payment.orderNumber}-screenshot` });
  }),
);

salesRouter.post(
  '/payments/:id/approve',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const payment = await approvePayment(String(req.params.id), sessionAdmin(req));
    await audit(req, 'payment.approve', 'Payment', payment._id, { orderNumber: payment.orderNumber });
    const full = (await populatePayment(Payment.findById(payment._id))) as PaymentDoc;
    res.json({ data: toAdminPayment(full) });
  }),
);

salesRouter.post(
  '/payments/:id/reject',
  validate({ params: idParamSchema, body: rejectPaymentSchema }),
  asyncHandler(async (req, res) => {
    const { reason } = req.body as { reason?: string };
    const payment = await rejectPayment(String(req.params.id), sessionAdmin(req), reason);
    await audit(req, 'payment.reject', 'Payment', payment._id, { orderNumber: payment.orderNumber, reason });
    const full = (await populatePayment(Payment.findById(payment._id))) as PaymentDoc;
    res.json({ data: toAdminPayment(full) });
  }),
);

// ---- Orders (hard copies) -------------------------------------------------------------

salesRouter.get(
  '/orders',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;
    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      const users = await User.find({ $or: [{ name: re }, { email: re }] }, '_id').limit(200);
      filter.$or = [
        { orderNumber: re },
        { trackingNumber: re },
        { 'shippingAddress.fullName': re },
        { 'shippingAddress.phone': re },
        { user: { $in: users.map((u) => u._id) } },
      ];
    }
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip(q))
        .limit(q.pageSize)
        .populate('user', 'name email')
        .populate('book', 'title')
        .populate('payment', 'status'),
      Order.countDocuments(filter),
    ]);
    res.json(paged(items.map(toAdminOrder), total, q));
  }),
);

salesRouter.patch(
  '/orders/:id',
  validate({ params: idParamSchema, body: updateOrderSchema }),
  asyncHandler(async (req, res) => {
    const order = await updateOrderStatus(String(req.params.id), sessionAdmin(req), req.body);
    await audit(req, 'order.update', 'Order', order._id, req.body as Record<string, unknown>);
    const full = await Order.findById(order._id).populate('user', 'name email').populate('book', 'title').populate('payment', 'status');
    res.json({ data: toAdminOrder(full as OrderDoc) });
  }),
);
