import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { DashboardStats } from '@shared/types/admin';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/admin.page.css';
import { adminApi } from './api';
import { useAdminAuth } from './AdminAuth';

const FONTS = 'https://fonts.googleapis.com/css2?family=Paytone+One&family=Poppins:wght@300;400;500;600;700&display=swap';

/** Fonts + body class shared by every admin screen (login included). */
export function AdminChrome() {
  useBodyClass('page-admin');
  return (
    <Helmet>
      <title>Administrator</title>
      <link rel="stylesheet" href={FONTS} />
    </Helmet>
  );
}

interface NavItem {
  to: string;
  icon: string;
  label: string;
  count?: (s: DashboardStats) => number;
  superOnly?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  { section: 'Overview', items: [{ to: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard' }] },
  {
    section: 'Sales',
    items: [
      {
        to: '/admin/payments',
        icon: 'fas fa-money-check-alt',
        label: 'Payments',
        count: (s) => s.pendingPayments.book_pdf + s.pendingPayments.book_hardcopy + s.pendingPayments.course,
      },
      { to: '/admin/orders', icon: 'fas fa-truck', label: 'Book Orders', count: (s) => s.ordersByStatus.processing },
    ],
  },
  {
    section: 'Content',
    items: [
      { to: '/admin/books', icon: 'fas fa-book', label: 'Books' },
      { to: '/admin/courses', icon: 'fas fa-play-circle', label: 'Courses & Videos' },
      { to: '/admin/doctors', icon: 'fas fa-user-md', label: 'Doctors' },
      { to: '/admin/events', icon: 'fas fa-calendar-alt', label: 'Programmes' },
    ],
  },
  {
    section: 'Requests',
    items: [
      { to: '/admin/consultations', icon: 'fas fa-stethoscope', label: 'Consultations', count: (s) => s.pendingConsultations },
      { to: '/admin/bookings', icon: 'fas fa-ticket-alt', label: 'Event Bookings', count: (s) => s.pendingBookings },
      { to: '/admin/messages', icon: 'fas fa-envelope', label: 'Messages', count: (s) => s.newMessages },
      { to: '/admin/newsletter', icon: 'fas fa-paper-plane', label: 'Newsletter' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/admin/users', icon: 'fas fa-users', label: 'Users' },
      { to: '/admin/settings', icon: 'fas fa-cog', label: 'Settings' },
      { to: '/admin/admins', icon: 'fas fa-user-shield', label: 'Admin Accounts', superOnly: true },
      { to: '/admin/activity', icon: 'fas fa-history', label: 'Activity Log' },
      { to: '/admin/account', icon: 'fas fa-key', label: 'My Password' },
    ],
  },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.get<DashboardStats>('/dashboard'),
    refetchInterval: 60_000,
  });

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <AdminChrome />
      <div className="admin-topbar">
        <div className="d-flex align-items-center gap-2">
          <button className="menu-toggle d-lg-none" type="button" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <i className="fas fa-bars"></i>
          </button>
          <Link to="/admin" className="pppht">
            SANYOD Admin
          </Link>
        </div>
        <div className="admin-user d-flex align-items-center gap-3">
          <a href="/" target="_blank" rel="noopener" className="d-none d-sm-inline">
            <i className="fas fa-external-link-alt"></i> View site
          </a>
          <span className="d-none d-md-inline text-muted">
            <i className="fas fa-user-circle"></i> {admin?.name || admin?.username}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
      <div className="admin-shell">
        <nav className={`admin-sidebar${open ? ' open' : ''}`} aria-label="Admin">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items
                .filter((i) => !i.superOnly || admin?.role === 'superadmin')
                .map((item) => {
                  const n = stats && item.count ? item.count(stats) : 0;
                  return (
                    <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <i className={item.icon}></i>
                      {item.label}
                      {n > 0 && <span className="count">{n}</span>}
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </nav>
        <main id="page-wrapper">
          <Outlet />
        </main>
      </div>
    </>
  );
}
