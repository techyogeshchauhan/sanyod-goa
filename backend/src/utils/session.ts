import type { Request } from 'express';
import mongoose from 'mongoose';
import { ADMIN_SESSION_COLLECTION } from '../config/session';

/** Regenerates the session (prevents fixation), applies `mutate`, then persists it. */
export function startSession(req: Request, mutate: (req: Request) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenErr) => {
      if (regenErr) return reject(regenErr);
      mutate(req);
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

/** Invalidates every admin session, optionally preserving the session handling this request. */
export async function revokeAdminSessions(adminId: string, exceptSessionId?: string): Promise<void> {
  const filter: Record<string, unknown> = { 'session.admin.id': adminId };
  if (exceptSessionId) filter._id = { $ne: exceptSessionId };
  await mongoose.connection.collection(ADMIN_SESSION_COLLECTION).deleteMany(filter);
}
