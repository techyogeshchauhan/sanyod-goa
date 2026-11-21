import { createHash } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Admin } from '../src/models/Admin';
import { User } from '../src/models/User';
import { outbox } from '../src/services/email/mailer';
import { hashPassword } from '../src/utils/passwords';
import { csrfAgent, setupTestApp, teardownTestApp } from './helpers';

let app: Express;

beforeAll(async () => {
  app = await setupTestApp();
});

afterAll(async () => {
  await teardownTestApp();
});

const user = { name: 'Test Seeker', email: 'Seeker@Example.com', password: 'secret123' };

function lastResetToken(): string {
  const mail = outbox.at(-1);
  const match = mail?.text.match(/token=([\w%-]+)/);
  if (!match?.[1]) throw new Error('No reset email captured');
  return decodeURIComponent(match[1]);
}

describe('CSRF protection', () => {
  it('rejects state-changing requests without a token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_INVALID');
  });
});

describe('user registration and login', () => {
  it('registers, auto-logs in and normalises the email', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/auth/register', user).expect(201);
    expect(res.body.data.user).toMatchObject({ name: 'Test Seeker', email: 'seeker@example.com' });
    const me = await c.agent.get('/api/auth/me').expect(200);
    expect(me.body.data.user.email).toBe('seeker@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/auth/register', { ...user, email: 'seeker@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('returns field errors for invalid input', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/auth/register', { name: 'A', email: 'nope', password: '123' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('logs in, logs out and rejects wrong passwords', async () => {
    const c = await csrfAgent(app);
    const bad = await c.post('/api/auth/login', { email: user.email, password: 'wrong-pass' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.message).toBe('Invalid email or password');

    await c.post('/api/auth/login', { email: user.email, password: user.password }).expect(200);
    expect((await c.agent.get('/api/auth/me')).body.data.user).not.toBeNull();

    await c.post('/api/auth/logout').expect(204);
    expect((await c.agent.get('/api/auth/me')).body.data.user).toBeNull();
  });

  it('upgrades legacy MD5 hashes to bcrypt on first login', async () => {
    await User.create({
      name: 'Legacy User',
      email: 'legacy@example.com',
      legacyPasswordHash: createHash('md5').update('oldpass1').digest('hex'),
      legacyAlgo: 'md5',
    });
    const c = await csrfAgent(app);
    await c.post('/api/auth/login', { email: 'legacy@example.com', password: 'oldpass1' }).expect(200);
    const stored = await User.findOne({ email: 'legacy@example.com' }).select('+passwordHash +legacyPasswordHash');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.legacyPasswordHash).toBeUndefined();
  });

  it('accepts PHP password_hash ($2y$) hashes', async () => {
    const phpHash = (await hashPassword('phpPass9')).replace(/^\$2[ab]\$/, '$2y$');
    await User.create({ name: 'PHP User', email: 'php@example.com', passwordHash: phpHash });
    const c = await csrfAgent(app);
    await c.post('/api/auth/login', { email: 'php@example.com', password: 'phpPass9' }).expect(200);
  });

  it('refuses deactivated accounts', async () => {
    await User.create({ name: 'Off', email: 'off@example.com', passwordHash: await hashPassword('offpass1'), isActive: false });
    const c = await csrfAgent(app);
    const res = await c.post('/api/auth/login', { email: 'off@example.com', password: 'offpass1' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});

describe('password reset', () => {
  it('answers the same way for unknown emails and sends nothing', async () => {
    const before = outbox.length;
    const c = await csrfAgent(app);
    const res = await c.post('/api/auth/forgot-password', { email: 'nobody@example.com' }).expect(200);
    expect(res.body.data.message).toMatch(/If this email is registered/);
    expect(outbox.length).toBe(before);
  });

  it('emails a single-use link that resets the password and signs in', async () => {
    const c = await csrfAgent(app);
    await c.post('/api/auth/forgot-password', { email: user.email }).expect(200);
    const token = lastResetToken();

    const stored = await User.findOne({ email: 'seeker@example.com' }).select('+passwordResetTokenHash');
    expect(stored?.passwordResetTokenHash).not.toBe(token); // only the hash is stored

    const valid = await request(app).post('/api/auth/reset-password/validate').send({ token }).expect(200);
    expect(valid.body.data).toEqual({ valid: true, email: 'seeker@example.com' });

    const mismatch = await c.post('/api/auth/reset-password', { token, password: 'newpass12', confirmPassword: 'other' });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.error.fields.confirmPassword).toBe('Passwords must match');

    const ok = await c.post('/api/auth/reset-password', { token, password: 'newpass12', confirmPassword: 'newpass12' });
    expect(ok.status).toBe(200);
    expect((await c.agent.get('/api/auth/me')).body.data.user.email).toBe('seeker@example.com');

    const reuse = await c.post('/api/auth/reset-password', { token, password: 'again123', confirmPassword: 'again123' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.error.code).toBe('RESET_TOKEN_INVALID');

    const fresh = await csrfAgent(app);
    await fresh.post('/api/auth/login', { email: user.email, password: user.password }).expect(401);
    await fresh.post('/api/auth/login', { email: user.email, password: 'newpass12' }).expect(200);
  });

  it('revokes existing sessions after a reset', async () => {
    const other = await csrfAgent(app);
    await other.post('/api/auth/login', { email: user.email, password: 'newpass12' }).expect(200);

    const c = await csrfAgent(app);
    await c.post('/api/auth/forgot-password', { email: user.email }).expect(200);
    const token = lastResetToken();
    await c.post('/api/auth/reset-password', { token, password: 'final1234', confirmPassword: 'final1234' }).expect(200);

    expect((await other.agent.get('/api/auth/me')).body.data.user).toBeNull();
  });
});

describe('admin authentication', () => {
  beforeAll(async () => {
    await Admin.create({ username: 'sanyodadmin', passwordHash: await hashPassword('Admin#Pass123'), role: 'superadmin' });
  });

  it('protects admin routes', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ADMIN_UNAUTHENTICATED');
  });

  it('does not treat a user session as an admin session', async () => {
    const c = await csrfAgent(app);
    await c.post('/api/auth/login', { email: user.email, password: 'final1234' }).expect(200);
    await c.agent.get('/api/admin/dashboard').expect(401);
  });

  it('logs in with username, reaches the dashboard and logs out', async () => {
    const c = await csrfAgent(app);
    await c.post('/api/admin/auth/login', { username: 'sanyodadmin', password: 'nope' }).expect(401);

    const res = await c.post('/api/admin/auth/login', { username: 'SanyodAdmin', password: 'Admin#Pass123', remember: true });
    expect(res.status).toBe(200);
    expect(res.body.data.admin).toMatchObject({ username: 'sanyodadmin', role: 'superadmin' });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/sanyod\.admin\.sid=.*Expires=/);

    await c.agent.get('/api/admin/dashboard').expect(200);
    await c.post('/api/admin/auth/logout').expect(204);
    await c.agent.get('/api/admin/dashboard').expect(401);
  });

  it('uses a browser-session cookie without "Remember me"', async () => {
    const c = await csrfAgent(app);
    const res = await c.post('/api/admin/auth/login', { username: 'sanyodadmin', password: 'Admin#Pass123' }).expect(200);
    expect(String(res.headers['set-cookie'])).not.toMatch(/sanyod\.admin\.sid=[^,]*Expires=/);
  });
});

describe('legacy PHP redirects', () => {
  it.each([
    ['/index.php', '/'],
    ['/Courses.php', '/courses'],
    ['/presonal.php', '/spirituality/personal-guidance'],
    ['/books_details.php?books=26', '/books'],
    ['/reset_password.php?token=abc&email=x%40y.z', '/reset-password?token=abc'],
    ['/forget.php', '/forgot-password'],
  ])('%s → %s', async (from, to) => {
    const res = await request(app).get(from);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(to);
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
