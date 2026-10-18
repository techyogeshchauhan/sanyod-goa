import { Router, type Request } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';

/** Legacy PHP URL → new route (keys lower-case: /Courses.php and /courses.php both match). docs/12 § 4 */
const STATIC_REDIRECTS: Record<string, string> = {
  '/index.php': '/',
  '/programes.php': '/programs',
  '/personality_test.php': '/personality-test',
  '/books.php': '/books',
  '/my_books.php': '/my-books',
  '/view_book.php': '/my-books',
  '/read_pdf.php': '/my-books',
  '/view_pdf.php': '/my-books',
  '/my_orders.php': '/my-orders',
  '/courses.php': '/courses',
  '/payment_success.php': '/my-courses',
  '/payment_status.php': '/my-courses',
  '/my_courses.php': '/my-courses',
  '/health.php': '/health',
  '/ind_know.php': '/spirituality/indian-knowledge',
  '/spirituality.php': '/spirituality/indian-knowledge',
  '/lab.php': '/spirituality/library',
  '/counity.php': '/spirituality/community',
  '/presonal.php': '/spirituality/personal-guidance',
  '/about.php': '/about',
  '/contact.php': '/contact',
  '/peace_building.php': '/peace-building',
  '/login.php': '/login',
  '/register.php': '/register',
  '/forget.php': '/forgot-password',
  '/logout.php': '/',
  '/blog.php': '/',
  '/service.php': '/',
  '/team.php': '/',
  '/testimonial.php': '/',
  '/admin/login.php': '/admin/login',
  '/admin/index.php': '/admin',
};

type SlugResolver = (legacyId: number) => Promise<string | null>;

/**
 * Pages addressed by a legacy numeric id. `resolve` turns the id into the new path; it is
 * registered by the feature module that owns the collection (books, courses, doctors).
 */
interface DynamicRedirect {
  param: string;
  fallback: string;
  resolve?: SlugResolver;
}

const DYNAMIC_REDIRECTS: Record<string, DynamicRedirect> = {
  '/books_details.php': { param: 'books', fallback: '/books' },
  '/course_details.php': { param: 'subject_id', fallback: '/courses' },
  '/payment.php': { param: 'subject_id', fallback: '/courses' },
  '/doctor_detail.php': { param: 'doctor_id', fallback: '/health' },
  '/download_cv.php': { param: 'doctor_id', fallback: '/health' },
};

export function registerLegacyResolver(path: string, resolve: SlugResolver): void {
  const entry = DYNAMIC_REDIRECTS[path];
  if (!entry) throw new Error(`Unknown legacy path ${path}`);
  entry.resolve = resolve;
}

async function target(req: Request): Promise<string | null> {
  const path = req.path.toLowerCase();
  if (path === '/reset_password.php') {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    return token ? `/reset-password?token=${encodeURIComponent(token)}` : '/forgot-password';
  }
  const fixed = STATIC_REDIRECTS[path];
  if (fixed) return fixed;
  const dynamic = DYNAMIC_REDIRECTS[path];
  if (!dynamic) return null;
  const id = Number(req.query[dynamic.param]);
  if (!Number.isInteger(id) || id <= 0 || !dynamic.resolve) return dynamic.fallback;
  return (await dynamic.resolve(id)) ?? dynamic.fallback;
}

export const legacyRouter = Router();

legacyRouter.get(
  /\.php$/i,
  asyncHandler(async (req, res, next) => {
    const to = await target(req);
    if (!to) return next();
    res.redirect(301, to);
  }),
);
