import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatRupees } from '@shared/utils/text';
import { courseDetailApi, paymentsApi, settingsApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError } from '@/components/common/PageState';
import { FitImage, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';

const METHODS: { id: 'upi'; icon: string; name: string }[] = [
  { id: 'upi', icon: 'fa fa-mobile-alt', name: 'UPI' },
];

/** Course purchase (payment.php): method, transaction ID and screenshot, approved by the admin. */
export default function CoursePaymentPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['course', slug, true], queryFn: () => courseDetailApi.get(slug) });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.public, staleTime: 10 * 60 * 1000 });
  const [method, setMethod] = useState<'upi' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !data) return <PageError error={error} />;
  const { course, purchase } = data;
  const amount = formatRupees(course.price, false);
  const upi = settings?.upiIdDefault ?? '';
  const qr = settings?.qrImageCourses ?? '';
  const paymentConfigured = Boolean(upi || qr);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      window.alert('File size must be less than 5MB.');
      e.target.value = '';
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(String(ev.target?.result ?? ''));
    reader.readAsDataURL(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!method) return setFormError('Please select a payment method.');
    if (!paymentConfigured) return setFormError('Payment details are not configured yet. Please contact the site administrator.');
    if (!transactionId.trim()) return setFormError('Please enter your Transaction ID.');
    if (!file) return setFormError('Please upload your payment screenshot.');
    setSubmitting(true);
    try {
      const { payment } = await paymentsApi.create({ itemType: 'course', itemSlug: course.slug, upiTransactionId: transactionId.trim(), paymentMethod: method, screenshot: file });
      void queryClient.invalidateQueries({ queryKey: ['course', slug] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      navigate(`/payment/success?id=${payment.id}`, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? (err.fields ? (Object.values(err.fields)[0] ?? err.message) : err.message) : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const blocked = purchase?.canWatch || purchase?.status === 'pending';

  return (
    <section className="section">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>
            <Link to="/courses">Courses</Link>
          </span>
          <span>
            <Link to={`/courses/${course.slug}`}>{course.title}</Link>
          </span>
          <span>Payment</span>
        </nav>
        <h1 className="h2 mb-4">Complete your purchase</h1>
        <div className="row g-5">
          <div className="col-lg-5 order-lg-2">
            <div className="card-flat sticky-aside">
              <div className="split-media mb-3" style={{ aspectRatio: '16 / 9' }}>
                <FitImage src={course.image} />
              </div>
              <h2 className="h4 deva">{course.title}</h2>
              <div className="d-flex align-items-baseline gap-2 flex-wrap mb-3">
                <span className="price">{amount}</span>
                {course.discountPercent > 0 && (
                  <>
                    <span className="price-old">{formatRupees(course.originalPrice, false)}</span>
                    <span className="chip sage">{course.discountPercent}% off</span>
                  </>
                )}
              </div>
              <div className="summary-line">
                <span className="text-muted">Name</span>
                <span className="text-ink fw-600">{user?.name}</span>
              </div>
              <div className="summary-line">
                <span className="text-muted">Email</span>
                <span className="text-ink fw-600 text-break text-end">{user?.email}</span>
              </div>
              <h3 className="h6 mt-4 mb-3">What you'll get</h3>
              <ul className="check-list small">
                <li>Full lifetime access to all {course.videoCount} videos</li>
                <li>Downloadable resources</li>
                <li>Certificate of completion</li>
                <li>Q&amp;A support from instructors</li>
              </ul>
            </div>
          </div>

          <div className="col-lg-7 order-lg-1">
            {blocked ? (
              <div className="card-flat">
                <span className="icon-badge sage">
                  <i className="fa fa-check"></i>
                </span>
                <h2 className="h4">{purchase?.canWatch ? 'You already own this course' : 'Payment already submitted'}</h2>
                <p className="text-muted">
                  {purchase?.canWatch
                    ? 'All videos of this course are unlocked for you.'
                    : 'Your payment for this course is under review. You will receive an email once it is approved (usually within 24 hours).'}
                </p>
                <Link to={purchase?.canWatch ? `/courses/${course.slug}` : '/my-orders'} className="btn btn-primary">
                  {purchase?.canWatch ? 'Go to course' : 'View my orders'}
                </Link>
              </div>
            ) : (
              <form id="paymentForm" className="card-flat" onSubmit={onSubmit} noValidate>
                <div className="alert alert-info small">
                  <i className="fa fa-info-circle me-1"></i> Pay, then submit your transaction ID and a screenshot. Our team approves payments within 24 hours.
                </div>
                {formError && (
                  <div className="alert alert-danger">
                    <i className="fa fa-exclamation-circle me-1"></i> {formError}
                  </div>
                )}
                {!paymentConfigured && <div className="alert alert-warning">Payment details are not configured yet. Please contact the site administrator.</div>}
                <h2 className="h5 mb-3">1. Choose a payment method</h2>
                <div className="row g-2 mb-4">
                  {METHODS.map((m) => (
                    <div className="col-6 col-md-3" key={m.id}>
                      <div
                        className={`option-card payment-method text-center p-3${method === m.id ? ' active selected' : ''}`}
                        data-method={m.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setMethod(m.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMethod(m.id)}
                      >
                        <i className={`${m.icon} fa-lg text-saffron mb-2 d-block`}></i>
                        <span className="small fw-600 text-ink">{m.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {method && (
                  <>
                    <h2 className="h5 mb-3">2. Pay {amount}</h2>
                    <div id="paymentInstructions" className="mb-4">
                      <div className="d-flex gap-3 flex-wrap align-items-center">
                        {qr && <div className="qr-box"><img src={qr} alt="UPI QR code" /></div>}
                        <ol className="small text-muted mb-0 ps-3">
                          <li>Open a UPI payment app.</li>
                          {upi && <li>Send payment to: <strong className="text-ink">{upi}</strong></li>}
                          <li>Enter amount: <strong className="text-ink">{amount}</strong></li>
                          <li>Complete the payment and take a screenshot.</li>
                        </ol>
                      </div>
                    </div>

                    <h2 className="h5 mb-3">3. Confirm your payment</h2>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="transaction_id">
                        Transaction ID *
                      </label>
                      <input type="text" className="form-control" id="transaction_id" placeholder="Enter your transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                    </div>
                    <div className="mb-4">
                      <span className="form-label d-block">Payment screenshot *</span>
                      <label className="dropzone" htmlFor="screenshot">
                        {file && preview ? (
                          <>
                            <img src={preview} alt="Payment screenshot" style={{ maxHeight: 160, borderRadius: 10 }} />
                            <div className="small text-sage fw-600 mt-2">
                              <i className="fa fa-check-circle"></i> {file.name}
                            </div>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-cloud-upload-alt fa-2x text-saffron mb-2"></i>
                            <div className="fw-600 text-ink">Click to upload screenshot</div>
                            <div className="small text-muted">JPG, PNG or GIF, max 5 MB</div>
                          </>
                        )}
                        <input type="file" id="screenshot" accept="image/*" className="d-none" onChange={onFile} />
                      </label>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-100" id="submitBtn" disabled={!method || submitting || !paymentConfigured}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm text-white" role="status"></span> Submitting…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-lock"></i> Submit Payment for Approval - {amount}
                    </>
                  )}
                </button>
                <p className="text-center small text-muted mt-2 mb-0">
                  <i className="fa fa-shield-alt me-1"></i> Your payment information is secure.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
