import { z } from 'zod';
import {
  ADMIN_ROLES,
  BOOKING_STATUSES,
  CONSULTATION_STATUSES,
  DOCTOR_CATEGORIES,
  ENTITLEMENT_TYPES,
  EVENT_CATEGORIES,
  ITEM_TYPES,
  MESSAGE_STATUSES,
  ORDER_STATUSES,
  PASSWORD_MIN_LENGTH,
  PAYMENT_STATUSES,
} from '../constants';

// Admin forms. Book/course/doctor/event forms are multipart (files), so every value
// arrives as a string: numbers and booleans are coerced here.

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));
const optionalWebUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v || undefined)
  .refine((v) => v === undefined || /^https?:\/\//i.test(v), 'Enter a valid http or https URL');
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes (e.g. patience-in-life)')
  .max(120);
const optionalSlug = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined)
  .pipe(slug.optional());
const bool = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0', 'on', ''])])
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : v === true || v === 'true' || v === '1' || v === 'on'));
/** Rupees in the form (e.g. "499" or "499.50") → paise. Empty → null. */
const rupees = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[₹,\s]/g, ''));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount' });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });
const requiredRupees = rupees.refine((v) => v !== null, 'Price is required');
const optionalInt = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === '') return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Enter a whole number between ${min} and ${max}` });
        return z.NEVER;
      }
      return n;
    });
const optionalNumber = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === '') return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Enter a number between ${min} and ${max}` });
        return z.NEVER;
      }
      return n;
    });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  q: optionalText(100),
  status: optionalText(30),
  itemType: z.enum(ITEM_TYPES).optional(),
  category: optionalText(30),
  eventId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id') });

export const rejectPaymentSchema = z.object({ reason: optionalText(500) });
export const paymentStatusFilter = z.enum(PAYMENT_STATUSES);

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  courier: optionalText(100),
  trackingNumber: optionalText(100),
  notify: z.boolean().optional(),
});

export const bookFormSchema = z.object({
  title: text(200).min(1, 'Title is required'),
  slug: optionalSlug,
  author: z.string().trim().max(120).optional().default(''),
  description: z.string().max(20000).optional().default(''),
  category: optionalText(100),
  language: optionalText(80),
  isFeatured: bool,
  pricePdf: rupees,
  priceHardcopy: rupees,
  hardcopyAvailable: bool,
  pages: optionalInt(1, 10000),
  publishedYear: optionalInt(1900, 2100),
  rating: optionalNumber(0, 5),
  reviewCount: optionalInt(0, 10000000),
  isPublished: bool,
  sortOrder: optionalInt(-10000, 10000),
  legacyId: optionalInt(1, 10000000),
});

export const courseFormSchema = z.object({
  title: text(200).min(1, 'Title is required'),
  slug: optionalSlug,
  description: z.string().max(20000).optional().default(''),
  price: requiredRupees,
  discountPercent: optionalInt(0, 99),
  level: optionalText(60),
  hasCertificate: bool,
  popularRank: optionalInt(1, 100),
  isPublished: bool,
  sortOrder: optionalInt(-10000, 10000),
  legacyId: optionalInt(1, 10000000),
});

/** Accepts a YouTube ID or any YouTube URL and keeps the ID. */
export const youtubeIdSchema = z
  .string({ required_error: 'YouTube link or ID is required' })
  .trim()
  .transform((v, ctx) => {
    const match = v.match(/(?:youtu\.be\/|embed\/|shorts\/|[?&]v=)([\w-]{6,20})/) ?? v.match(/^([\w-]{6,20})$/);
    if (!match?.[1]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a YouTube link or video ID' });
      return z.NEVER;
    }
    return match[1];
  });

export const videoFormSchema = z.object({
  title: text(300).min(1, 'Title is required'),
  youtube: youtubeIdSchema,
  isFree: z.boolean().optional().default(false),
  durationMinutes: z.coerce.number().min(0).max(1000).optional(),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});
export const reorderVideosSchema = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1).max(1000) });

