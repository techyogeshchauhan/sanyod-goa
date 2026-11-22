import { Router } from 'express';
import type { Types } from 'mongoose';
import { requireSuperAdmin, sessionAdmin } from '../../middleware/auth';
import { imageField, uploadedFile, uploadFields } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { Admin } from '../../models/Admin';
import { AuditLog } from '../../models/AuditLog';
import { Book } from '../../models/Book';
import { Consultation } from '../../models/Consultation';
import { Course } from '../../models/Course';
import { Entitlement } from '../../models/Entitlement';
import { EventBooking } from '../../models/EventBooking';
import { ContactMessage, GuidanceRequest, NewsletterSubscriber } from '../../models/FormSubmissions';
import { Payment, type PaymentDoc } from '../../models/Payment';
import { getSettings } from '../../models/Settings';
import { User, type UserDoc } from '../../models/User';
import {
  changeOwnPasswordSchema,
  createAdminSchema,
  grantEntitlementSchema,
  idParamSchema,
  listQuerySchema,
  messageStatusSchema,
  settingsFormSchema,
  updateAdminSchema,
  updateUserSchema,
  type ListQuery,
  type SettingsFormInput,
} from '../../shared/schemas/admin';
import type {
  AdminAccount,
  AdminMessage,
  AdminSettings,
  AdminSubscriber,
  AdminUser,
  AdminUserDetail,
  AuditEntry,
} from '../../shared/types/admin';
import { generateOrderNumber } from '../../services/purchases';
import { deleteStored, publicUrl, saveUpload } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, badRequest, conflict, notFound } from '../../utils/errors';
import { hashPassword, verifyBcrypt } from '../../utils/passwords';
import { revokeAdminSessions } from '../../utils/session';
import { toAdminPayment } from './sales.routes';
import { audit, createdAt, iso, paged, searchFilter, skip } from './helpers';
import { z } from 'zod';

export const peopleRouter = Router();

// ---- Users ---------------------------------------------------------------------------

function toAdminUser(u: UserDoc, payments: number): AdminUser {
  return {
    id: String(u._id),
    legacyId: u.legacyId ?? null,
    name: u.name,
    email: u.email,
    isActive: u.isActive ?? true,
    lastLoginAt: iso(u.lastLoginAt),
    createdAt: createdAt(u),
    payments,
  };
}

peopleRouter.get(
  '/users',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = { ...searchFilter(q.q, ['name', 'email']), ...(q.status ? { isActive: q.status === 'active' } : {}) };
    const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize), User.countDocuments(filter)]);
    const counts = await Payment.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { user: { $in: items.map((u) => u._id) } } },
      { $group: { _id: '$user', n: { $sum: 1 } } },
    ]);
    const byUser = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json(paged(items.map((u) => toAdminUser(u, byUser.get(String(u._id)) ?? 0)), total, q));
  }),
);

peopleRouter.get(
  '/users/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User not found');
    const [payments, grants, consultations, bookings] = await Promise.all([
      Payment.find({ user: user._id }).sort({ createdAt: -1 }).populate('user', 'name email').populate('item', 'title').populate('reviewedBy', 'username'),
      Entitlement.find({ user: user._id }).sort({ grantedAt: -1 }),
      Consultation.countDocuments({ user: user._id }),
      EventBooking.countDocuments({ user: user._id }),
    ]);
    const [books, courses] = await Promise.all([
      Book.find({ _id: { $in: grants.filter((g) => g.itemType === 'book_pdf').map((g) => g.item) } }, 'title'),
      Course.find({ _id: { $in: grants.filter((g) => g.itemType === 'course').map((g) => g.item) } }, 'title'),
    ]);
    const titles = new Map([...books, ...courses].map((d) => [String(d._id), d.title]));
    const data: AdminUserDetail = {
      ...toAdminUser(user, payments.length),
      purchases: (payments as PaymentDoc[]).map(toAdminPayment),
      entitlements: grants.map((g) => ({
        id: String(g._id),
        itemType: g.itemType,
        itemId: String(g.item),
        itemTitle: titles.get(String(g.item)) ?? '(deleted item)',
        grantedAt: iso(g.grantedAt) ?? '',
      })),
      consultations,
      bookings,
    };
    res.json({ data });
  }),
);

peopleRouter.patch(
  '/users/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as { isActive: boolean };
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true });
    if (!user) throw notFound('User not found');
    await audit(req, isActive ? 'user.activate' : 'user.deactivate', 'User', user._id, { email: user.email });
    res.json({ data: toAdminUser(user, await Payment.countDocuments({ user: user._id })) });
  }),
);

// ---- Manual access grants -----------------------------------------------------------------

