import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { USER_SESSION_COLLECTION } from '../../config/session';
import { User, toSessionUser } from '../../models/User';
import { RESET_TOKEN_TTL_MINUTES } from '../../shared/constants';
import type { LoginInput, RegisterInput, ResetPasswordInput } from '../../shared/schemas/auth';
import type { ResetTokenValidation, SessionUser } from '../../shared/types/auth';
import { sendMail } from '../../services/email/mailer';
import { resetPasswordEmail } from '../../services/email/templates/resetPassword';
import { AppError } from '../../utils/errors';
import { hashPassword, sha256, verifyBcrypt } from '../../utils/passwords';

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

export async function register(input: RegisterInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);
  try {
    await User.create({ name: input.name, email: input.email, passwordHash });
  } catch (err) {
    // Keep registration responses identical for new and already-registered addresses.
    const duplicate = err as { code?: number; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> };
    if (
      typeof err === 'object' &&
      err !== null &&
      duplicate.code === 11000 &&
      (duplicate.keyPattern?.email || duplicate.keyValue?.email)
    ) {
      return;
    }
    throw err;
  }
}

export async function authenticate(input: LoginInput): Promise<SessionUser> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user?.passwordHash) {
    await hashPassword(input.password); // keep timing similar for unknown emails
    throw invalidCredentials();
  }

  if (!(await verifyBcrypt(input.password, user.passwordHash))) throw invalidCredentials();
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated. Please use the contact form on our website for assistance.');
  }

  user.lastLoginAt = new Date();
  await user.save();
  return toSessionUser(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return; // same response for unknown emails

  const token = randomBytes(32).toString('base64url');
  user.passwordResetTokenHash = sha256(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  await user.save();

  const link = `${env.APP_URL.replace(/\/$/, '')}/reset-password#token=${encodeURIComponent(token)}`;
  await sendMail(resetPasswordEmail(user.email, user.name, link, RESET_TOKEN_TTL_MINUTES));
}

async function findByResetToken(token: string) {
  return User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpires: { $gt: new Date() },
    isActive: true,
  }).select('+passwordResetTokenHash +passwordResetExpires');
}

export async function validateResetToken(token: string): Promise<ResetTokenValidation> {
  const user = await findByResetToken(token);
  return user ? { valid: true, email: user.email } : { valid: false };
}

export async function resetPassword(input: ResetPasswordInput): Promise<SessionUser> {
  const user = await findByResetToken(input.token);
  if (!user) throw new AppError(400, 'RESET_TOKEN_INVALID', 'This reset link is invalid or has expired.');

  user.passwordHash = await hashPassword(input.password);
  user.legacyPasswordHash = undefined;
  user.legacyAlgo = undefined;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await revokeUserSessions(user.id as string);
  return toSessionUser(user);
}

/** Deletes every stored session of a user (password change, deactivation). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await mongoose.connection.collection(USER_SESSION_COLLECTION).deleteMany({ 'session.user.id': userId });
}
