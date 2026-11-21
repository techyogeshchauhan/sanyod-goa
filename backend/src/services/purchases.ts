import { randomInt } from 'node:crypto';
import type { Types } from 'mongoose';
import { Book } from '../models/Book';
import { Course } from '../models/Course';
import { Entitlement } from '../models/Entitlement';
import { Order } from '../models/Order';
import { Payment, type PaymentDoc } from '../models/Payment';
import { getSettings } from '../models/Settings';
import { User } from '../models/User';
import { ORDER_NUMBER_PREFIX } from '../shared/constants';
import type { CreatePaymentInput } from '../shared/schemas/purchases';
import type { SessionAdmin, SessionUser } from '../shared/types/auth';
import type { BookPurchaseStatus, CoursePurchaseStatus, ItemType, OrderStatus } from '../shared/types/catalog';
import { formatRupees } from '../shared/utils/text';
import { AppError, badRequest, conflict, notFound } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendMail } from './email/mailer';
import { adminNotificationEmail } from './email/templates/adminNotification';
import {
  orderStatusEmail,
  paymentApprovedEmail,
  paymentRejectedEmail,
  purchaseConfirmationEmail,
} from './email/templates/orders';
import { deleteStored, saveUpload } from './storage';

export async function adminNotifyAddress(): Promise<string> {
  const settings = await getSettings();
  return settings.adminNotifyEmail?.trim() ?? '';
}

/** ORD + YYYYMMDDHHMMSS (India time) + 3 random digits, as generateOrderNumber() in PHP. */
export function generateOrderNumber(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const stamp = ist.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `${ORDER_NUMBER_PREFIX}${stamp}${randomInt(100, 1000)}`;
}

const isDuplicateKey = (err: unknown): err is { code: number; keyPattern?: Record<string, unknown> } =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

/** Price of an item in paise, decided by the server (never by the form). */
async function priceItem(itemType: ItemType, slug: string) {
  if (itemType === 'course') {
    const course = await Course.findOne({ slug, isPublished: true });
    if (!course) throw notFound('Course not found');
    return { item: course._id, title: course.title, amount: course.price };
  }
  const book = await Book.findOne({ slug, isPublished: true });
  if (!book) throw notFound('Book not found');
  const amount = itemType === 'book_pdf' ? book.pricePdf : book.priceHardcopy;
  if (amount == null) throw badRequest('This book is not available for purchase yet.');
  if (itemType === 'book_hardcopy' && book.hardcopyAvailable === false) throw badRequest('The hard book is currently not available.');
  return { item: book._id, title: book.title, amount };
}

