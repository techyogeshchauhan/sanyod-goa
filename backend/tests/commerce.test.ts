import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Admin } from '../src/models/Admin';
import { Book } from '../src/models/Book';
import { Entitlement } from '../src/models/Entitlement';
import { Order } from '../src/models/Order';
import { Payment } from '../src/models/Payment';
import { getSettings } from '../src/models/Settings';
import { User } from '../src/models/User';
import { seedBooks, seedCourses, seedCourseVideos, seedDoctors, seedEvents } from '../src/scripts/seed';
import { outbox } from '../src/services/email/mailer';
import { PRIVATE_DIR } from '../src/services/storage';
import { hashPassword } from '../src/utils/passwords';
import { csrfAgent, setupTestApp, teardownTestApp } from './helpers';

let app: Express;

// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

beforeAll(async () => {
  app = await setupTestApp();
  await seedCourses();
  await seedCourseVideos();
  await seedBooks();
  await seedDoctors();
  await seedEvents();
  // A PDF for book 26 in (test) private storage.
  const key = 'Books_pdf/bookpdf_6944e136963a3.pdf';
  mkdirSync(path.join(PRIVATE_DIR, 'Books_pdf'), { recursive: true });
  writeFileSync(path.join(PRIVATE_DIR, key), '%PDF-1.4 test');
  await Admin.create({ username: 'boss', passwordHash: await hashPassword('admin-pass-1'), role: 'superadmin' });
  // Checkout and event booking refuse until the admin configures where payments go.
  const settings = await getSettings();
  Object.assign(settings, { upiIdDefault: 'test@upi', upiIdPdf: 'test@upi', upiIdHardcopy: 'test@upi' });
  await settings.save();
});

afterAll(async () => {
  await teardownTestApp();
});

async function loggedInUser(email: string) {
  const c = await csrfAgent(app);
  // Registration does not sign in (SEC-04): register, then log in.
  await c.post('/api/auth/register', { name: 'Reader One', email, password: 'secret123' }).expect(200);
  await c.post('/api/auth/login', { email, password: 'secret123' }).expect(200);
  return c;
}

async function loggedInAdmin() {
  const c = await csrfAgent(app);
  await c.post('/api/admin/auth/login', { username: 'boss', password: 'admin-pass-1' }).expect(200);
  return c;
}

function pay(c: Awaited<ReturnType<typeof csrfAgent>>, fields: Record<string, string>, file = true) {
  let r = c.agent.post('/api/payments').set('x-csrf-token', c.token);
  for (const [k, v] of Object.entries(fields)) r = r.field(k, v);
  if (file) r = r.attach('screenshot', PNG, { filename: 'paid.png', contentType: 'image/png' });
  return r;
}

describe('books', () => {
  it('lists published books and redirects legacy URLs', async () => {
    const res = await request(app).get('/api/books').expect(200);
    expect(res.body.data.map((b: { legacyId: number }) => b.legacyId).sort()).toEqual([26, 27, 28, 30]);
    expect((await request(app).get('/books_details.php?books=26')).headers.location).toBe('/books/patience-in-life');
    expect((await request(app).get('/doctor_detail.php?doctor_id=13')).headers.location).toBe('/health/doctors/vaidya-sudarshan');
  });

  it('shows prices but no purchase status to visitors', async () => {
    const res = await request(app).get('/api/books/patience-in-life').expect(200);
    expect(res.body.data.book).toMatchObject({ pricePdf: 10_000, priceHardcopy: 30_000, purchasable: true });
    expect(res.body.data.purchase).toBeNull();
    const unpriced = await request(app).get('/api/books/dhairya').expect(200);
    expect(unpriced.body.data.book.purchasable).toBe(false);
  });
});

