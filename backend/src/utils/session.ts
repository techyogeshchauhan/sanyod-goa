import type { Request } from 'express';

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
