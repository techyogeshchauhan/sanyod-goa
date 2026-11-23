/**
 * Creates (or resets) a website user account: sets the password, reactivates the account,
 * clears any pending reset link and signs out the user's existing sessions.
 * Usage: npm run create-user -- --email <address> --password <pw> [--name "Full Name"]
 * (--name is required when the account does not exist yet.)
 */
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { USER_SESSION_COLLECTION } from '../config/session';
import { User } from '../models/User';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../shared/constants';
import { hashPassword } from '../utils/passwords';

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
    },
  });
  const email = values.email?.trim().toLowerCase();
  const { password, name } = values;
  if (!email || !password) throw new Error('--email and --password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('--email is not a valid email address');
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Passwords must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
  }

  await connectDb(env.MONGODB_URI);
  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email });
  if (!existing && !name) throw new Error('--name is required to create a new account');

  const user = existing
    ? await User.findByIdAndUpdate(
        existing._id,
        {
          $set: { passwordHash, isActive: true, ...(name ? { name } : {}) },
          $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1, legacyPasswordHash: 1, legacyAlgo: 1 },
        },
        { new: true },
      )
    : await User.create({ email, name, passwordHash, isActive: true });

  // A changed password signs the account out everywhere (as the website's own password reset does).
  const signedOut = existing
    ? (await mongoose.connection.collection(USER_SESSION_COLLECTION).deleteMany({ 'session.user.id': String(existing._id) })).deletedCount
    : 0;
  // eslint-disable-next-line no-console
  console.log(`User "${user?.email}" ${existing ? `updated (password reset, ${signedOut} session(s) signed out)` : 'created'}.`);
}

main()
  .catch((err: Error) => {
    // eslint-disable-next-line no-console
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