describe('PDF purchase → admin approval → reading', () => {
  it('runs the whole flow', async () => {
    const c = await loggedInUser('pdf.reader@example.com');
    // No access before buying.
    expect((await c.agent.get('/api/library/books/patience-in-life/pdf')).status).toBe(403);

    // The amount comes from the server, not the form.
    const res = await pay(c, { itemType: 'book_pdf', itemSlug: 'patience-in-life', upiTransactionId: 'TXN123456789', amount: '1' });
    expect(res.status).toBe(201);
    expect(res.body.data.payment).toMatchObject({ status: 'pending', amount: 10_000, itemType: 'book_pdf' });
    expect(res.body.data.payment.orderNumber).toMatch(/^ORD\d{17}$/);
    expect(outbox.some((m) => m.to === 'pdf.reader@example.com' && m.subject === 'Order Confirmation - Patience in Life')).toBe(true);

    // A second purchase while pending is refused.
    const again = await pay(c, { itemType: 'book_pdf', itemSlug: 'patience-in-life', upiTransactionId: 'TXN999999999' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('PAYMENT_PENDING');

    const status = await c.agent.get('/api/books/patience-in-life').expect(200);
    expect(status.body.data.purchase).toMatchObject({ pdf: 'pending', canRead: false });

    // Admin approves.
    const admin = await loggedInAdmin();
    const list = await admin.agent.get('/api/admin/payments?status=pending').expect(200);
    const pending = list.body.data.find((p: { orderNumber: string }) => p.orderNumber === res.body.data.payment.orderNumber);
    expect(pending.user.email).toBe('pdf.reader@example.com');
    const shot = await admin.agent.get(`/api/admin/payments/${pending.id}/screenshot`).expect(200);
    expect(shot.headers['content-type']).toBe('image/png');
    await admin.post(`/api/admin/payments/${pending.id}/approve`).expect(200);

    // Now the book is in the library and the PDF streams only to its owner.
    const lib = await c.agent.get('/api/library/books').expect(200);
    expect(lib.body.data[0]).toMatchObject({ slug: 'patience-in-life', orderNumber: res.body.data.payment.orderNumber });
    const pdf = await c.agent.get('/api/library/books/patience-in-life/pdf').expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.headers['content-disposition']).toMatch(/^inline/);
    const other = await loggedInUser('someone.else@example.com');
    expect((await other.agent.get('/api/library/books/patience-in-life/pdf')).status).toBe(403);
    expect((await request(app).get('/api/library/books/patience-in-life/pdf')).status).toBe(401);
    expect(outbox.some((m) => m.subject === 'Payment Approved - Patience in Life')).toBe(true);
  });

  it('validates the form and the file', async () => {
    const c = await loggedInUser('validation@example.com');
    const noFile = await pay(c, { itemType: 'book_pdf', itemSlug: 'patience-in-life', upiTransactionId: 'TXN000000001' }, false);
    expect(noFile.status).toBe(400);
    expect(noFile.body.error.fields.screenshot).toBeDefined();
    const notImage = await c.agent
      .post('/api/payments')
      .set('x-csrf-token', c.token)
      .field('itemType', 'book_pdf')
      .field('itemSlug', 'patience-in-life')
      .field('upiTransactionId', 'TXN000000002')
      .attach('screenshot', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(notImage.status).toBe(400);
    const unpriced = await pay(c, { itemType: 'book_pdf', itemSlug: 'dhairya', upiTransactionId: 'TXN000000003' });
    expect(unpriced.status).toBe(400);
    expect(await Payment.countDocuments({ upiTransactionId: /^TXN00000000/ })).toBe(0);
  });

  it('rejects a reused transaction ID', async () => {
    const a = await loggedInUser('first.payer@example.com');
    await pay(a, { itemType: 'book_pdf', itemSlug: 'science-and-spiritual', upiTransactionId: 'SAMEUTR12345' }).expect(400); // no price yet
    await Book.updateOne({ slug: 'science-and-spiritual' }, { $set: { pricePdf: 15_000, priceHardcopy: 35_000 } });
    await pay(a, { itemType: 'book_pdf', itemSlug: 'science-and-spiritual', upiTransactionId: 'SAMEUTR12345' }).expect(201);
    const b = await loggedInUser('second.payer@example.com');
    const dup = await pay(b, { itemType: 'book_pdf', itemSlug: 'science-and-spiritual', upiTransactionId: 'SAMEUTR12345' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_TRANSACTION');
  });
});

describe('hard copy order', () => {
  const address = { fullName: 'Ravi Kumar', phone: '9876543210', address: '12 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' };

  it('requires an address, creates an order and unlocks the PDF when approved', async () => {
    const c = await loggedInUser('hard.copy@example.com');
    const missing = await pay(c, { itemType: 'book_hardcopy', itemSlug: 'patience-in-life', upiTransactionId: 'HARD00000001' });
    expect(missing.status).toBe(400);
    const res = await pay(c, {
      itemType: 'book_hardcopy',
      itemSlug: 'patience-in-life',
      upiTransactionId: 'HARD00000002',
      shippingAddress: JSON.stringify(address),
    }).expect(201);
    expect(res.body.data.payment.amount).toBe(30_000);
    const order = await Order.findOne({ orderNumber: res.body.data.payment.orderNumber });
    expect(order?.shippingAddress?.city).toBe('Pune');

    const admin = await loggedInAdmin();
    await admin.post(`/api/admin/payments/${res.body.data.payment.id}/approve`).expect(200);
    expect((await Order.findById(order?._id))?.status).toBe('processing');
    const upd = await admin.agent
      .patch(`/api/admin/orders/${order?._id}`)
      .set('x-csrf-token', admin.token)
      .send({ status: 'shipped', courier: 'India Post', trackingNumber: 'EE123456789IN' })
      .expect(200);
    expect(upd.body.data.status).toBe('shipped');

    const mine = await c.agent.get('/api/orders').expect(200);
    expect(mine.body.data[0]).toMatchObject({ orderStatus: 'shipped', trackingNumber: 'EE123456789IN', status: 'approved' });
    // The approved hard copy also grants the PDF (D-06).
    const status = await c.agent.get('/api/books/patience-in-life').expect(200);
    expect(status.body.data.purchase).toMatchObject({ hardcopy: 'approved', canRead: true });
    const buyPdf = await pay(c, { itemType: 'book_pdf', itemSlug: 'patience-in-life', upiTransactionId: 'HARD00000003' });
    expect(buyPdf.status).toBe(409);
  });

  it('cancels the order and revokes access when the admin rejects the payment', async () => {
    const c = await loggedInUser('rejected@example.com');
    const res = await pay(c, {
      itemType: 'book_hardcopy',
      itemSlug: 'patience-in-life',
      upiTransactionId: 'REJECT000001',
      shippingAddress: JSON.stringify(address),
    }).expect(201);
    const admin = await loggedInAdmin();
    await admin.post(`/api/admin/payments/${res.body.data.payment.id}/reject`, { reason: 'Amount not received' }).expect(200);
    const order = await Order.findOne({ orderNumber: res.body.data.payment.orderNumber });
    expect(order?.status).toBe('cancelled');
    expect(outbox.some((m) => m.to === 'rejected@example.com' && m.text.includes('Amount not received'))).toBe(true);
    // Rejected: the user may submit again with a new transaction.
    await pay(c, { itemType: 'book_hardcopy', itemSlug: 'patience-in-life', upiTransactionId: 'REJECT000002', shippingAddress: JSON.stringify(address) }).expect(201);
  });
});

describe('course videos', () => {
  it('hides paid YouTube IDs until the course is approved', async () => {
    const anon = await request(app).get('/api/courses/emotional-command/videos').expect(200);
    expect(anon.body.data).toHaveLength(16);
    expect(anon.body.data.every((v: { youtubeId?: string; canAccess: boolean }) => !v.youtubeId && !v.canAccess)).toBe(true);

    const c = await loggedInUser('learner@example.com');
    const res = await pay(c, { itemType: 'course', itemSlug: 'emotional-command', upiTransactionId: 'COURSE000001', paymentMethod: 'upi' }).expect(201);
    expect(res.body.data.payment.amount).toBe(49_900);
    const pending = await c.agent.get('/api/courses/emotional-command').expect(200);
    expect(pending.body.data.purchase).toEqual({ status: 'pending', canWatch: false });

    const admin = await loggedInAdmin();
    await admin.post(`/api/admin/payments/${res.body.data.payment.id}/approve`).expect(200);
    const videos = await c.agent.get('/api/courses/emotional-command/videos').expect(200);
    expect(videos.body.data[0]).toMatchObject({ canAccess: true, youtubeId: 'Aye-26h2v4s', order: 1 });
    const mine = await c.agent.get('/api/library/courses').expect(200);
    expect(mine.body.data.map((x: { slug: string }) => x.slug)).toEqual(['emotional-command']);
  });
});

describe('consultations and event bookings', () => {
  it('saves a consultation request', async () => {
    const c = await loggedInUser('patient@example.com');
    const body = {
      doctorSlug: 'manoranjan-shau',
      patientName: 'Meera',
      patientEmail: 'patient@example.com',
      patientPhone: '9876543210',
      patientAge: 34,
      medicalIssue: 'Migraine',
      appointmentDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      preferredTime: 'morning',
      symptoms: 'Headache every morning for two weeks',
      consentAccepted: true,
    };
    expect((await c.post('/api/consultations', { ...body, patientPhone: '123' })).status).toBe(400);
    await c.post('/api/consultations', body).expect(201);
    const mine = await c.agent.get('/api/consultations').expect(200);
    expect(mine.body.data[0]).toMatchObject({ doctorName: 'Manoranjan Shau', status: 'pending' });
    const admin = await loggedInAdmin();
    const list = await admin.agent.get('/api/admin/consultations').expect(200);
    expect(list.body.total).toBeGreaterThan(0);
  });

  it('books an event and the admin confirms it', async () => {
    const c = await loggedInUser('yogi@example.com');
    const events = await c.agent.get('/api/events').expect(200);
    expect(events.body.data).toHaveLength(6);
    const res = await c.post('/api/event-bookings', {
      eventSlug: 'stress-management-workshop',
      name: 'Yogi',
      email: 'yogi@example.com',
      phone: '9876543210',
      upiTransactionId: 'UTR123456789',
    });
    expect(res.status).toBe(201);
    const admin = await loggedInAdmin();
    const list = await admin.agent.get('/api/admin/event-bookings').expect(200);
    const booking = list.body.data[0];
    await admin.agent.patch(`/api/admin/event-bookings/${booking.id}`).set('x-csrf-token', admin.token).send({ status: 'confirmed' }).expect(200);
    const mine = await c.agent.get('/api/event-bookings').expect(200);
    expect(mine.body.data[0].status).toBe('confirmed');
  });
});

describe('admin API', () => {
  it('requires an admin session', async () => {
    const c = await loggedInUser('not.admin@example.com');
    expect((await c.agent.get('/api/admin/payments')).status).toBe(401);
  });

  it('creates a book with a cover and PDF, then a user can buy it', async () => {
    const admin = await loggedInAdmin();
    const created = await admin.agent
      .post('/api/admin/books')
      .set('x-csrf-token', admin.token)
      .field('title', 'Yoga Darshan Notes')
      .field('pricePdf', '149')
      .field('description', 'Line one\nLine two')
      .attach('cover', PNG, { filename: 'cover.png', contentType: 'image/png' })
      .attach('pdf', Buffer.from('%PDF-1.4 new'), { filename: 'book.pdf', contentType: 'application/pdf' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ slug: 'yoga-darshan-notes', pricePdf: 14_900, priceHardcopy: null, hasPdf: true });
    expect(created.body.data.cover).toMatch(/^\/media\/books\/cover_/);
    const cover = await request(app).get(created.body.data.cover).expect(200);
    expect(cover.headers['content-type']).toBe('image/png');
    // Path traversal out of the public folder is refused.
    expect([403, 404]).toContain((await request(app).get('/media/../private/x')).status);

    const dash = await admin.agent.get('/api/admin/dashboard').expect(200);
    expect(dash.body.data.users).toBeGreaterThan(0);
  });

  it('grants and revokes course access manually', async () => {
    const admin = await loggedInAdmin();
    await loggedInUser('gift@example.com');
    const user = await User.findOne({ email: 'gift@example.com' });
    const courses = await admin.agent.get('/api/admin/courses').expect(200);
    const course = courses.body.data.find((x: { slug: string }) => x.slug === 'sankhyakarika');
    const grant = await admin.post('/api/admin/entitlements', { userId: String(user?._id), itemType: 'course', itemId: course.id }).expect(201);
    expect(await Entitlement.countDocuments({ user: user?._id })).toBe(1);
    await admin.agent.delete(`/api/admin/entitlements/${grant.body.data.id}`).set('x-csrf-token', admin.token).expect(204);
    expect(await Entitlement.countDocuments({ user: user?._id })).toBe(0);
  });

  it('deactivates a user, which blocks their purchases', async () => {
    const c = await loggedInUser('blocked@example.com');
    const user = await User.findOne({ email: 'blocked@example.com' });
    const admin = await loggedInAdmin();
    await admin.agent.patch(`/api/admin/users/${user?._id}`).set('x-csrf-token', admin.token).send({ isActive: false }).expect(200);
    const res = await c.agent.get('/api/orders');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});
