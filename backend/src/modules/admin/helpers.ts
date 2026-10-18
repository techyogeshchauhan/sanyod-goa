import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import type { Model } from 'mongoose';
import { sessionAdmin } from '../../middleware/auth';
import { AuditLog } from '../../models/AuditLog';
import type { ListQuery } from '../../shared/schemas/admin';
import type { Paginated } from '../../shared/types/api';
import { conflict } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
export const createdAt = (doc: unknown): string => iso((doc as { createdAt?: Date }).createdAt) ?? '';

/** Records an admin write. Never fails the request. */
export async function audit(req: Request, action: string, entity: string, entityId?: unknown, details?: Record<string, unknown>) {
  const admin = sessionAdmin(req);
  try {
    await AuditLog.create({ admin: admin.id, adminUsername: admin.username, action, entity, entityId: entityId ?? undefined, details });
  } catch (err) {
    logger.warn({ err, action }, 'audit log failed');
  }
}

export function paged<T>(items: T[], total: number, q: Pick<ListQuery, 'page' | 'pageSize'>): Paginated<T> {
  return { data: items, page: q.page, pageSize: q.pageSize, total };
}

export const skip = (q: Pick<ListQuery, 'page' | 'pageSize'>) => (q.page - 1) * q.pageSize;

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" filter over several fields. */
export function searchFilter(q: string | undefined, fields: string[]): Record<string, unknown> {
  if (!q) return {};
  const re = new RegExp(escapeRegex(q), 'i');
  return { $or: fields.map((f) => ({ [f]: re })) };
}

/** URL slug from a title. Non-Latin titles (Hindi) fall back to `<prefix>-<random>`; the admin can edit it. */
export function slugify(title: string, prefix: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return base.length >= 3 ? base : `${prefix}-${randomBytes(3).toString('hex')}`;
}

/** A slug not used by another document of the model (appends -2, -3 …). */
export async function uniqueSlug(model: Model<any>, wanted: string, excludeId?: unknown): Promise<string> {
  let candidate = wanted;
  for (let i = 2; i < 100; i++) {
    const clash = await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
    candidate = `${wanted}-${i}`;
  }
  throw conflict('SLUG_TAKEN', 'Please choose a different URL slug', { slug: 'This slug is already used' });
}

/** Drops keys whose value is undefined (keep explicit nulls: they clear a field). */
export function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
