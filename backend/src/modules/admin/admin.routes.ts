import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { adminAuthRouter } from './auth/adminAuth.routes';
import { catalogRouter } from './catalog.routes';
import { peopleRouter } from './people.routes';
import { salesRouter } from './sales.routes';
import { servicesRouter } from './services.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);

// Everything below requires an admin session.
adminRouter.use(requireAdmin);
adminRouter.use(salesRouter); //    dashboard, payments, orders
adminRouter.use(catalogRouter); //  books, courses, videos
adminRouter.use(servicesRouter); // doctors, consultations, events, bookings
adminRouter.use(peopleRouter); //   users, access, messages, newsletter, settings, admins, audit log
