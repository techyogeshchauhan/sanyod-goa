import type { RequestHandler } from 'express';
import { isTest } from '../config/env';

/**
 * Small in-memory cache for public, rarely-changing reads (catalogue, settings). The database is
 * remote, so every query costs a network round trip; these lists change only when an admin edits
 * them. Entries expire after `ttlMs` and the whole cache is cleared on every admin write
 * (see `invalidateOnWrite`), so admins see their changes at once.
 *
 * Cached values are shared between requests: treat them as read-only (they are frozen).
 * With several API instances, another instance may serve the old value until its TTL ends.
 */

export const CATALOG_TTL_MS = 60_000;
/** Upper bound on entries (keys include slugs from the URL). */
const MAX_ENTRIES = 500;

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
let generation = 0;

/** Freezes plain objects and arrays only (ObjectId, Date … keep internal state they may update). */
function deepFreeze<T>(value: T): T {
  const plain =
    Array.isArray(value) ||
    (value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)));
  if (plain && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

/** The cached value for `key`, loading it once (concurrent callers share the same load). */
export async function cached<T>(key: string, load: () => Promise<T>, ttlMs = CATALOG_TTL_MS): Promise<T> {
  if (isTest) return load(); // tests change the database directly between requests
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const startedAt = generation;
  const promise = load()
    .then((value) => {
      // Don't keep a value loaded before an admin write cleared the cache, nor "not found" results
      // (unknown slugs would otherwise fill the cache).
      if (startedAt === generation && value !== null && value !== undefined) {
        if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
        store.set(key, { value: deepFreeze(value), expires: Date.now() + ttlMs });
      }
      return value;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

export function clearCache(): void {
  generation++;
  store.clear();
  inflight.clear();
}

/**
 * Lets browsers reuse a public, user-independent response for a short time (reloads and new tabs
 * skip the request). Kept short because admin edits can't reach browser caches.
 */
export function browserCache(seconds = 30): RequestHandler {
  return (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
}

/** Admin router middleware: any successful write clears the cache (before and after it runs). */
export const invalidateOnWrite: RequestHandler = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  clearCache();
  res.on('finish', () => {
    if (res.statusCode < 400) clearCache();
  });
  next();
};
