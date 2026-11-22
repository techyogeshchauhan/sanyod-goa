import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Admin } from '../src/models/Admin';
import { Event } from '../src/models/Event';
import { Payment } from '../src/models/Payment';
import { getSettings } from '../src/models/Settings';
import { User } from '../src/models/User';
import { seedBooks, seedCourses, seedCourseVideos, seedDoctors, seedEvents } from '../src/scripts/seed';
import { hashPassword } from '../src/utils/passwords';
import { csrfAgent, setupTestApp, teardownTestApp } from './helpers';

// Admin panel API: one regression test per finding in ADMIN_PANEL_AUDIT.md, plus a pass over every
// admin endpoint the panel calls.

let app: Express;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const address = { fullName: 'Ravi Kumar', phone: '9876543210', address: '12 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' };
type Client = Awaited<ReturnType<typeof csrfAgent>>;

beforeAll(async () => {
  app = await setupTestApp();
  await seedCourses();
  await seedCourseVideos();
  await seedBooks();
  await seedDoctors();
  await seedEvents();
  await Admin.create({ username: 'chief', passwordHash: await hashPassword('chief-pass-1'), role: 'superadmin' });
  await Admin.create({ username: 'helper', passwordHash: await hashPassword('helper-pass-1'), role: 'admin' });
  const settings = await getSettings();
  Object.assign(settings, { upiIdDefault: 'test@upi', upiIdPdf: 'test@upi', upiIdHardcopy: 'test@upi' });
  await settings.save();
});

afterAll(async () => {
  await teardownTestApp();
});

async function adminLogin(username: string, password: string): Promise<Client> {
  const c = await csrfAgent(app);
  await c.post('/api/admin/auth/login', { username, password }).expect(200);
  return c;
}
const superAdmin = () => adminLogin('chief', 'chief-pass-1');
const plainAdmin = () => adminLogin('helper', 'helper-pass-1');

async function customer(email: string): Promise<Client> {
  const c = await csrfAgent(app);
  await c.post('/api/auth/register', { name: 'Customer', email, password: 'secret123' }).expect(200);
  await c.post('/api/auth/login', { email, password: 'secret123' }).expect(200);
  return c;
}

const patch = (c: Client, url: string, body: object) => c.agent.patch(url).set('x-csrf-token', c.token).send(body);
const del = (c: Client, url: string) => c.agent.delete(url).set('x-csrf-token', c.token);
/** Multipart write (book/course/doctor/event/settings forms). */
function form(c: Client, method: 'post' | 'patch' | 'put', url: string, fields: Record<string, string>, files: Record<string, [Buffer, string, string]> = {}) {
  let r = c.agent[method](url).set('x-csrf-token', c.token);
  for (const [k, v] of Object.entries(fields)) r = r.field(k, v);
  for (const [k, [buf, filename, contentType]] of Object.entries(files)) r = r.attach(k, buf, { filename, contentType });
  return r;
}
function pay(c: Client, fields: Record<string, string>) {
  let r = c.agent.post('/api/payments').set('x-csrf-token', c.token);
  for (const [k, v] of Object.entries(fields)) r = r.field(k, v);
  return r.attach('screenshot', PNG, { filename: 'paid.png', contentType: 'image/png' });
}
const png = (): Record<string, [Buffer, string, string]> => ({ cover: [PNG, 'c.png', 'image/png'] });

