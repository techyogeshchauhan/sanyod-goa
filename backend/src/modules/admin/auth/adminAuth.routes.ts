import { Router, type Request, type Response } from 'express';
import { ADMIN_REMEMBER_MS, ADMIN_SESSION_COOKIE } from '../../../config/session';
import { requireAdmin } from '../../../middleware/auth';
import { Admin, toSessionAdmin } from '../../../models/Admin';
import { adminLoginLimiter } from '../../../middleware/rateLimit';
import { validate } from '../../../middleware/validate';
import { adminLoginSchema, type AdminLoginInput } from '../../../shared/schemas/auth';
import { asyncHandler } from '../../../utils/asyncHandler';
import { destroySession, startSession } from '../../../utils/session';
import { authenticateAdmin } from './adminAuth.service';

export const adminAuthRouter = Router();

adminAuthRouter.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionAdmin = req.session?.admin;
    if (!sessionAdmin) return res.json({ data: { admin: null } });

    const admin = await Admin.findOne({ _id: sessionAdmin.id, isActive: true });
    if (!admin) {
      await destroySession(req);
      res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
      return res.json({ data: { admin: null } });
    }

    const currentAdmin = toSessionAdmin(admin);
    req.session.admin = currentAdmin;
    res.json({ data: { admin: currentAdmin } });
  }),
);

adminAuthRouter.post(
  '/login',
  adminLoginLimiter,
  validate({ body: adminLoginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as AdminLoginInput;
    const admin = await authenticateAdmin(input);
    await startSession(req, (r) => {
      r.session.admin = admin;
      // "Remember me": persistent cookie; otherwise it ends with the browser session.
      r.session.cookie.maxAge = input.remember ? ADMIN_REMEMBER_MS : undefined;
    });
    res.json({ data: { admin } });
  }),
);

adminAuthRouter.post(
  '/logout',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await destroySession(req);
    res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  }),
);
