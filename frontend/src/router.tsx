import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import { GuestOnly, RequireAuth } from '@/routes/guards';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const AboutPage = lazy(() => import('@/pages/static/AboutPage'));
const ContactPage = lazy(() => import('@/pages/static/ContactPage'));
const PeaceBuildingPage = lazy(() => import('@/pages/static/PeaceBuildingPage'));
const IndianKnowledgePage = lazy(() => import('@/pages/spirituality/IndianKnowledgePage'));
const SpiritualLibraryPage = lazy(() => import('@/pages/spirituality/SpiritualLibraryPage'));
const CommunityPage = lazy(() => import('@/pages/spirituality/CommunityPage'));
const PersonalGuidancePage = lazy(() => import('@/pages/spirituality/PersonalGuidancePage'));
const PersonalityTestPage = lazy(() => import('@/pages/personality/PersonalityTestPage'));
const BooksPage = lazy(() => import('@/pages/books/BooksPage'));
const BookDetailPage = lazy(() => import('@/pages/books/BookDetailPage'));
const MyBooksPage = lazy(() => import('@/pages/library/MyBooksPage'));
const BookViewPage = lazy(() => import('@/pages/library/BookViewPage'));
const ReadBookPage = lazy(() => import('@/pages/library/ReadBookPage'));
const MyOrdersPage = lazy(() => import('@/pages/library/MyOrdersPage'));
const CoursesPage = lazy(() => import('@/pages/courses/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/courses/CourseDetailPage'));
const CoursePaymentPage = lazy(() => import('@/pages/courses/CoursePaymentPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/courses/PaymentSuccessPage'));
const MyCoursesPage = lazy(() => import('@/pages/courses/MyCoursesPage'));
const HealthPage = lazy(() => import('@/pages/health/HealthPage'));
const DoctorDetailPage = lazy(() => import('@/pages/health/DoctorDetailPage'));
const ProgramsPage = lazy(() => import('@/pages/programs/ProgramsPage'));
const AdminApp = lazy(() => import('@/admin/AdminApp'));

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const page = (node: ReactNode) => <Page>{node}</Page>;
const userOnly = (node: ReactNode) => (
  <RequireAuth>
    <Page>{node}</Page>
  </RequireAuth>
);

/** Route table: docs/06 § 5 and docs/03 § 2. */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: page(<HomePage />) },
      { path: 'programs', element: userOnly(<ProgramsPage />) },
      { path: 'personality-test', element: page(<PersonalityTestPage />) },
      { path: 'books', element: page(<BooksPage />) },
      { path: 'books/:slug', element: userOnly(<BookDetailPage />) },
      { path: 'my-books', element: userOnly(<MyBooksPage />) },
      { path: 'my-books/:slug', element: userOnly(<BookViewPage />) },
      { path: 'my-books/:slug/read', element: userOnly(<ReadBookPage />) },
      { path: 'my-orders', element: userOnly(<MyOrdersPage />) },
      { path: 'courses', element: page(<CoursesPage />) },
      { path: 'courses/:slug', element: page(<CourseDetailPage />) },
      { path: 'courses/:slug/payment', element: userOnly(<CoursePaymentPage />) },
      { path: 'payment/success', element: userOnly(<PaymentSuccessPage />) },
      { path: 'my-courses', element: userOnly(<MyCoursesPage />) },
      { path: 'health', element: page(<HealthPage />) },
      { path: 'health/doctors/:slug', element: userOnly(<DoctorDetailPage />) },
      { path: 'spirituality/indian-knowledge', element: page(<IndianKnowledgePage />) },
      { path: 'spirituality/library', element: page(<SpiritualLibraryPage />) },
      { path: 'spirituality/community', element: page(<CommunityPage />) },
      { path: 'spirituality/personal-guidance', element: page(<PersonalGuidancePage />) },
      { path: 'about', element: page(<AboutPage />) },
      { path: 'contact', element: page(<ContactPage />) },
      // The template's car-rental Blog page was removed (Q7, D-21a): old links go to the home page.
      { path: 'blog', element: <Navigate to="/" replace /> },
      { path: 'peace-building', element: page(<PeaceBuildingPage />) },
      {
        path: 'login',
        element: (
          <GuestOnly>
            <Page>
              <LoginPage />
            </Page>
          </GuestOnly>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestOnly>
            <Page>
              <RegisterPage />
            </Page>
          </GuestOnly>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Page>
            <ForgotPasswordPage />
          </Page>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Page>
            <ResetPasswordPage />
          </Page>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Admin panel: its own layout, session and bundle.
  { path: 'admin/*', element: page(<AdminApp />) },
]);
