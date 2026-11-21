import type { Request, Response } from 'express';
import { USER_SESSION_COOKIE } from '../../config/session';
import { issueCsrfToken } from '../../middleware/csrf';
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from '../../shared/schemas/auth';
import type { SessionUser } from '../../shared/types/auth';
import { destroySession, startSession } from '../../utils/session';
import * as authService from './auth.service';

async function signIn(req: Request, user: SessionUser) {
  await startSession(req, (r) => {
    r.session.user = user;
  });
}

export function csrf(req: Request, res: Response) {
  res.json({ data: { csrfToken: issueCsrfToken(req, res) } });
}

export function me(req: Request, res: Response) {
  res.json({ data: { user: req.session?.user ?? null } });
}

export async function register(req: Request, res: Response) {
  await authService.register(req.body as RegisterInput);
  res.json({
    data: {
      message: 'If this address was available, your account is ready. If you already have an account, sign in or reset your password.',
    },
  });
}

export async function login(req: Request, res: Response) {
  const user = await authService.authenticate(req.body as LoginInput);
  await signIn(req, user);
  res.json({ data: { user } });
}

export async function logout(req: Request, res: Response) {
  await destroySession(req);
  res.clearCookie(USER_SESSION_COOKIE, { path: '/' });
  res.status(204).end();
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.requestPasswordReset((req.body as ForgotPasswordInput).email);
  res.json({ data: { message: 'If this email is registered, a password reset link has been sent to it.' } });
}

export async function validateResetToken(req: Request, res: Response) {
  const result = await authService.validateResetToken(String(req.body.token));
  res.json({ data: result });
}

export async function resetPassword(req: Request, res: Response) {
  const user = await authService.resetPassword(req.body as ResetPasswordInput);
  await signIn(req, user);
  res.json({ data: { user } });
}
