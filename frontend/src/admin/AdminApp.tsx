import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, RequireAdmin } from './AdminAuth';
import { AdminLayout } from './AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import BooksPage from './pages/BooksPage';
import CoursesPage, { CourseVideosPage } from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
import { BookingsPage, EventsPage } from './pages/EventsPages';
import { ConsultationsPage, DoctorsPage } from './pages/HealthPages';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import {
  AccountPage,
  ActivityPage,
  AdminsPage,
  MessagesPage,
  NewsletterPage,
  SettingsPage,
  UserDetailPage,
  UsersPage,
} from './pages/PeoplePages';

/** The admin panel (/admin/*), replacing the PHP admin/ folder. Loaded as its own bundle. */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id/videos" element={<CourseVideosPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="newsletter" element={<NewsletterPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