export const doctorFormSchema = z.object({
  name: text(120).min(2, 'Name is required').transform((v) => v.replace(/^dr\.?\s+/i, '')),
  slug: optionalSlug,
  /** JSON: [{ category, specialisations }] */
  categories: z
    .string()
    .transform((v, ctx) => {
      try {
        return JSON.parse(v) as unknown;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid categories' });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(z.object({ category: z.enum(DOCTOR_CATEGORIES), specialisations: z.string().trim().max(5000).default('') }))
        .min(1, 'Choose at least one category'),
    ),
  qualification: optionalText(120),
  experienceYears: optionalInt(0, 80),
  fee: requiredRupees,
  bio: z.string().max(20000).optional().default(''),
  rating: optionalNumber(0, 5),
  isVerified: bool,
  availabilityText: optionalText(80),
  isActive: bool,
  sortOrder: optionalInt(-10000, 10000),
  removeCv: bool,
});

export const updateConsultationSchema = z.object({
  status: z.enum(CONSULTATION_STATUSES),
  adminNotes: optionalText(3000),
  notify: z.boolean().optional(),
});

export const eventFormSchema = z.object({
  title: text(200).min(1, 'Title is required'),
  slug: optionalSlug,
  category: z.enum(EVENT_CATEGORIES),
  description: z.string().max(5000).optional().default(''),
  badge: optionalText(40),
  startDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null)),
  dateText: optionalText(80),
  timeText: optionalText(80),
  durationText: optionalText(80),
  location: optionalText(200),
  price: requiredRupees,
  capacity: optionalInt(0, 100000),
  enrolledCount: optionalInt(0, 1000000),
  rating: optionalNumber(0, 5),
  ctaLabel: z.enum(['Book Now', 'Enroll Now']).optional(),
  isPublished: bool,
  sortOrder: optionalInt(-10000, 10000),
});

export const updateBookingSchema = z.object({ status: z.enum(BOOKING_STATUSES), notify: z.boolean().optional() });

export const updateUserSchema = z.object({ isActive: z.boolean() });

export const grantEntitlementSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
  itemType: z.enum(ENTITLEMENT_TYPES),
  itemId: z.string().regex(/^[a-f0-9]{24}$/i),
});

export const messageStatusSchema = z.object({ status: z.enum(MESSAGE_STATUSES) });

export const settingsFormSchema = z.object({
  upiIdDefault: optionalText(100),
  upiIdPdf: optionalText(100),
  upiIdHardcopy: optionalText(100),
  contactEmail: z.string().trim().email().or(z.literal('')).optional().transform((v) => v || undefined),
  contactPhone: optionalText(30),
  location: optionalText(200),
  workingHours: z
    .string()
    .transform((v, ctx) => {
      try {
        return JSON.parse(v) as unknown;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid opening hours' });
        return z.NEVER;
      }
    })
    .pipe(z.array(z.object({ label: text(60).min(1), value: text(120).min(1) })).max(14)),
  facebookUrl: optionalWebUrl,
  twitterUrl: optionalWebUrl,
  instagramUrl: optionalWebUrl,
  linkedinUrl: optionalWebUrl,
  adminNotifyEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
});

export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.-]{3,40}$/, 'Use 3-40 letters, numbers, dots, dashes or underscores'),
  name: optionalText(100),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
  role: z.enum(ADMIN_ROLES).default('admin'),
  password: z.string().min(PASSWORD_MIN_LENGTH + 2, `Minimum ${PASSWORD_MIN_LENGTH + 2} characters`).max(72),
});

export const updateAdminSchema = z.object({
  name: optionalText(100),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
  role: z.enum(ADMIN_ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().min(PASSWORD_MIN_LENGTH + 2).max(72).optional()),
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH + 2, `Minimum ${PASSWORD_MIN_LENGTH + 2} characters`).max(72),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type BookFormInput = z.infer<typeof bookFormSchema>;
export type CourseFormInput = z.infer<typeof courseFormSchema>;
export type VideoFormInput = z.input<typeof videoFormSchema>;
export type DoctorFormInput = z.infer<typeof doctorFormSchema>;
export type EventFormInput = z.infer<typeof eventFormSchema>;
export type SettingsFormInput = z.infer<typeof settingsFormSchema>;
export type CreateAdminInput = z.input<typeof createAdminSchema>;
export type UpdateAdminInput = z.input<typeof updateAdminSchema>;
