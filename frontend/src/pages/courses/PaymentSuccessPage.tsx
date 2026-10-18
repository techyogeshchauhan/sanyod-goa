import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { paymentsApi } from '@/api/catalog';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { PAYMENT_STATUS_LABEL } from '@/utils/format';
import '@/styles/pages/payment-success.page.css';

const STATUS_CLASS = { pending: 'text-warning', approved: 'text-success', rejected: 'text-danger' } as const;

/** "Payment Submitted Successfully!" (payment_success.php). */
export default function PaymentSuccessPage() {
  useBodyClass('page-payment-success');
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const { data: payment, isLoading, error } = useQuery({ queryKey: ['payment', id], queryFn: () => paymentsApi.get(id), enabled: /^[a-f0-9]{24}$/i.test(id) });

  // Live redirected to courses.php when there was no payment to show.
  if (!/^[a-f0-9]{24}$/i.test(id)) return <Navigate to="/courses" replace />;
  if (isLoading) return <PageLoading />;
  if (error || !payment) return <PageError error={error} />;

  return (
    <section style={{ background: '#f0f0f0', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container">
        <div className="success-container">
          <div className="success-icon pending-animation">
            <i className={payment.status === 'approved' ? 'fa fa-check-circle' : 'fa fa-clock'}></i>
          </div>
          <h2 className="mb-3">Payment Submitted Successfully!</h2>
          <p className="text-muted mb-4">Your payment has been submitted for admin approval.</p>
          <div className="alert alert-warning">
            <h5>
              <i className="fa fa-info-circle"></i> Approval Process
            </h5>
            <p className="mb-2">Your payment is currently under review by our administration team.</p>
            <p className="mb-0">
              <strong>Approval Time:</strong> Usually within 24 hours
            </p>
          </div>
          <div className="row mt-4">
            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h6>
                    <i className="fa fa-receipt"></i> Payment ID
                  </h6>
                  <p className="h5">#{payment.orderNumber}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h6>
                    <i className="fa fa-clock"></i> Status
                  </h6>
                  <p className={`h5 ${STATUS_CLASS[payment.status]}`}>{PAYMENT_STATUS_LABEL[payment.status]}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/my-courses" className="btn btn-warning me-3">
              <i className="fa fa-book"></i> Check My Courses
            </Link>
            <Link to="/my-orders" className="btn btn-outline-primary">
              <i className="fa fa-history"></i> View Payment Status
            </Link>
          </div>
          <div className="mt-4">
            <small className="text-muted">You will receive an email notification once your payment is approved.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
