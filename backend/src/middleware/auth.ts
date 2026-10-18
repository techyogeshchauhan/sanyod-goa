import type { Request, RequestHandler } from 'express';
import { User } from '../models/User';
import type { SessionAdmin, SessionUser } from '../shared/types/auth';
import { AppError, forbidden, unauthenticated } from '../utils/errors';

/** Logged-in user whose account is still active (an admin may deactivate it at any time). */
export const requireUser: RequestHandler = (req, _res, next) => {
  const user = req.session?.user;
  if (!user) return next(unauthenticated());
  User.exists({ _id: user.id, isActive: true })
    .then((found) => {
      if (found) return next();
      req.session.user = undefined;
      next(new AppError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated. Please contact us at sanyod@sanyod.in.'));
    })
    .catch(next);
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.session?.admin) return next(unauthenticated('Admin login required', 'ADMIN_UNAUTHENTICATED'));
  next();
};

export const requireSuperAdmin: RequestHandler = (req, _res, next) => {
  if (!req.session?.admin) return next(unauthenticated('Admin login required', 'ADMIN_UNAUTHENTICATED'));
  if (req.session.admin.role !== 'superadmin') return next(forbidden('Super admin access required'));
  next();
};

/** The session user of a route behind requireUser. */
export const sessionUser = (req: Request): SessionUser => req.session.user as SessionUser;
/** The session admin of a route behind requireAdmin. */
export const sessionAdmin = (req: Request): SessionAdmin => req.session.admin as SessionAdmin;
