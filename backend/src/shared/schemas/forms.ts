import { z } from 'zod';
import { PREFERRED_MENTORS } from '../constants';

const email = z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email address');
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Honeypot: real users never fill this hidden field. */
const website = z.string().max(0).optional();

export const contactSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Please enter your name').max(100),
  email,
  phone: optionalText(20),
  project: optionalText(150),
  subject: z.string({ required_error: 'Subject is required' }).trim().min(2, 'Please enter a subject').max(200),
  message: z.string({ required_error: 'Message is required' }).trim().min(5, 'Please write a message').max(5000),
  website,
});

export const SESSION_PLANS = ['one-on-one', 'monthly', 'group'] as const;

export const guidanceRequestSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Please enter your name').max(100),
  email,
  preferredMentor: z.enum(PREFERRED_MENTORS, { errorMap: () => ({ message: 'Please select a mentor' }) }),
  goals: optionalText(3000),
  plan: z.enum(SESSION_PLANS).optional(),
  website,
});

export const newsletterSchema = z.object({ email, website });

export type ContactInput = z.infer<typeof contactSchema>;
export type GuidanceRequestInput = z.infer<typeof guidanceRequestSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type SessionPlan = (typeof SESSION_PLANS)[number];
