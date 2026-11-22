import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const bool = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  MONGODB_URI: z.string().min(1),
  MONGODB_URI_TEST: z.string().min(1).optional(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_USER_MAX_AGE_DAYS: z.coerce.number().positive().default(7),
  SESSION_ADMIN_REMEMBER_DAYS: z.coerce.number().positive().default(30),
  COOKIE_DOMAIN: z.string().optional().transform((v) => v || undefined),
  COOKIE_SECURE: bool,

  SMTP_HOST: z.string().optional().transform((v) => v || undefined),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  /**
   * starttls (port 587: plain connection upgraded with STARTTLS, which is then required),
   * ssl / tls (port 465: TLS from the start), none (no TLS, local relays only).
   * Unset: TLS from the start on port 465, otherwise STARTTLS when the server offers it.
   */
  SMTP_SECURITY: z
    .string()
    .optional()
    .transform((v) => v?.trim().toLowerCase() || undefined)
    .pipe(z.enum(['starttls', 'ssl', 'tls', 'none']).optional()),
  SMTP_USER: z.string().optional().transform((v) => v?.trim() || undefined),
  SMTP_PASS: z.string().optional().transform((v) => v || undefined),
  MAIL_FROM: z.string().default('SANYOD <noreply@sanyod.in>'),
  MAX_IMAGE_UPLOAD_MB: z.coerce.number().positive().default(5),
  MAX_PDF_UPLOAD_MB: z.coerce.number().positive().default(50),

  /** Uploaded files: <dir>/public (served at /media) and <dir>/private (PDFs, screenshots, CVs). */
  STORAGE_DIR: z.string().default(path.resolve(__dirname, '../../storage')),
  /** The old PHP site folder (e.g. D:/sanyod.in); seed/migration copy book PDFs and uploads from it. */
  LEGACY_SITE_DIR: z.string().optional().transform((v) => v || undefined),

  /** Local E2E runs only; ignored in production. */
  DISABLE_RATE_LIMITS: bool,

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

/**
 * Accepted alternative spellings (the names many hosting panels and older .env files use).
 * The canonical name wins when both are set; an empty value counts as unset.
 */
const ALIASES: Record<string, string> = {
  SMTP_USER: 'SMTP_USERNAME',
  SMTP_PASS: 'SMTP_PASSWORD',
  MAIL_FROM: 'SMTP_FROM',
};

export function withAliases(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...source };
  for (const [name, alias] of Object.entries(ALIASES)) {
    if (!out[name] && out[alias]) out[name] = out[alias];
  }
  return out;
}

const parsed = envSchema.safeParse(withAliases(process.env));
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
