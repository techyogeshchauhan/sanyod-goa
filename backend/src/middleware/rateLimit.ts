import { rateLimit, ipKeyGenerator, type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { env, isProduction, isTest } from '../config/env';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function limiter(windowMs: number, limit: number, keyGenerator?: Options['keyGenerator']) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest || (env.DISABLE_RATE_LIMITS && !isProduction),
    keyGenerator,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please wait a few minutes and try again.' },
      });
    },
  });
}

const ip = (req: Request) => ipKeyGenerator(req.ip ?? 'unknown');
const bodyField = (req: Request, field: string) =>
  String((req.body as Record<string, unknown> | undefined)?.[field] ?? '').trim().toLowerCase();

export const loginLimiter = limiter(MINUTE, 5, (req) => `${ip(req)}|${bodyField(req, 'email')}`);
export const registerLimiter = limiter(HOUR, 5, (req) => ip(req));
export const forgotPasswordLimiter = limiter(HOUR, 3, (req) => `forgot|${bodyField(req, 'email')}`);
export const forgotPasswordIpLimiter = limiter(HOUR, 10, (req) => `forgot-ip|${ip(req)}`);
export const adminLoginLimiter = limiter(MINUTE, 5, (req) => `admin|${ip(req)}`);
export const formLimiter = limiter(HOUR, 10, (req) => `form|${ip(req)}`);