peopleRouter.post(
  '/entitlements',
  validate({ body: grantEntitlementSchema }),
  asyncHandler(async (req, res) => {
    const { userId, itemType, itemId } = req.body as z.infer<typeof grantEntitlementSchema>;
    const [user, item] = await Promise.all([
      User.exists({ _id: userId }),
      itemType === 'course' ? Course.exists({ _id: itemId }) : Book.exists({ _id: itemId }),
    ]);
    if (!user || !item) throw notFound('User or item not found');
    // A manual grant has no payment of its own: record a zero-amount approved payment for the history.
    const existing = await Entitlement.findOne({ user: userId, itemType, item: itemId });
    if (existing) throw conflict('ALREADY_GRANTED', 'This user already has access to this item.');
    const payment = await Payment.create({
      user: userId,
      itemType,
      item: itemId,
      amount: 0,
      paymentMethod: 'upi',
      upiTransactionId: `MANUAL-${Date.now()}`,
      screenshot: 'manual-grant',
      orderNumber: generateOrderNumber(),
      status: 'approved',
      reviewedBy: sessionAdmin(req).id,
      reviewedAt: new Date(),
    });
    const grant = await Entitlement.create({ user: userId, itemType, item: itemId, payment: payment._id, grantedAt: new Date(), expiresAt: null });
    await audit(req, 'entitlement.grant', 'Entitlement', grant._id, { userId, itemType, itemId });
    res.status(201).json({ data: { id: String(grant._id) } });
  }),
);

peopleRouter.delete(
  '/entitlements/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const grant = await Entitlement.findByIdAndDelete(req.params.id);
    if (!grant) throw notFound('Access record not found');
    // Keep the payment record consistent with the removed access, otherwise the user would still
    // show as "purchased" and be refused a new purchase (ALREADY_PURCHASED).
    const payment = await Payment.findById(grant.payment);
    let paymentEffect: 'deleted' | 'revoked' | 'kept' = 'kept';
    if (payment && payment.status === 'approved' && payment.itemType === grant.itemType) {
      if (payment.amount === 0 && payment.upiTransactionId.startsWith('MANUAL-')) {
        await payment.deleteOne(); // the ₹0 record existed only to log the manual grant
        paymentEffect = 'deleted';
      } else {
        payment.status = 'rejected';
        payment.rejectionReason = 'Access revoked by admin';
        payment.activePurchaseKey = undefined;
        payment.reviewedBy = sessionAdmin(req).id as unknown as Types.ObjectId;
        payment.reviewedAt = new Date();
        await payment.save();
        paymentEffect = 'revoked';
      }
    }
    // An approved hard copy also unlocked this PDF: that order and payment stay as they are.
    await audit(req, 'entitlement.revoke', 'Entitlement', grant._id, {
      user: String(grant.user),
      item: String(grant.item),
      payment: paymentEffect,
    });
    res.status(204).end();
  }),
);

// ---- Messages (contact + guidance requests) ------------------------------------------------------

peopleRouter.get(
  '/messages',
  validate({ query: listQuerySchema.extend({ kind: z.enum(['contact', 'guidance']).default('contact') }) }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery & { kind: 'contact' | 'guidance' };
    const status = q.status ? { status: q.status } : {};
    if (q.kind === 'contact') {
      const filter = { ...searchFilter(q.q, ['name', 'email', 'subject', 'message']), ...status };
      const [items, total] = await Promise.all([
        ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize),
        ContactMessage.countDocuments(filter),
      ]);
      const data: AdminMessage[] = items.map((m) => ({
        id: String(m._id),
        kind: 'contact',
        name: m.name,
        email: m.email,
        subject: m.subject,
        body: m.message,
        details: Object.fromEntries(Object.entries({ Phone: m.phone, Project: m.project }).filter(([, v]) => v)) as Record<string, string>,
        status: m.status ?? 'new',
        createdAt: createdAt(m),
      }));
      return res.json(paged(data, total, q));
    }
    const filter = { ...searchFilter(q.q, ['name', 'email', 'goals']), ...status };
    const [items, total] = await Promise.all([
      GuidanceRequest.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize),
      GuidanceRequest.countDocuments(filter),
    ]);
    const data: AdminMessage[] = items.map((m) => ({
      id: String(m._id),
      kind: 'guidance',
      name: m.name,
      email: m.email,
      subject: 'Free consultation request',
      body: m.goals ?? '',
      details: Object.fromEntries(Object.entries({ 'Preferred mentor': m.preferredMentor, Plan: m.plan }).filter(([, v]) => v)) as Record<string, string>,
      status: m.status ?? 'new',
      createdAt: createdAt(m),
    }));
    res.json(paged(data, total, q));
  }),
);

