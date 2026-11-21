import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { isTest } from '../config/env';

const ROUNDS = isTest ? 4 : 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

/** PHP's password_hash() produces $2y$ hashes, which are identical to $2b$. */
export function verifyBcrypt(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash.replace(/^\$2y\$/, '$2b$'));
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
