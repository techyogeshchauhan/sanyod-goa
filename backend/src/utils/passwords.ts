import { createHash, timingSafeEqual } from 'node:crypto';
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

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Verifies hashes migrated from the PHP site that are not bcrypt (upgraded after login). */
export function verifyLegacy(password: string, hash: string, algo: 'md5' | 'sha1' | 'plain'): boolean {
  if (algo === 'plain') return safeEqual(password, hash);
  const digest = createHash(algo).update(password).digest('hex');
  return safeEqual(digest, hash.toLowerCase());
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
