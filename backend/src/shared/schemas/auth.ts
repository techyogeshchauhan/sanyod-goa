import { z } from 'zod';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../constants';

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address');

const password = z
  .string({ required_error: 'Password is required' })
  .min(PASSWORD_MIN_LENGTH, `Minimum ${PASSWORD_MIN_LENGTH} characters`)
  .refine((v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_LENGTH, 'Password is too long');

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(NAME_MIN_LENGTH, 'Please enter your full name')
    .max(NAME_MAX_LENGTH, 'Name is too long'),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetTokenQuerySchema = z.object({
  token: z.string().trim().min(20).max(200),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const adminLoginSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).trim().min(1, 'Username is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AdminLoginInput = z.input<typeof adminLoginSchema>;