export async function createPayment(
  user: SessionUser,
  input: CreatePaymentInput,
  screenshot: Express.Multer.File | undefined,
): Promise<{ payment: PaymentDoc; emailSent: boolean }> {
  if (!screenshot) throw badRequest('Please upload your payment screenshot', { screenshot: 'Please upload your payment screenshot' });
  const { item, title, amount } = await priceItem(input.itemType, input.itemSlug);

  // Block a second purchase while one is pending or after it was approved (PHP disabled the buttons).
  const existing = await Payment.findOne({ user: user.id, itemType: input.itemType, item, status: { $in: ['pending', 'approved'] } });
  if (existing) {
    throw conflict(
      existing.status === 'approved' ? 'ALREADY_PURCHASED' : 'PAYMENT_PENDING',
      existing.status === 'approved'
        ? 'You have already purchased this item.'
        : 'Your payment for this item is already under review. Please wait for admin approval.',
    );
  }

  // Access granted another way (approved hard copy, or a manual grant by the admin).
  if (input.itemType !== 'book_hardcopy' && (await hasEntitlement(user.id, input.itemType, item))) {
    throw conflict('ALREADY_PURCHASED', 'You already have access to this item.');
  }

  const settings = await getSettings();
  const configuredUpi = input.itemType === 'course'
    ? settings.upiIdDefault
    : input.itemType === 'book_pdf'
      ? settings.upiIdPdf
      : settings.upiIdHardcopy;
  const configuredQr = input.itemType === 'course' ? settings.qrImageCourses : settings.qrImageBooks;
  if (!configuredUpi?.trim() && !configuredQr?.trim()) {
    throw badRequest('Payment details are not configured yet. Please contact the site administrator.');
  }

  const activePurchaseKey = `${user.id}:${input.itemType}:${String(item)}`;
  let screenshotKey: string | undefined;
  let payment: PaymentDoc | null = null;
  try {
    screenshotKey = await saveUpload('private', 'screenshots', screenshot, 'payment');
    for (let attempt = 0; attempt < 3 && !payment; attempt++) {
      try {
        payment = await Payment.create({
          user: user.id,
          itemType: input.itemType,
          item,
          amount,
          paymentMethod: input.itemType === 'course' ? input.paymentMethod : 'upi',
          upiTransactionId: input.upiTransactionId,
          screenshot: screenshotKey,
          activePurchaseKey,
          orderNumber: generateOrderNumber(),
          shippingAddress: input.itemType === 'book_hardcopy' ? input.shippingAddress : undefined,
        });
      } catch (err) {
        if (isDuplicateKey(err) && err.keyPattern?.orderNumber) continue; // order number clash: retry
        throw err;
      }
    }
    if (!payment) throw new AppError(500, 'ORDER_NUMBER', 'Could not create the order. Please try again.');

    if (input.itemType === 'book_hardcopy') {
      const order = await Order.create({
        orderNumber: payment.orderNumber,
        user: user.id,
        book: item,
        payment: payment._id,
        amount,
        shippingAddress: input.shippingAddress,
        status: 'pending',
        statusHistory: [{ status: 'pending' }],
      });
      payment.order = order._id;
      await payment.save();
    }
  } catch (err) {
    if (payment) await Payment.deleteOne({ _id: payment._id });
    await deleteStored('private', screenshotKey);
    if (isDuplicateKey(err) && err.keyPattern?.activePurchaseKey) {
      throw conflict('PURCHASE_PENDING', 'A purchase for this item is already being processed. Please check your orders.');
    }
    if (isDuplicateKey(err) && err.keyPattern?.upiTransactionId) {
      throw conflict('DUPLICATE_TRANSACTION', 'This transaction ID has already been submitted.', {
        upiTransactionId: 'This transaction ID has already been submitted.',
      });
    }
    throw err;
  }

  const emailSent = await sendMail(
    purchaseConfirmationEmail({
      to: user.email,
      name: user.name,
      kind: input.itemType,
      title,
      orderNumber: payment.orderNumber,
      amount,
      transactionId: input.upiTransactionId,
      date: new Date(),
    }),
  );
  await sendMail(
    adminNotificationEmail(await adminNotifyAddress(), `New Order Received - ${payment.orderNumber}`, {
      Order: payment.orderNumber,
      Customer: `${user.name} (${user.email})`,
      Item: title,
      Type: input.itemType,
      Amount: formatRupees(amount),
      'Transaction ID': input.upiTransactionId,
    }),
  );
  return { payment, emailSent };
}

// ---- Purchase status ---------------------------------------------------------

export async function bookPurchaseStatus(userId: string, bookId: Types.ObjectId | string): Promise<BookPurchaseStatus> {
  const [pdf, hard, access] = await Promise.all([
    Payment.findOne({ user: userId, item: bookId, itemType: 'book_pdf' }).sort({ createdAt: -1 }),
    Payment.findOne({ user: userId, item: bookId, itemType: 'book_hardcopy' }).sort({ createdAt: -1 }),
    hasEntitlement(userId, 'book_pdf', bookId),
  ]);
  const order = hard?.order ? await Order.findById(hard.order, 'status') : null;
  return {
    pdf: pdf?.status ?? null,
    hardcopy: hard?.status ?? null,
    hardcopyOrderStatus: (order?.status as OrderStatus | undefined) ?? null,
    canRead: access,
  };
}

export async function coursePurchaseStatus(userId: string, courseId: Types.ObjectId | string): Promise<CoursePurchaseStatus> {
  const [latest, access] = await Promise.all([
    Payment.findOne({ user: userId, item: courseId, itemType: 'course' }).sort({ createdAt: -1 }),
    hasEntitlement(userId, 'course', courseId),
  ]);
  return { status: access ? 'approved' : (latest?.status ?? null), canWatch: access };
}