peopleRouter.patch(
  '/messages/:kind/:id',
  validate({ params: idParamSchema.extend({ kind: z.enum(['contact', 'guidance']) }), body: messageStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: 'new' | 'read' | 'replied' };
    const model = req.params.kind === 'contact' ? ContactMessage : GuidanceRequest;
    const doc = await (model as typeof ContactMessage).findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!doc) throw notFound('Message not found');
    await audit(req, 'message.update', req.params.kind === 'contact' ? 'ContactMessage' : 'GuidanceRequest', doc._id, { status });
    res.json({ data: { id: String(doc._id), status } });
  }),
);

// ---- Newsletter -------------------------------------------------------------------------------------

peopleRouter.get(
  '/newsletter-subscribers',
  validate({ query: listQuerySchema.extend({ format: z.enum(['json', 'csv']).default('json') }) }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery & { format: 'json' | 'csv' };
    const filter = searchFilter(q.q, ['email']);
    if (q.format === 'csv') {
      const all = await NewsletterSubscriber.find({ ...filter, isActive: true }).sort({ subscribedAt: -1 });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
      return res.send(['email,subscribed_at', ...all.map((s) => `${s.email},${iso(s.subscribedAt) ?? ''}`)].join('\n'));
    }
    const [items, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip(q)).limit(q.pageSize),
      NewsletterSubscriber.countDocuments(filter),
    ]);
    const data: AdminSubscriber[] = items.map((s) => ({ id: String(s._id), email: s.email, isActive: s.isActive ?? true, subscribedAt: iso(s.subscribedAt) ?? '' }));
    res.json(paged(data, total, q));
  }),
);

peopleRouter.patch(
  '/newsletter-subscribers/:id',
  validate({ params: idParamSchema, body: z.object({ isActive: z.boolean() }) }),
  asyncHandler(async (req, res) => {
    const doc = await NewsletterSubscriber.findByIdAndUpdate(req.params.id, { $set: { isActive: (req.body as { isActive: boolean }).isActive } }, { new: true });
    if (!doc) throw notFound('Subscriber not found');
    await audit(req, 'subscriber.update', 'NewsletterSubscriber', doc._id, { isActive: doc.isActive });
    res.json({ data: { id: String(doc._id), isActive: doc.isActive } });
  }),
);

// ---- Settings ---------------------------------------------------------------------------------------------

async function adminSettings(): Promise<AdminSettings> {
  const s = await getSettings();
  return {
    upiIdDefault: s.upiIdDefault ?? '',
    upiIdPdf: s.upiIdPdf ?? '',
    upiIdHardcopy: s.upiIdHardcopy ?? '',
    qrImageBooks: publicUrl(s.qrImageBooks) ?? '',
    qrImageCourses: publicUrl(s.qrImageCourses) ?? '',
    contactEmail: s.contactEmail ?? '',
    contactPhone: s.contactPhone ?? '',
    location: s.location ?? '',
    workingHours: (s.workingHours ?? []).map((item) => ({ label: item.label ?? '', value: item.value ?? '' })),
    socialLinks: {
      facebook: s.socialLinks?.facebook ?? '',
      twitter: s.socialLinks?.twitter ?? '',
      instagram: s.socialLinks?.instagram ?? '',
      linkedin: s.socialLinks?.linkedin ?? '',
    },
    adminNotifyEmail: s.adminNotifyEmail ?? '',
  };
}

peopleRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ data: await adminSettings() });
  }),
);

/** Settings decide where customers send money: super admins only (docs/03 §3.2). */
peopleRouter.put(
  '/settings',
  requireSuperAdmin,
  uploadFields([imageField('qrImageBooks'), imageField('qrImageCourses')]),
  validate({ body: settingsFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as SettingsFormInput;
    const s = await getSettings();
    const { facebookUrl, twitterUrl, instagramUrl, linkedinUrl, removeQrImageBooks, removeQrImageCourses, ...fields } = input;
    Object.assign(s, fields, {
      upiIdDefault: input.upiIdDefault ?? '',
      upiIdPdf: input.upiIdPdf ?? '',
      upiIdHardcopy: input.upiIdHardcopy ?? '',
      contactEmail: input.contactEmail ?? '',
      contactPhone: input.contactPhone ?? '',
      location: input.location ?? '',
      workingHours: input.workingHours,
      socialLinks: {
        facebook: facebookUrl ?? '',
        twitter: twitterUrl ?? '',
        instagram: instagramUrl ?? '',
        linkedin: linkedinUrl ?? '',
      },
    });
    s.adminNotifyEmail = input.adminNotifyEmail;
    const remove = { qrImageBooks: removeQrImageBooks, qrImageCourses: removeQrImageCourses };
    const replaced: string[] = [];
    for (const field of ['qrImageBooks', 'qrImageCourses'] as const) {
      const file = uploadedFile(req, field);
      if (!file && !remove[field]) continue;
      const old = s[field];
      // A new upload replaces the QR; "remove" clears it (that payment route then needs a UPI ID).
      s[field] = file ? await saveUpload('public', 'settings', file, 'qr') : '';
      if (old && !old.startsWith('/')) replaced.push(old);
    }
    await s.save();
    for (const old of replaced) await deleteStored('public', old);
    await audit(req, 'settings.update', 'Settings', s._id);
    res.json({ data: await adminSettings() });
  }),
);

