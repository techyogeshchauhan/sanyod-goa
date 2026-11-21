import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { paymentsApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { Spinner, StatusChip } from '@/components/ui';
import { PAYMENT_STATUS_LABEL } from '@/utils/format';

/** "Payment Submitted Successfully!" (payment_success.php). */
export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const valid = /^[a-f0-9]{24}$/i.test(id);
  const { data: payment, isLoading, error } = useQuery({ queryKey: ['payment', id], queryFn: () => paymentsApi.get(id), enabled: valid });

  // Live redirected to courses.php when there was no payment to show.
  if (!valid) return <Navigate to="/courses" replace />;
  if (isLoading) return <Spinner />;
  if (error || !payment) return <PageError error={error} />;

  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="card-flat text-center p-4 p-md-5">
          <span className="icon-badge sage lg">
            <i className={payment.status === 'approved' ? 'fa fa-check-circle' : 'fa fa-clock'}></i>
          </span>
          <h2 className="mb-2">Payment Submitted Successfully!</h2>
          <p className="lead mb-4">Your payment has been submitted for admin approval, usually within 24 hours.</p>
          <div className="row g-3 text-start mb-4">
            <div className="col-md-6">
              <div className="card-soft">
                <div className="small text-muted mb-1">
                  <i className="fa fa-receipt me-1"></i> Payment ID
                </div>
                <div className="card-body p-0">
                  <p className="h5 mb-0">#{payment.orderNumber}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-soft">
                <div className="small text-muted mb-1">
                  <i className="fa fa-clock me-1"></i> Status
                </div>
                <StatusChip status={payment.status} label={PAYMENT_STATUS_LABEL[payment.status]} />
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Link to="/my-courses" className="btn btn-primary">
              <i className="fa fa-book"></i> Check my courses
            </Link>
            <Link to="/my-orders" className="btn btn-light">
              <i className="fa fa-history text-saffron"></i> View payment status
            </Link>
          </div>
          <p className="small text-muted mt-4 mb-0">You will receive an email notification once your payment is approved.</p>
        </div>
      </div>
    </section>
  );
}
