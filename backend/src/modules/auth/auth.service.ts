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
import { AppError, conflict } from '../../utils/errors';
import { hashPassword, sha256, verifyBcrypt, verifyLegacy } from '../../utils/passwords';

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

export async function register(input: RegisterInput): Promise<SessionUser> {
  const exists = await User.exists({ email: input.email });
  if (exists) throw conflict('EMAIL_TAKEN', 'This email is already registered', { email: 'This email is already registered' });
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
  });
  return toSessionUser(user);
}

export async function authenticate(input: LoginInput): Promise<SessionUser> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash +legacyPasswordHash +legacyAlgo');
  if (!user) {
    await hashPassword(input.password); // keep timing similar for unknown emails
    throw invalidCredentials();
  }

  let ok = false;
  if (user.passwordHash) {
    ok = await verifyBcrypt(input.password, user.passwordHash);
  } else if (user.legacyPasswordHash && user.legacyAlgo) {
    ok = verifyLegacy(input.password, user.legacyPasswordHash, user.legacyAlgo);
    if (ok) {
      user.passwordHash = await hashPassword(input.password);
      user.legacyPasswordHash = undefined;
      user.legacyAlgo = undefined;
    }
  }
  if (!ok) throw invalidCredentials();
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated. Please contact us at sanyod@sanyod.in.');
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

  const link = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
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
