import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { env, isProduction } from '../config/env';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../shared/constants';
import { AppError } from '../utils/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie: the token lives in a readable cookie and must be echoed in the
 * X-CSRF-Token header. Works for both user and admin sessions without sharing session state.
 */
export function issueCsrfToken(req: Request, res: Response): string {
  const existing = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const token = existing && /^[\w-]{32,}$/.test(existing) ? existing : randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE || isProduction,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  });
  return token;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookie = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const header = req.get(CSRF_HEADER_NAME);
  if (!cookie || !header || !safeEqual(cookie, header)) {
    return next(new AppError(403, 'CSRF_INVALID', 'Your session has expired. Please refresh the page and try again.'));
  }
  next();
};
