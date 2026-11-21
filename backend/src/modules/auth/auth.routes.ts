import { Router } from 'express';
import { requireUser } from '../../middleware/auth';
import {
  forgotPasswordIpLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
} from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetTokenBodySchema,
} from '../../shared/schemas/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import * as ctrl from './auth.controller';

export const authRouter = Router();

authRouter.get('/csrf', ctrl.csrf);
authRouter.get('/me', ctrl.me);
authRouter.post('/register', registerLimiter, validate({ body: registerSchema }), asyncHandler(ctrl.register));
authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), asyncHandler(ctrl.login));
authRouter.post('/logout', requireUser, asyncHandler(ctrl.logout));
authRouter.post(
  '/forgot-password',
  forgotPasswordIpLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPasswordLimiter,
  asyncHandler(ctrl.forgotPassword),
);
authRouter.post(
  '/reset-password/validate',
  validate({ body: resetTokenBodySchema }),
  asyncHandler(ctrl.validateResetToken),
);
authRouter.post('/reset-password', validate({ body: resetPasswordSchema }), asyncHandler(ctrl.resetPassword));
