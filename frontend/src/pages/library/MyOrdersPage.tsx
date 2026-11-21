import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { OrderSummary } from '@shared/types/catalog';
import { ordersApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { EmptyState, FitImage, PageHero, Spinner, StatusChip } from '@/components/ui';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, dateTime, rupees } from '@/utils/format';

const TYPE_LABEL = { book_pdf: 'PDF Version', book_hardcopy: 'Hard Book', course: 'Online Course' } as const;
const TYPE_ICON = { book_pdf: 'fas fa-file-pdf', book_hardcopy: 'fas fa-book', course: 'fas fa-play-circle' } as const;
const STEPS = ['pending', 'processing', 'shipped', 'delivered'] as const;

/** My Orders (my_orders.php returned HTTP 500 on live, so this page is new). */
export default function MyOrdersPage() {
  const { data: orders, isLoading, error } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.mine });
  const pending = orders?.filter((o) => o.status === 'pending').length ?? 0;
  const approved = orders?.filter((o) => o.status === 'approved').length ?? 0;

  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'My Orders' }]}
        eyebrow="My orders"
        title="Your orders"
        lead="Books and courses you have ordered, their payment status and delivery progress."
        actions={
          <>
            <Link to="/my-books" className="btn btn-light">
              <i className="fas fa-book text-saffron"></i> My books
            </Link>
            <Link to="/my-courses" className="btn btn-light">
              <i className="fas fa-play-circle text-saffron"></i> My courses
            </Link>
          </>
        }
      />
      <section className="section">
        <div className="container">
          {orders && orders.length > 0 && (
            <div className="row g-3 mb-4">
              {[
                ['Total orders', orders.length, 'fas fa-receipt', ''],
                ['Awaiting approval', pending, 'fas fa-hourglass-half', 'gold'],
                ['Approved', approved, 'fas fa-check-circle', 'sage'],
              ].map(([label, n, icon, tone]) => (
                <div className="col-sm-4" key={label as string}>
                  <div className="card-soft d-flex align-items-center gap-3">
                    <span className={`icon-badge mb-0 ${tone}`}>
                      <i className={icon as string}></i>
                    </span>
                    <div>
                      <div className="price" style={{ fontSize: '1.5rem' }}>
                        {n}
                      </div>
                      <div className="small text-muted">{label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && <Spinner />}
          {error && <PageError error={error} />}
          {orders && orders.length === 0 && (
            <EmptyState icon="fas fa-shopping-bag" title="No orders yet" text="You haven't placed any orders yet. Browse our books and courses to get started!">
              <Link to="/books" className="btn btn-primary">
                Browse books
              </Link>
              <Link to="/courses" className="btn btn-light">
                Browse courses
              </Link>
            </EmptyState>
          )}
          <div className="d-grid gap-3">
            {orders?.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function OrderCard({ order: o }: { order: OrderSummary }) {
  const link = o.itemType === 'course' ? `/courses/${o.itemSlug}` : o.status === 'approved' ? `/my-books/${o.itemSlug}/read` : `/books/${o.itemSlug}`;
  return (
    <article className="card-soft book-card reveal">
      <div className="d-flex gap-3 flex-wrap flex-md-nowrap">
        {o.cover && (
          <div className="flex-shrink-0" style={{ width: 84 }}>
            <div className="cover-frame" style={{ aspectRatio: o.itemType === 'course' ? '4 / 3' : '3 / 4' }}>
              <FitImage src={o.cover} />
            </div>
          </div>
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between gap-2 flex-wrap mb-1">
            <h2 className="h5 mb-0 deva">{o.itemTitle}</h2>
            <span className="price" style={{ fontSize: '1.2rem' }}>
              {rupees(o.amount, false)}
            </span>
          </div>
          <ul className="meta-list small mb-2">
            <li>
              <i className={TYPE_ICON[o.itemType]}></i>
              {TYPE_LABEL[o.itemType]}
            </li>
            <li>
              <i className="fas fa-hashtag"></i>
              {o.orderNumber}
            </li>
            <li>
              <i className="far fa-clock"></i>
              {dateTime(o.createdAt)}
            </li>
            <li>
              <i className="fas fa-receipt"></i>
              Transaction ID: {o.upiTransactionId}
            </li>
          </ul>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="small text-muted">Payment:</span>
            <StatusChip status={o.status} label={PAYMENT_STATUS_LABEL[o.status]} />
          </div>
          {o.status === 'rejected' && o.rejectionReason && (
            <div className="alert alert-danger py-2 small mt-2 mb-0">
              <strong>Reason:</strong> {o.rejectionReason}
            </div>
          )}
          {o.itemType === 'book_hardcopy' && o.orderStatus && (
            <div className="mt-3">
              {o.orderStatus === 'cancelled' ? (
                <StatusChip status="cancelled" label="Order cancelled" />
              ) : (
                <div className="progress-steps">
                  {STEPS.map((s) => (
                    <span key={s} className={`ps${STEPS.indexOf(s) <= STEPS.indexOf(o.orderStatus as (typeof STEPS)[number]) ? ' done' : ''}`}>
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                  ))}
                </div>
              )}
              {o.trackingNumber && (
                <div className="small mt-2">
                  <i className="fas fa-truck text-saffron me-1"></i>
                  {o.courier ? `${o.courier}: ` : ''}
                  <strong>{o.trackingNumber}</strong>
                </div>
              )}
              {o.shippingAddress && (
                <div className="small text-muted mt-1">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  {o.shippingAddress.fullName}, {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode}
                </div>
              )}
            </div>
          )}
        </div>
        {o.itemSlug && (
          <div className="align-self-md-center">
            <Link to={link} className="btn btn-light btn-sm text-nowrap">
              {o.status === 'approved' ? (o.itemType === 'course' ? 'Watch course' : 'Read online') : 'View item'} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
