import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { createAdminSession, createUserSession } from './config/session';
import { csrfProtection } from './middleware/csrf';
import { errorHandler, notFoundHandler } from './middleware/error';
import { requestId } from './middleware/requestId';
import { adminRouter } from './modules/admin/admin.routes';
import { authRouter } from './modules/auth/auth.routes';
import { booksRouter } from './modules/books/books.routes';
import { coursesRouter } from './modules/courses/courses.routes';
import { eventBookingsRouter, eventsRouter } from './modules/events/events.routes';
import { formsRouter } from './modules/forms/forms.routes';
import { consultationsRouter, doctorsRouter } from './modules/health/health.routes';
import { legacyRouter, registerLegacyResolver } from './modules/legacy/legacyRedirects';
import { libraryRouter } from './modules/library/library.routes';
import { ordersRouter, paymentsRouter } from './modules/payments/payments.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { Book } from './models/Book';
import { Course } from './models/Course';
import { Doctor } from './models/Doctor';
import { MEDIA_URL, PUBLIC_DIR } from './services/storage';
import { logger } from './utils/logger';

export interface AppOptions {
  /** MongoDB URI for the session stores (same database as Mongoose). */
  mongoUri: string;
}

async function courseSlug(legacyId: number) {
  const course = await Course.findOne({ legacyId }, 'slug').lean();
  return course ? `/courses/${course.slug}` : null;
}
async function doctorSlug(legacyId: number) {
  const doctor = await Doctor.findOne({ legacyIds: legacyId }, 'slug').lean();
  return doctor ? `/health/doctors/${doctor.slug}` : null;
}
registerLegacyResolver('/course_details.php', courseSlug);
registerLegacyResolver('/payment.php', async (id) => {
  const path = await courseSlug(id);
  return path ? `${path}/payment` : null;
});
registerLegacyResolver('/books_details.php', async (id) => {
  const book = await Book.findOne({ legacyId: id }, 'slug').lean();
  return book ? `/books/${book.slug}` : null;
});
registerLegacyResolver('/doctor_detail.php', doctorSlug);
registerLegacyResolver('/download_cv.php', doctorSlug);

export function createApp({ mongoUri }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestId);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://www.google.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        },
      },
      // Uploaded images are shown by the web app (another port in development).
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).id ?? '' }));

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  // Public uploads (covers, course images, doctor photos, event images, QR codes).
  // Private files (PDFs, screenshots, CVs) are never served from here.
  app.use(MEDIA_URL, express.static(PUBLIC_DIR, { fallthrough: false, index: false, maxAge: '7d', dotfiles: 'deny' }));

  // Admin API: its own session cookie; mounted before the user API so the routers stay disjoint.
  app.use('/api/admin', createAdminSession(mongoUri), csrfProtection, adminRouter);

  const api = Router();
  api.use(createUserSession(mongoUri), csrfProtection);
  api.use('/auth', authRouter);
  api.use('/settings', settingsRouter);
  api.use('/books', booksRouter);
  api.use('/courses', coursesRouter);
  api.use('/payments', paymentsRouter);
  api.use('/orders', ordersRouter);
  api.use('/library', libraryRouter);
  api.use('/doctors', doctorsRouter);
  api.use('/consultations', consultationsRouter);
  api.use('/events', eventsRouter);
  api.use('/event-bookings', eventBookingsRouter);
  api.use('/', formsRouter);
  app.use('/api', api);

  app.use(legacyRouter);
  app.use('/api', notFoundHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