export async function hasEntitlement(userId: string, itemType: 'book_pdf' | 'course', item: Types.ObjectId | string): Promise<boolean> {
  const found = await Entitlement.exists({
    user: userId,
    itemType,
    item,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  return Boolean(found);
}

// ---- Admin review ------------------------------------------------------------

async function grantFor(payment: PaymentDoc) {
  const itemType = payment.itemType === 'course' ? 'course' : 'book_pdf'; // an approved hard copy also unlocks the PDF (D-06)
  await Entitlement.updateOne(
    { user: payment.user, itemType, item: payment.item },
    { $setOnInsert: { user: payment.user, itemType, item: payment.item, payment: payment._id, grantedAt: new Date(), expiresAt: null } },
    { upsert: true },
  );
}

async function itemTitle(payment: PaymentDoc): Promise<string> {
  const doc = payment.itemType === 'course' ? await Course.findById(payment.item, 'title') : await Book.findById(payment.item, 'title');
  return doc?.title ?? 'your purchase';
}

export async function approvePayment(paymentId: string, admin: SessionAdmin): Promise<PaymentDoc> {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw notFound('Payment not found');
  if (payment.status === 'approved') return payment;
  payment.status = 'approved';
  payment.activePurchaseKey = `${String(payment.user)}:${payment.itemType}:${String(payment.item)}`;
  payment.reviewedBy = admin.id as unknown as Types.ObjectId;
  payment.reviewedAt = new Date();
  payment.rejectionReason = undefined;
  try {
    await payment.save();
  } catch (err) {
    if (isDuplicateKey(err) && err.keyPattern?.activePurchaseKey) {
      throw conflict('PURCHASE_ACTIVE', 'Another active purchase already exists for this item.');
    }
    throw err;
  }
  await grantFor(payment);
  if (payment.order) {
    await Order.updateOne(
      { _id: payment.order, status: { $in: ['pending', 'cancelled'] } },
      { $set: { status: 'processing' }, $push: { statusHistory: { status: 'processing', at: new Date(), by: admin.id } } },
    );
  }
  const user = await User.findById(payment.user, 'name email');
  if (user) {
    await sendMail(
      paymentApprovedEmail({ to: user.email, name: user.name, kind: payment.itemType, title: await itemTitle(payment), orderNumber: payment.orderNumber }),
    );
  }
  return payment;
}

export async function rejectPayment(paymentId: string, admin: SessionAdmin, reason?: string): Promise<PaymentDoc> {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw notFound('Payment not found');
  const wasApproved = payment.status === 'approved';
  payment.status = 'rejected';
  payment.activePurchaseKey = undefined;
  payment.reviewedBy = admin.id as unknown as Types.ObjectId;
  payment.reviewedAt = new Date();
  payment.rejectionReason = reason || undefined;
  await payment.save();
  if (wasApproved) await Entitlement.deleteMany({ payment: payment._id });
  if (payment.order) {
    await Order.updateOne(
      { _id: payment.order },
      { $set: { status: 'cancelled' }, $push: { statusHistory: { status: 'cancelled', at: new Date(), by: admin.id } } },
    );
  }
  const user = await User.findById(payment.user, 'name email');
  if (user) {
    await sendMail(paymentRejectedEmail({ to: user.email, name: user.name, title: await itemTitle(payment), orderNumber: payment.orderNumber, reason }));
  }
  return payment;
}

export async function updateOrderStatus(
  orderId: string,
  admin: SessionAdmin,
  update: { status: OrderStatus; courier?: string; trackingNumber?: string; notify?: boolean },
) {
  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found');
  const changed = order.status !== update.status;
  order.status = update.status;
  if (update.courier !== undefined) order.courier = update.courier || undefined;
  if (update.trackingNumber !== undefined) order.trackingNumber = update.trackingNumber || undefined;
  if (changed) order.statusHistory.push({ status: update.status, at: new Date(), by: admin.id as unknown as Types.ObjectId });
  await order.save();
  if (changed && update.notify !== false && ['shipped', 'delivered', 'cancelled'].includes(update.status)) {
    const [user, book] = await Promise.all([User.findById(order.user, 'name email'), Book.findById(order.book, 'title')]);
    if (user) {
      await sendMail(
        orderStatusEmail({
          to: user.email,
          name: user.name,
          title: book?.title ?? 'your book',
          orderNumber: order.orderNumber,
          status: update.status,
          courier: order.courier,
          trackingNumber: order.trackingNumber,
        }),
      ).catch((err) => logger.warn({ err }, 'order status email failed'));
    }
  }
  return order;
}
