import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ContactMessage, GuidanceRequest, NewsletterSubscriber } from '../src/models/FormSubmissions';
import { seedCourses } from '../src/scripts/seed';
import { outbox } from '../src/services/email/mailer';
import { csrfAgent, setupTestApp, teardownTestApp } from './helpers';

let app: Express;

beforeAll(async () => {
  app = await setupTestApp();
  await seedCourses();
});

afterAll(async () => {
  await teardownTestApp();
});

describe('courses API', () => {
  it('lists courses newest first, like the live catalogue (8, 7, 6, 5)', async () => {
    const res = await request(app).get('/api/courses').expect(200);
    expect(res.body.data.map((c: { legacyId: number }) => c.legacyId)).toEqual([8, 7, 6, 5]);
    const emotional = res.body.data[1];
    expect(emotional).toMatchObject({ slug: 'emotional-command', price: 49_900, originalPrice: 83_100, videoCount: 16, discountPercent: 40 });
  });

  it('returns the home lists in the live order', async () => {
    const res = await request(app).get('/api/courses?home=1').expect(200);
    const ids = (list: { legacyId: number }[]) => list.map((c) => c.legacyId);
    expect(ids(res.body.data.newArrivals)).toEqual([8, 7, 6]);
    expect(ids(res.body.data.popular)).toEqual([6, 5, 7]);
  });

  it('redirects legacy course URLs to the slug route', async () => {
    const res = await request(app).get('/course_details.php?subject_id=7');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/courses/emotional-command');
    expect((await request(app).get('/payment.php?subject_id=5')).headers.location).toBe('/courses/sankhyakarika/payment');
    expect((await request(app).get('/course_details.php?subject_id=999')).headers.location).toBe('/courses');
  });
});

describe('forms API', () => {
  it('stores a contact message and notifies the admin', async () => {
    const c = await csrfAgent(app);
    const before = outbox.length;
    const res = await c.post('/api/contact', {
      name: 'Asha',
      email: 'Asha@Example.com',
      phone: '9876543210',
      subject: 'Retreat dates',
      message: 'When is the next retreat?',
    });
    expect(res.status).toBe(201);
    const saved = await ContactMessage.findOne({ email: 'asha@example.com' });
    expect(saved?.subject).toBe('Retreat dates');
    expect(outbox.length).toBe(before + 1);
    expect(outbox.at(-1)?.subject).toBe('[SANYOD] New contact message');
  });

  it('validates contact fields', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/contact', { name: '', email: 'x', subject: '', message: '' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(expect.arrayContaining(['name', 'email', 'subject', 'message']));
  });

  it('silently drops honeypot submissions', async () => {
    const c = await csrfAgent(app);
    await c.post('/api/contact', { name: 'Bot', email: 'bot@example.com', subject: 'Buy', message: 'spam spam', website: 'http://spam' });
    // "website" must be empty → validation error, nothing stored either way
    expect(await ContactMessage.countDocuments({ email: 'bot@example.com' })).toBe(0);
  });

  it('stores a guidance request with the live confirmation text', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/guidance-requests', { name: 'Ravi', email: 'ravi@example.com', preferredMentor: 'swami', plan: 'monthly', goals: 'Meditation' });
    expect(res.status).toBe(201);
    expect(res.body.data.message).toBe('Thank you! We will contact you within 24 hours to schedule your free consultation.');
    expect(await GuidanceRequest.countDocuments({ email: 'ravi@example.com', preferredMentor: 'swami' })).toBe(1);

    const bad = await c.post('/api/guidance-requests', { name: 'Ravi', email: 'ravi@example.com', preferredMentor: 'nobody' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields.preferredMentor).toBe('Please select a mentor');
  });

  it('subscribes to the newsletter idempotently', async () => {
    const c = await csrfAgent(app);
    await c.post('/api/newsletter', { email: 'News@Example.com' }).expect(200);
    await c.post('/api/newsletter', { email: 'news@example.com' }).expect(200);
    expect(await NewsletterSubscriber.countDocuments({ email: 'news@example.com' })).toBe(1);
  });
});
