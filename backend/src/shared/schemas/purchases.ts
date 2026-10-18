import { z } from 'zod';
import { PAYMENT_METHODS, PREFERRED_TIMES } from '../constants';

const trimmed = (label: string, min: number, max: number) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} is too long`);

const phone = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number.');

/** UPI transaction reference typed by the user (UTR / TXN id). */
export const transactionId = z
  .string({ required_error: 'Transaction ID is required' })
  .trim()
  .min(6, 'Please enter your Transaction ID.')
  .max(60, 'Transaction ID is too long')
  .regex(/^[A-Za-z0-9\-_/]+$/, 'Transaction ID may only contain letters, numbers and - _ /');

export const addressSchema = z.object({
  fullName: trimmed('Full name', 2, 100),
  phone,
  address: trimmed('Full address', 5, 500),
  city: trimmed('City', 2, 80),
  state: trimmed('State', 2, 80),
  pincode: z
    .string({ required_error: 'Pincode is required' })
    .trim()
    .regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode.'),
  landmark: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
});

/**
 * POST /api/payments (multipart/form-data). The amount is never taken from the client:
 * the server prices the item. `shippingAddress` is a JSON string for hard copies.
 */
export const createPaymentSchema = z
  .object({
    itemType: z.enum(['book_pdf', 'book_hardcopy', 'course'], { errorMap: () => ({ message: 'Please select a purchase option' }) }),
    itemSlug: z.string().trim().min(1).max(200),
    upiTransactionId: transactionId,
    paymentMethod: z.enum(PAYMENT_METHODS).default('upi'),
    shippingAddress: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v) return undefined;
        try {
          return JSON.parse(v) as unknown;
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid address format' });
          return z.NEVER;
        }
      })
      .pipe(addressSchema.optional()),
  })
  .superRefine((v, ctx) => {
    if (v.itemType === 'book_hardcopy' && !v.shippingAddress) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shippingAddress'], message: 'Please provide your shipping address' });
    }
  });

export const consultationSchema = z.object({
  doctorSlug: z.string().trim().min(1).max(200),
  patientName: trimmed('Full name', 2, 100),
  patientEmail: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email address'),
  patientPhone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
  patientAge: z.coerce
    .number({ invalid_type_error: 'Please enter a valid age (1-120)' })
    .int('Please enter a valid age (1-120)')
    .min(1, 'Please enter a valid age (1-120)')
    .max(120, 'Please enter a valid age (1-120)'),
  medicalIssue: trimmed('Medical issue', 2, 200),
  appointmentDate: z
    .string({ required_error: 'Appointment date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a date')
    .refine((v) => v >= new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10), 'Please choose today or a later date'),
  preferredTime: z.enum(PREFERRED_TIMES, { errorMap: () => ({ message: 'Please select a preferred time' }) }),
  symptoms: trimmed('Symptoms', 5, 5000),
  additionalNotes: z
    .string()
    .trim()
    .max(3000)
    .optional()
    .transform((v) => v || undefined),
  consentAccepted: z.literal(true, { errorMap: () => ({ message: 'Please confirm your consent to teleconsultation' }) }),
});

export const eventBookingSchema = z.object({
  eventSlug: z.string().trim().min(1).max(200),
  name: trimmed('Name', 2, 100).refine((v) => v.length >= 2, 'Please enter a valid name.'),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  upiTransactionId: z
    .string({ required_error: 'Transaction ID is required' })
    .trim()
    .min(8, 'Transaction ID must be at least 8 characters long.')
    .max(60, 'Transaction ID is too long')
    .regex(/^[A-Za-z0-9\-_/]+$/, 'Transaction ID may only contain letters, numbers and - _ /'),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConsultationInput = z.infer<typeof consultationSchema>;
export type EventBookingInput = z.infer<typeof eventBookingSchema>;