describe('admin session', () => {
  it('logs in, reports /me, and logs out', async () => {
    const anon = await csrfAgent(app);
    expect((await anon.agent.get('/api/admin/auth/me').expect(200)).body.data.admin).toBeNull();
    const c = await superAdmin();
    expect((await c.agent.get('/api/admin/auth/me').expect(200)).body.data.admin).toMatchObject({ username: 'chief', role: 'superadmin' });
    await c.post('/api/admin/auth/logout').expect(204);
    const after = await c.agent.get('/api/admin/dashboard');
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe('ADMIN_UNAUTHENTICATED');
  });

  it('serves the dashboard counters', async () => {
    const c = await plainAdmin();
    const d = (await c.agent.get('/api/admin/dashboard').expect(200)).body.data;
    expect(d).toMatchObject({ pendingPayments: { book_pdf: 0, book_hardcopy: 0, course: 0 }, revenueTotal: 0 });
    expect(Object.keys(d.ordersByStatus)).toEqual(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
  });
});

describe('A1 settings are super-admin only', () => {
  it('lets an admin read but not change settings', async () => {
    const c = await plainAdmin();
    await c.agent.get('/api/admin/settings').expect(200);
    const res = await form(c, 'put', '/api/admin/settings', { upiIdDefault: 'attacker@upi', workingHours: '[]' });
    expect(res.status).toBe(403);
    expect((await getSettings()).upiIdDefault).toBe('test@upi');
  });

  it('lets a super admin save settings', async () => {
    const c = await superAdmin();
    const res = await form(c, 'put', '/api/admin/settings', {
      upiIdDefault: 'test@upi',
      upiIdPdf: 'test@upi',
      upiIdHardcopy: 'test@upi',
      contactEmail: 'hello@example.com',
      workingHours: JSON.stringify([{ label: 'Mon-Fri', value: '9-5' }]),
      facebookUrl: 'https://facebook.com/x',
      adminNotifyEmail: '',
    }).expect(200);
    expect(res.body.data).toMatchObject({ contactEmail: 'hello@example.com', adminNotifyEmail: '', workingHours: [{ label: 'Mon-Fri', value: '9-5' }] });
    expect(res.body.data.socialLinks.facebook).toBe('https://facebook.com/x');
  });

  it('reports field errors for bad opening hours and URLs', async () => {
    const c = await superAdmin();
    const res = await form(c, 'put', '/api/admin/settings', { workingHours: JSON.stringify([{ label: '', value: 'x' }]), twitterUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(expect.arrayContaining(['workingHours.0.label', 'twitterUrl']));
  });
});

describe('A7 QR images can be removed', () => {
  it('uploads a QR and then clears it', async () => {
    const c = await superAdmin();
    const base = { upiIdDefault: 'test@upi', upiIdPdf: 'test@upi', upiIdHardcopy: 'test@upi', workingHours: '[]' };
    const up = await form(c, 'put', '/api/admin/settings', base, { qrImageBooks: [PNG, 'qr.png', 'image/png'] }).expect(200);
    expect(up.body.data.qrImageBooks).toMatch(/^\/media\/settings\/qr_/);
    await request(app).get(up.body.data.qrImageBooks).expect(200);
    const cleared = await form(c, 'put', '/api/admin/settings', { ...base, removeQrImageBooks: 'true' }).expect(200);
    expect(cleared.body.data.qrImageBooks).toBe('');
    expect((await request(app).get(up.body.data.qrImageBooks)).status).toBe(404); // file deleted too
  });
});

describe('A5 books: CRUD and clearing optional fields', () => {
  it('creates, edits, clears and deletes a book', async () => {
    const c = await plainAdmin();
    const created = await form(c, 'post', '/api/admin/books', { title: 'Clearable Book', pricePdf: '99', rating: '4.5', pages: '120', sortOrder: '3' }, png()).expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ rating: 4.5, pages: 120, sortOrder: 3, pricePdf: 9_900, priceHardcopy: null });

    const edited = await form(c, 'patch', `/api/admin/books/${id}`, { title: 'Clearable Book', pricePdf: '', priceHardcopy: '250', rating: '', pages: '', sortOrder: '', publishedYear: '' }).expect(200);
    expect(edited.body.data).toMatchObject({ rating: null, pages: null, publishedYear: null, sortOrder: 0, pricePdf: null, priceHardcopy: 25_000 });
    expect((await c.agent.get(`/api/admin/books/${id}`).expect(200)).body.data.rating).toBeNull();

    const bad = await form(c, 'patch', `/api/admin/books/${id}`, { title: 'Clearable Book', rating: '9', sortOrder: 'x' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(expect.arrayContaining(['rating', 'sortOrder']));

    await del(c, `/api/admin/books/${id}`).expect(204);
    await c.agent.get(`/api/admin/books/${id}`).expect(404);
  });

  it('refuses to delete a book with purchases', async () => {
    const buyer = await customer('book.buyer@example.com');
    await pay(buyer, { itemType: 'book_pdf', itemSlug: 'patience-in-life', upiTransactionId: 'BOOKDEL00001' }).expect(201);
    const c = await plainAdmin();
    const list = await c.agent.get('/api/admin/books?q=Patience').expect(200);
    const res = await del(c, `/api/admin/books/${list.body.data[0].id}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('HAS_PURCHASES');
  });
});

describe('A5 courses and videos', () => {
  it('clears level/discount and manages videos', async () => {
    const c = await plainAdmin();
    const created = await form(c, 'post', '/api/admin/courses', { title: 'Clear Course', price: '500', level: 'Beginner', discountPercent: '20' }, {
      image: [PNG, 'i.png', 'image/png'],
    }).expect(201);
    const id = created.body.data.id as string;
    const edited = await form(c, 'patch', `/api/admin/courses/${id}`, { title: 'Clear Course', price: '500', level: '', discountPercent: '', popularRank: '' }).expect(200);
    expect(edited.body.data).toMatchObject({ level: '', discountPercent: 0, popularRank: null });

    const v1 = await c.post(`/api/admin/courses/${id}/videos`, { title: 'One', youtube: 'https://youtu.be/Aye-26h2v4s', durationMinutes: 5 }).expect(201);
    const v2 = await c.post(`/api/admin/courses/${id}/videos`, { title: 'Two', youtube: 'Aye-26h2v4x', isFree: true }).expect(201);
    expect(v1.body.data).toMatchObject({ youtubeId: 'Aye-26h2v4s', durationSec: 300, sortOrder: 1 });
    expect((await c.agent.get(`/api/admin/courses/${id}`).expect(200)).body.data.videoCount).toBe(2);

    const cleared = await patch(c, `/api/admin/videos/${v1.body.data.id}`, { title: 'One', youtube: 'Aye-26h2v4s', durationMinutes: null }).expect(200);
    expect(cleared.body.data.durationSec).toBeNull();

    const order = await c.post(`/api/admin/courses/${id}/videos/reorder`, { ids: [v2.body.data.id, v1.body.data.id] }).expect(200);
    expect(order.body.data.map((v: { title: string }) => v.title)).toEqual(['Two', 'One']);

    await del(c, `/api/admin/videos/${v2.body.data.id}`).expect(204);
    expect((await c.agent.get(`/api/admin/courses/${id}`).expect(200)).body.data.videoCount).toBe(1);
    await del(c, `/api/admin/courses/${id}`).expect(204);
  });
});

describe('A5/A18 doctors', () => {
  it('creates with photo and CV, clears fields, removes the CV and deletes', async () => {
    const c = await plainAdmin();
    const categories = JSON.stringify([{ category: 'physical', specialisations: 'Back pain' }]);
    const created = await form(c, 'post', '/api/admin/doctors', { name: 'Dr. Test Healer', fee: '300', experienceYears: '12', rating: '4.2', categories }, {
      photo: [PNG, 'p.png', 'image/png'],
      cv: [Buffer.from('%PDF-1.4 cv'), 'cv.pdf', 'application/pdf'],
    }).expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ name: 'Test Healer', hasCv: true, experienceYears: 12 });
    const cv = await c.agent.get(`/api/admin/doctors/${id}/cv`).expect(200);
    expect(cv.headers['content-disposition']).toMatch(/attachment/);

    const edited = await form(c, 'patch', `/api/admin/doctors/${id}`, { name: 'Test Healer', fee: '300', experienceYears: '', rating: '', categories, removeCv: 'true' }).expect(200);
    expect(edited.body.data).toMatchObject({ experienceYears: null, rating: null, hasCv: false });
    await c.agent.get(`/api/admin/doctors/${id}/cv`).expect(404);
    await del(c, `/api/admin/doctors/${id}`).expect(204);
  });

  it('rejects a doctor without a category', async () => {
    const c = await plainAdmin();
    const res = await form(c, 'post', '/api/admin/doctors', { name: 'No Category', fee: '100', categories: '[]' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.categories).toBeDefined();
  });
});

describe('A5/A9/A19 events and bookings', () => {
  it('clears optional event fields', async () => {
    const c = await plainAdmin();
    const created = await form(c, 'post', '/api/admin/events', { title: 'Clear Event', category: 'seminar', price: '100', capacity: '40', rating: '4', startDate: '2026-12-01' }).expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ capacity: 40, startDate: '2026-12-01T00:00:00.000Z' });
    const edited = await form(c, 'patch', `/api/admin/events/${id}`, { title: 'Clear Event', category: 'seminar', price: '100', capacity: '', rating: '', startDate: '', enrolledCount: '' }).expect(200);
    expect(edited.body.data).toMatchObject({ capacity: null, rating: null, startDate: null, enrolledCount: 0 });
    await del(c, `/api/admin/events/${id}`).expect(204);
  });

  it('keeps the enrolled counter in step and never below zero', async () => {
    const guest = await customer('guest@example.com'); // booking needs a signed-in user
    const booking = { eventSlug: 'stress-management-workshop', name: 'Guest One', email: 'guest@example.com', phone: '9876543210', upiTransactionId: 'UTRCOUNT0001' };
    await guest.post('/api/event-bookings', booking).expect(201);
    const c = await plainAdmin();
    const list = await c.agent.get('/api/admin/event-bookings?q=UTRCOUNT0001').expect(200);
    const b = list.body.data[0];
    const enrolled = async () => (await Event.findById(b.eventId))?.enrolledCount ?? -99;
    const start = await enrolled();

    await patch(c, `/api/admin/event-bookings/${b.id}`, { status: 'confirmed', notify: false }).expect(200);
    expect(await enrolled()).toBe(start + 1);
    await Event.updateOne({ _id: b.eventId }, { $set: { enrolledCount: 0 } }); // edited by hand
    await patch(c, `/api/admin/event-bookings/${b.id}`, { status: 'cancelled', notify: false }).expect(200);
    expect(await enrolled()).toBe(0);
  });

  it('answers a transaction-ID clash with 409, not 500', async () => {
    const guest = await customer('guest2@example.com');
    const booking = { eventSlug: 'stress-management-workshop', name: 'Guest Two', email: 'guest2@example.com', phone: '9876543211', upiTransactionId: 'UTRCLASH0001' };
    await guest.post('/api/event-bookings', booking).expect(201);
    const c = await plainAdmin();
    const first = (await c.agent.get('/api/admin/event-bookings?q=UTRCLASH0001').expect(200)).body.data[0];
    await patch(c, `/api/admin/event-bookings/${first.id}`, { status: 'cancelled', notify: false }).expect(200);
    await guest.post('/api/event-bookings', booking).expect(201); // allowed: the first one is cancelled
    const res = await patch(c, `/api/admin/event-bookings/${first.id}`, { status: 'confirmed', notify: false });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('A4/A6 hard-copy orders', () => {
  it('refuses to ship an unpaid order, and clears courier/tracking', async () => {
    const buyer = await customer('ship.me@example.com');
    const paid = await pay(buyer, { itemType: 'book_hardcopy', itemSlug: 'patience-in-life', upiTransactionId: 'SHIP00000001', shippingAddress: JSON.stringify(address) }).expect(201);
    const c = await plainAdmin();
    const order = (await c.agent.get(`/api/admin/orders?q=${paid.body.data.payment.orderNumber}`).expect(200)).body.data[0];
    expect(order.paymentStatus).toBe('pending');

    const early = await patch(c, `/api/admin/orders/${order.id}`, { status: 'shipped', notify: false });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('PAYMENT_NOT_APPROVED');

    await c.post(`/api/admin/payments/${order.paymentId}/approve`).expect(200);
    const shipped = await patch(c, `/api/admin/orders/${order.id}`, { status: 'shipped', courier: 'India Post', trackingNumber: 'EE123', notify: false }).expect(200);
    expect(shipped.body.data).toMatchObject({ status: 'shipped', courier: 'India Post', trackingNumber: 'EE123' });
    const cleared = await patch(c, `/api/admin/orders/${order.id}`, { status: 'shipped', courier: '', trackingNumber: '', notify: false }).expect(200);
    expect(cleared.body.data).toMatchObject({ courier: null, trackingNumber: null });
  });
});

describe('payments review', () => {
  it('lists, opens, shows the screenshot, rejects with a reason', async () => {
    const buyer = await customer('review.me@example.com');
    const paid = await pay(buyer, { itemType: 'course', itemSlug: 'emotional-command', upiTransactionId: 'REVIEW000001', paymentMethod: 'upi' }).expect(201);
    const c = await plainAdmin();
    const list = await c.agent.get('/api/admin/payments?status=pending&itemType=course').expect(200);
    const p = list.body.data.find((x: { orderNumber: string }) => x.orderNumber === paid.body.data.payment.orderNumber);
    expect(p).toMatchObject({ itemType: 'course', status: 'pending', user: { email: 'review.me@example.com' } });
    await c.agent.get(`/api/admin/payments/${p.id}`).expect(200);
    expect((await c.agent.get(`/api/admin/payments/${p.id}/screenshot`).expect(200)).headers['content-type']).toBe('image/png');
    const rejected = await c.post(`/api/admin/payments/${p.id}/reject`, { reason: 'Amount not received' }).expect(200);
    expect(rejected.body.data).toMatchObject({ status: 'rejected', rejectionReason: 'Amount not received', reviewedBy: 'helper' });
  });
});

describe('A3 revoking access keeps purchases consistent', () => {
  it('removes a manual grant and lets the user buy afterwards', async () => {
    const buyer = await customer('gifted@example.com');
    const user = await User.findOne({ email: 'gifted@example.com' });
    const c = await plainAdmin();
    const course = (await c.agent.get('/api/admin/courses?q=Emotional').expect(200)).body.data[0];
    const grant = await c.post('/api/admin/entitlements', { userId: String(user?._id), itemType: 'course', itemId: course.id }).expect(201);
    expect((await c.post('/api/admin/entitlements', { userId: String(user?._id), itemType: 'course', itemId: course.id })).status).toBe(409);
    const detail = (await c.agent.get(`/api/admin/users/${user?._id}`).expect(200)).body.data;
    expect(detail.entitlements).toHaveLength(1);
    expect(detail.purchases[0]).toMatchObject({ amount: 0, status: 'approved' });

    await del(c, `/api/admin/entitlements/${grant.body.data.id}`).expect(204);
    expect(await Payment.countDocuments({ user: user?._id })).toBe(0); // the ₹0 record went with it
    await pay(buyer, { itemType: 'course', itemSlug: 'emotional-command', upiTransactionId: 'AFTERGRANT01', paymentMethod: 'upi' }).expect(201);
  });

  it('marks a paid purchase revoked so the user can buy again', async () => {
    const c0 = await plainAdmin();
    const book = (await c0.agent.get('/api/admin/books?q=science-and-spiritual').expect(200)).body.data[0];
    await form(c0, 'patch', `/api/admin/books/${book.id}`, { title: book.title, pricePdf: '150' }).expect(200);
    const buyer = await customer('revoked@example.com');
    const paid = await pay(buyer, { itemType: 'book_pdf', itemSlug: 'science-and-spiritual', upiTransactionId: 'REVOKE000001' }).expect(201);
    const c = await plainAdmin();
    await c.post(`/api/admin/payments/${paid.body.data.payment.id}/approve`).expect(200);
    const user = await User.findOne({ email: 'revoked@example.com' });
    const detail = (await c.agent.get(`/api/admin/users/${user?._id}`).expect(200)).body.data;
    await del(c, `/api/admin/entitlements/${detail.entitlements[0].id}`).expect(204);

    const payment = await Payment.findById(paid.body.data.payment.id);
    expect(payment).toMatchObject({ status: 'rejected', rejectionReason: 'Access revoked by admin' });
    const status = (await buyer.agent.get('/api/books/science-and-spiritual').expect(200)).body.data.purchase;
    expect(status).toMatchObject({ pdf: 'rejected', canRead: false });
    await pay(buyer, { itemType: 'book_pdf', itemSlug: 'science-and-spiritual', upiTransactionId: 'REVOKE000002' }).expect(201);
  });
});

describe('A6 consultations', () => {
  it('updates status and clears internal notes', async () => {
    const patient = await customer('notes.patient@example.com');
    await patient.post('/api/consultations', {
      doctorSlug: 'manoranjan-shau',
      patientName: 'Notes Patient',
      patientEmail: 'notes.patient@example.com',
      patientPhone: '9876543210',
      patientAge: 40,
      medicalIssue: 'Back pain',
      appointmentDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
      preferredTime: 'any',
      symptoms: 'Lower back pain for a month',
      consentAccepted: true,
    }).expect(201);
    const c = await plainAdmin();
    const item = (await c.agent.get('/api/admin/consultations?q=Notes Patient').expect(200)).body.data[0];
    const noted = await patch(c, `/api/admin/consultations/${item.id}`, { status: 'confirmed', adminNotes: 'Call first', notify: false }).expect(200);
    expect(noted.body.data).toMatchObject({ status: 'confirmed', adminNotes: 'Call first' });
    const cleared = await patch(c, `/api/admin/consultations/${item.id}`, { status: 'confirmed', adminNotes: '', notify: false }).expect(200);
    expect(cleared.body.data.adminNotes).toBeNull();
  });
});

describe('users, messages and newsletter', () => {
  it('lists, opens and deactivates users', async () => {
    await customer('listed@example.com');
    const c = await plainAdmin();
    const list = await c.agent.get('/api/admin/users?q=listed').expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 25 });
    const id = list.body.data[0].id;
    await c.agent.get(`/api/admin/users/${id}`).expect(200);
    expect((await patch(c, `/api/admin/users/${id}`, { isActive: false }).expect(200)).body.data.isActive).toBe(false);
    expect((await c.agent.get('/api/admin/users?status=inactive&q=listed').expect(200)).body.total).toBe(1);
    await c.agent.get('/api/admin/users/000000000000000000000000').expect(404);
    await c.agent.get('/api/admin/users/not-an-id').expect(400);
  });

  it('reads and marks contact messages and guidance requests', async () => {
    const visitor = await csrfAgent(app);
    await visitor.post('/api/contact', { name: 'Asha', email: 'asha@example.com', subject: 'Hello there', message: 'A question about retreats' }).expect(201);
    await visitor.post('/api/guidance-requests', { name: 'Ravi', email: 'ravi@example.com', preferredMentor: 'any', goals: 'Calm' }).expect(201);
    const c = await plainAdmin();
    const contact = await c.agent.get('/api/admin/messages?kind=contact').expect(200);
    expect(contact.body.data[0]).toMatchObject({ kind: 'contact', subject: 'Hello there', status: 'new' });
    await patch(c, `/api/admin/messages/contact/${contact.body.data[0].id}`, { status: 'replied' }).expect(200);
    expect((await c.agent.get('/api/admin/messages?kind=contact&status=replied').expect(200)).body.total).toBe(1);
    const guidance = await c.agent.get('/api/admin/messages?kind=guidance').expect(200);
    expect(guidance.body.data[0]).toMatchObject({ kind: 'guidance', body: 'Calm' });
    await patch(c, `/api/admin/messages/guidance/${guidance.body.data[0].id}`, { status: 'read' }).expect(200);
  });

  it('lists, exports (with the search) and unsubscribes newsletter emails', async () => {
    const visitor = await csrfAgent(app);
    await visitor.post('/api/newsletter', { email: 'news.one@example.com' });
    await visitor.post('/api/newsletter', { email: 'other@example.com' });
    const c = await plainAdmin();
    const list = await c.agent.get('/api/admin/newsletter-subscribers?q=news.one').expect(200);
    expect(list.body.data).toHaveLength(1);
    const csv = await c.agent.get('/api/admin/newsletter-subscribers?format=csv&q=news.one').expect(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toMatch(/^email,subscribed_at\nnews\.one@example\.com,/);
    expect(csv.text).not.toMatch(/other@example\.com/);
    await patch(c, `/api/admin/newsletter-subscribers/${list.body.data[0].id}`, { isActive: false }).expect(200);
  });
});

describe('admin accounts and own password', () => {
  it('lets only a super admin manage accounts', async () => {
    const helper = await plainAdmin();
    await helper.agent.get('/api/admin/admins').expect(403);
    const chief = await superAdmin();
    const created = await chief.post('/api/admin/admins', { username: 'Temp.Admin', name: 'Temp', password: 'temp-pass-1' }).expect(201);
    expect(created.body.data).toMatchObject({ username: 'temp.admin', role: 'admin' });
    expect((await chief.post('/api/admin/admins', { username: 'temp.admin', password: 'temp-pass-1' })).status).toBe(409);

    const temp = await adminLogin('temp.admin', 'temp-pass-1');
    await patch(chief, `/api/admin/admins/${created.body.data.id}`, { isActive: false }).expect(200);
    expect((await temp.agent.get('/api/admin/dashboard')).status).toBe(401); // its session is revoked

    const me = (await chief.agent.get('/api/admin/auth/me').expect(200)).body.data.admin;
    const self = await patch(chief, `/api/admin/admins/${me.id}`, { role: 'admin' });
    expect(self.status).toBe(400);
  });

  it('changes the own password and signs out other sessions', async () => {
    await Admin.create({ username: 'rotator', passwordHash: await hashPassword('rotate-pass-1') });
    const here = await adminLogin('rotator', 'rotate-pass-1');
    const there = await adminLogin('rotator', 'rotate-pass-1');
    const wrong = await here.post('/api/admin/account/password', { currentPassword: 'nope', newPassword: 'rotate-pass-2' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.fields.currentPassword).toBeDefined();
    await here.post('/api/admin/account/password', { currentPassword: 'rotate-pass-1', newPassword: 'rotate-pass-2' }).expect(200);
    await here.agent.get('/api/admin/dashboard').expect(200);
    expect((await there.agent.get('/api/admin/dashboard')).status).toBe(401);
    await adminLogin('rotator', 'rotate-pass-2');
  });
});

describe('A22 activity log', () => {
  it('records admin writes with their details', async () => {
    const c = await plainAdmin();
    const log = await c.agent.get('/api/admin/audit-log?q=consultation.update').expect(200);
    expect(log.body.data[0]).toMatchObject({ action: 'consultation.update', adminUsername: 'helper', details: { status: 'confirmed' } });
  });
});
