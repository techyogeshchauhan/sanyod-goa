/**
 * Creates (or resets) an admin account.
 * Usage: npm run create-admin -- --username <name> --password <pw> [--role admin|superadmin] [--name "Full Name"]
 */
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { ADMIN_ROLES } from '../shared/constants';
import { hashPassword } from '../utils/passwords';

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: 'string' },
      password: { type: 'string' },
      role: { type: 'string', default: 'admin' },
      name: { type: 'string' },
    },
  });
  const { username, password, role, name } = values;
  if (!username || !password) throw new Error('--username and --password are required');
  if (password.length < 10) throw new Error('Admin passwords must be at least 10 characters');
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) throw new Error(`--role must be one of ${ADMIN_ROLES.join(', ')}`);

  await connectDb(env.MONGODB_URI);
  const passwordHash = await hashPassword(password);
  const admin = await Admin.findOneAndUpdate(
    { username: username.toLowerCase() },
    { $set: { passwordHash, role, isActive: true, ...(name ? { name } : {}) } },
    { upsert: true, new: true },
  );
  // eslint-disable-next-line no-console
  console.log(`Admin "${admin.username}" (${admin.role}) saved.`);
}

main()
  .catch((err: Error) => {
    // eslint-disable-next-line no-console
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
