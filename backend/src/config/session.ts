import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { RequestHandler } from 'express';
import { env, isProduction } from './env';

const DAY_MS = 24 * 60 * 60 * 1000;

export const USER_SESSION_COOKIE = 'sanyod.sid';
export const ADMIN_SESSION_COOKIE = 'sanyod.admin.sid';
export const USER_SESSION_COLLECTION = 'sessions';
export const ADMIN_SESSION_COLLECTION = 'adminSessions';

function cookieBase(): session.CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE || isProduction,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };
}

const openStores: MongoStore[] = [];

function store(mongoUrl: string, collectionName: string, ttlSeconds: number) {
  const created = MongoStore.create({
    mongoUrl,
    collectionName,
    ttl: ttlSeconds,
    autoRemove: 'native',
    stringify: false,
    // rolling: true refreshes the cookie on every response; without this the store was also
    // rewritten on every request (a database round trip the response waited for). The stored
    // expiry is now refreshed at most once an hour, well inside the 7- / 30-day lifetimes.
    touchAfter: 60 * 60,
  });
  openStores.push(created);
  return created;
}

/** Closes the session stores' MongoDB connections (shutdown, tests). */
export async function closeSessionStores(): Promise<void> {
  await Promise.all(openStores.splice(0).map((s) => s.close()));
}

/**
 * User and admin sessions use separate cookies and collections. They are mounted on
 * disjoint routers (/api vs /api/admin), so a request only ever carries one `req.session`.
 */
export function createUserSession(mongoUrl: string): RequestHandler {
  const maxAge = env.SESSION_USER_MAX_AGE_DAYS * DAY_MS;
  return session({
    name: USER_SESSION_COOKIE,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: store(mongoUrl, USER_SESSION_COLLECTION, maxAge / 1000),
    cookie: { ...cookieBase(), maxAge },
  });
}

export function createAdminSession(mongoUrl: string): RequestHandler {
  const rememberMs = env.SESSION_ADMIN_REMEMBER_DAYS * DAY_MS;
  return session({
    name: ADMIN_SESSION_COOKIE,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: store(mongoUrl, ADMIN_SESSION_COLLECTION, rememberMs / 1000),
    // maxAge is set at login: 30 days with "Remember me", otherwise a browser-session cookie.
    cookie: { ...cookieBase() },
  });
}

export const ADMIN_REMEMBER_MS = env.SESSION_ADMIN_REMEMBER_DAYS * DAY_MS;
