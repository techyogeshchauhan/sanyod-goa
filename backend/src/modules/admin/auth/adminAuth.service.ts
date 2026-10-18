import { Admin, toSessionAdmin } from '../../../models/Admin';
import type { AdminLoginInput } from '../../../shared/schemas/auth';
import type { SessionAdmin } from '../../../shared/types/auth';
import { AppError } from '../../../utils/errors';
import { hashPassword, verifyBcrypt } from '../../../utils/passwords';

export async function authenticateAdmin(input: AdminLoginInput): Promise<SessionAdmin> {
  const admin = await Admin.findOne({ username: input.username.toLowerCase(), isActive: true }).select('+passwordHash');
  if (!admin) {
    await hashPassword(input.password);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
  if (!(await verifyBcrypt(input.password, admin.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  return toSessionAdmin(admin);
}
