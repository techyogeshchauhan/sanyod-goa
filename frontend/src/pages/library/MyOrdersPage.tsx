import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { OrderSummary } from '@shared/types/catalog';
import { ordersApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, dateTime, rupees } from '@/utils/format';
import '@/styles/pages/my-orders.page.css';

const TYPE_LABEL = { book_pdf: 'PDF Version', book_hardcopy: 'Hard Book', course: 'Online Course' } as const;
const STATUS_CLASS = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;
const STEPS = ['pending', 'processing', 'shipped', 'delivered'] as const;

/**
 * My Orders (my_orders.php returned HTTP 500 on live, so this page is new). It uses the
 * my_books.php look: welcome bar, stat cards, cards grid.
 */
export default function MyOrdersPage() {
  useBodyClass('page-my-orders');
  const { user } = useAuth();
  const { data: orders, isLoading, error } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.mine });

  const pending = orders?.filter((o) => o.status === 'pending').length ?? 0;
  const approved = orders?.filter((o) => o.status === 'approved').length ?? 0;

  return (
    <>
      <br />
      <br />
      <div className="container">
        <div className="alert alert-primary d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <i className="fas fa-user-circle fa-lg me-2"></i>
            Welcome back, <strong>{user?.name ?? 'User'}</strong>
            <span className="text-muted ms-2">({user?.email})</span>
          </div>
          <div>
            <Link to="/my-books" className="btn btn-outline-primary btn-sm me-2">
              <i className="fas fa-book"></i> My Books
            </Link>
            <Link to="/my-courses" className="btn btn-outline-primary btn-sm me-2">
              <i className="fas fa-play-circle"></i> My Courses
            </Link>
            <Link to="/books" className="btn btn-outline-success btn-sm">
              <i className="fas fa-book-open"></i> Browse Books
            </Link>
          </div>
        </div>

        <div className="books-stats">
          <div className="stat-card">
            <i className="fas fa-shopping-cart"></i>
            <h3>{orders?.length ?? 0}</h3>
            <p>Total Orders</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-hourglass-half"></i>
            <h3>{pending}</h3>
            <p>Awaiting Approval</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h3>{approved}</h3>
            <p>Approved</p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {error && <PageError error={error} />}

        {orders && orders.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-shopping-cart"></i>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Browse our books and courses to get started!</p>
            <Link to="/books" className="btn btn-primary btn-lg me-2">
              <i className="fas fa-book"></i> Browse Books
            </Link>
            <Link to="/courses" className="btn btn-outline-primary btn-lg">
              <i className="fas fa-play-circle"></i> Browse Courses
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="books-grid mb-5">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function OrderCard({ order: o }: { order: OrderSummary }) {
  const link =
    o.itemType === 'course' ? `/courses/${o.itemSlug}` : o.status === 'approved' ? `/my-books/${o.itemSlug}/read` : `/books/${o.itemSlug}`;
  return (
    <div className="book-card">
      {o.cover && (
        <div className="book-image">
          <img src={o.cover} alt={o.itemTitle} />
        </div>
      )}
      <div className="book-content">
        <h3 className="book-title">{o.itemTitle}</h3>
        <p className="book-author">
          Order <strong>{o.orderNumber}</strong>
        </p>
        <div className="book-meta flex-wrap">
          <span>
            <i className={o.itemType === 'course' ? 'fas fa-play-circle' : o.itemType === 'book_pdf' ? 'fas fa-file-pdf' : 'fas fa-book'}></i>{' '}
            {TYPE_LABEL[o.itemType]}
          </span>
          <span>
            <i className="fas fa-rupee-sign"></i> {rupees(o.amount, false)}
          </span>
        </div>
        <div className="purchase-date">
          <i className="fas fa-calendar-check"></i>
          Ordered on {dateTime(o.createdAt)}
          <br />
          <i className="fas fa-receipt"></i>
          Transaction ID: {o.upiTransactionId}
        </div>
        <div className="mb-2">
          Payment:{' '}
          <span className={`badge bg-${STATUS_CLASS[o.status]}`}>{PAYMENT_STATUS_LABEL[o.status]}</span>
        </div>
        {o.status === 'rejected' && o.rejectionReason && (
          <div className="alert alert-danger py-2 small mb-2">
            <strong>Reason:</strong> {o.rejectionReason}
          </div>
        )}
        {o.itemType === 'book_hardcopy' && o.orderStatus && (
          <div className="mb-2">
            {o.orderStatus === 'cancelled' ? (
              <span className="badge bg-secondary">Order Cancelled</span>
            ) : (
              <div className="d-flex flex-wrap gap-1 small">
                {STEPS.map((s) => {
                  const done = STEPS.indexOf(s) <= STEPS.indexOf(o.orderStatus as (typeof STEPS)[number]);
                  return (
                    <span key={s} className={`badge ${done ? 'bg-primary' : 'bg-light text-muted border'}`}>
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                  );
                })}
              </div>
            )}
            {o.trackingNumber && (
              <div className="small mt-2">
                <i className="fas fa-truck text-primary"></i> {o.courier ? `${o.courier}: ` : ''}
                <strong>{o.trackingNumber}</strong>
              </div>
            )}
            {o.shippingAddress && (
              <div className="small text-muted mt-2">
                <i className="fas fa-map-marker-alt"></i> {o.shippingAddress.fullName}, {o.shippingAddress.address}, {o.shippingAddress.city},{' '}
                {o.shippingAddress.state} - {o.shippingAddress.pincode}
              </div>
            )}
          </div>
        )}
        {o.itemSlug && (
          <div className="action-buttons">
            <Link to={link} className="btn-view">
              {o.status === 'approved' ? (
                o.itemType === 'course' ? (
                  <><i className="fas fa-play"></i> Watch Course</>
                ) : (
                  <><i className="fas fa-book-reader"></i> Read Online</>
                )
              ) : (
                <><i className="fas fa-eye"></i> View Item</>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