// ---- Admin accounts ----------------------------------------------------------------------------------------

function toAccount(a: InstanceType<typeof Admin>): AdminAccount {
  return {
    id: String(a._id),
    username: a.username,
    name: a.name ?? '',
    email: a.email ?? '',
    role: a.role ?? 'admin',
    isActive: a.isActive ?? true,
    lastLoginAt: iso(a.lastLoginAt),
    createdAt: createdAt(a),
  };
}

/** Any admin can change their own password. */
peopleRouter.post(
  '/account/password',
  validate({ body: changeOwnPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changeOwnPasswordSchema>;
    const admin = await Admin.findById(sessionAdmin(req).id).select('+passwordHash');
    if (!admin) throw notFound('Admin not found');
    if (!(await verifyBcrypt(currentPassword, admin.passwordHash))) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect', { currentPassword: 'Current password is incorrect' });
    }
    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();
    await revokeAdminSessions(String(admin._id), req.sessionID);
    await audit(req, 'admin.password', 'Admin', admin._id);
    res.json({ data: { message: 'Password changed' } });
  }),
);

peopleRouter.get(
  '/admins',
  requireSuperAdmin,
  asyncHandler(async (_req, res) => {
    const admins = await Admin.find().sort({ createdAt: 1 });
    res.json({ data: admins.map(toAccount) });
  }),
);

peopleRouter.post(
  '/admins',
  requireSuperAdmin,
  validate({ body: createAdminSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createAdminSchema>;
    if (await Admin.exists({ username: input.username })) throw conflict('USERNAME_TAKEN', 'This username is taken', { username: 'This username is taken' });
    const admin = await Admin.create({
      username: input.username,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    });
    await audit(req, 'admin.create', 'Admin', admin._id, { username: admin.username, role: admin.role });
    res.status(201).json({ data: toAccount(admin) });
  }),
);

peopleRouter.patch(
  '/admins/:id',
  requireSuperAdmin,
  validate({ params: idParamSchema, body: updateAdminSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof updateAdminSchema>;
    const admin = await Admin.findById(req.params.id).select('+passwordHash');
    if (!admin) throw notFound('Admin not found');
    const self = String(admin._id) === sessionAdmin(req).id;
    const authorizationChanged =
      (input.role !== undefined && input.role !== admin.role) ||
      (input.isActive !== undefined && input.isActive !== admin.isActive) ||
      Boolean(input.password);
    if (self && (input.isActive === false || (input.role && input.role !== 'superadmin'))) {
      throw badRequest('You cannot deactivate or demote your own account');
    }
    if (input.name !== undefined) admin.name = input.name;
    if (input.email !== undefined) admin.email = input.email;
    if (input.role) admin.role = input.role;
    if (input.isActive !== undefined) admin.isActive = input.isActive;
    if (input.password) admin.passwordHash = await hashPassword(input.password);
    await admin.save();
    if (authorizationChanged) await revokeAdminSessions(String(admin._id), self ? req.sessionID : undefined);
    await audit(req, 'admin.update', 'Admin', admin._id, { username: admin.username, role: admin.role, isActive: admin.isActive });
    res.json({ data: toAccount(admin) });
  }),
);

// ---- Activity log ---------------------------------------------------------------------------------------------

peopleRouter.get(
  '/audit-log',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = searchFilter(q.q, ['action', 'entity', 'adminUsername']);
    const [items, total] = await Promise.all([AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize), AuditLog.countDocuments(filter)]);
    const data: AuditEntry[] = items.map((a) => ({
      id: String(a._id),
      adminUsername: a.adminUsername ?? '',
      action: a.action,
      entity: a.entity,
      entityId: a.entityId ? String(a.entityId) : null,
      details: (a.details as Record<string, unknown> | undefined) ?? null,
      createdAt: createdAt(a),
    }));
    res.json(paged(data, total, q));
  }),
);
