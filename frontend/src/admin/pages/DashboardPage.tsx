import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { DashboardStats } from '@shared/types/admin';
import { dateTime, rupees } from '@/utils/format';
import { adminApi } from '../api';
import { Loading, PageTitle, QueryError, StatusBadge } from '../ui';

const TYPE = { book_pdf: 'Book (PDF)', book_hardcopy: 'Book (Hard copy)', course: 'Course' } as const;

function Card({ label, value, icon, color, to }: { label: string; value: string | number; icon: string; color: string; to?: string }) {
  const body = (
    <div className="dashboard-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: color }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="value" style={{ color }}>
          {value}
        </div>
      </div>
      <i className={`${icon} icon`} style={{ color }}></i>
    </div>
  );
  return <div className="col-sm-6 col-xl-3">{to ? <Link to={to} className="text-decoration-none text-reset">{body}</Link> : body}</div>;
}

export default function DashboardPage() {
  const { data: s, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => adminApi.get<DashboardStats>('/dashboard') });
  if (error && !s) {
    return (
      <>
        <PageTitle title="Dashboard" icon="fas fa-tachometer-alt" />
        <QueryError error={error} onRetry={() => void refetch()} />
      </>
    );
  }
  if (isLoading || !s) return <Loading />;
  const pending = s.pendingPayments.book_pdf + s.pendingPayments.book_hardcopy + s.pendingPayments.course;

  return (
    <>
      <PageTitle title="Dashboard" icon="fas fa-tachometer-alt" />
      <div className="row g-3 mb-4">
        <Card label="Payments to review" value={pending} icon="fas fa-money-check-alt" color="#d32f2f" to="/admin/payments" />
        <Card label="Orders to ship" value={s.ordersByStatus.processing} icon="fas fa-truck" color="#1565c0" to="/admin/orders" />
        <Card label="Revenue this month" value={rupees(s.revenueThisMonth, false)} icon="fas fa-rupee-sign" color="#2e7d32" />
        <Card label="Registered users" value={s.users} icon="fas fa-users" color="#6a1b9a" to="/admin/users" />
        <Card label="Consultation requests" value={s.pendingConsultations} icon="fas fa-stethoscope" color="#00897b" to="/admin/consultations" />
        <Card label="Event bookings" value={s.pendingBookings} icon="fas fa-ticket-alt" color="#ef6c00" to="/admin/bookings" />
        <Card label="New messages" value={s.newMessages} icon="fas fa-envelope" color="#ad1457" to="/admin/messages" />
        <Card label="Total revenue" value={rupees(s.revenueTotal, false)} icon="fas fa-chart-line" color="#37474f" />
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="admin-panel">
            <h5>
              <i className="fas fa-clock text-admin me-2"></i>Latest payments
            </h5>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/admin/payments?open=${p.id}`}>{p.orderNumber}</Link>
                        <div className="small text-muted">{dateTime(p.createdAt)}</div>
                      </td>
                      <td>{p.user?.name ?? '—'}</td>
                      <td>
                        {p.itemTitle}
                        <div className="small text-muted">{TYPE[p.itemType]}</div>
                      </td>
                      <td>{rupees(p.amount, false)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                  {s.recentPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No payments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="admin-panel">
            <h5>
              <i className="fas fa-hourglass-half text-admin me-2"></i>Waiting for review
            </h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between">
                Book PDFs <span className="badge bg-warning text-dark">{s.pendingPayments.book_pdf}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                Hard copies <span className="badge bg-warning text-dark">{s.pendingPayments.book_hardcopy}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                Courses <span className="badge bg-warning text-dark">{s.pendingPayments.course}</span>
              </li>
            </ul>
          </div>
          <div className="admin-panel">
            <h5>
              <i className="fas fa-truck text-admin me-2"></i>Hard copy orders
            </h5>
            <ul className="list-group list-group-flush">
              {Object.entries(s.ordersByStatus).map(([k, n]) => (
                <li key={k} className="list-group-item d-flex justify-content-between">
                  <StatusBadge status={k} /> <strong>{n}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-panel small text-muted">
            New users this month: <strong>{s.newUsersThisMonth}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
