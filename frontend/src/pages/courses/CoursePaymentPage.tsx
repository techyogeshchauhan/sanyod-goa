import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { PaymentMethod } from '@shared/types/catalog';
import { formatRupees } from '@shared/utils/text';
import { courseDetailApi, paymentsApi, settingsApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import '@/styles/pages/course-payment.page.css';

const METHODS: { id: PaymentMethod; icon: string; name: string }[] = [
  { id: 'upi', icon: 'fa fa-mobile-alt', name: 'UPI' },
  { id: 'card', icon: 'fa fa-credit-card', name: 'Credit/Debit Card' },
  { id: 'netbanking', icon: 'fa fa-university', name: 'Net Banking' },
  { id: 'wallet', icon: 'fa fa-wallet', name: 'Wallet' },
];

/** Course purchase (payment.php): method, transaction ID and screenshot, approved by the admin. */
export default function CoursePaymentPage() {
  useBodyClass('page-course-payment');
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['course', slug, true], queryFn: () => courseDetailApi.get(slug) });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.public, staleTime: 10 * 60 * 1000 });
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) return <PageLoading />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !data) return <PageError error={error} />;
  const { course, purchase } = data;
  const amount = formatRupees(course.price, false);
  const upi = settings?.upiIdDefault ?? '6355034424@upi';

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
    if (!transactionId.trim()) return setFormError('Please enter your Transaction ID.');
    if (!file) return setFormError('Please upload your payment screenshot.');
    setSubmitting(true);
    try {
      const { payment } = await paymentsApi.create({
        itemType: 'course',
        itemSlug: course.slug,
        upiTransactionId: transactionId.trim(),
        paymentMethod: method,
        screenshot: file,
      });
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
    <section style={{ background: '#f0f0f0', padding: '40px 0' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h2 className="otto" style={{ fontSize: '30px' }}>
            <i className="fa fa-credit-card"></i> <b>PAYMENT</b>
          </h2>
          <Link to={`/courses/${course.slug}`} className="btn-custom btn-outline-custom">
            <i className="fa fa-arrow-left"></i> Back to Course
          </Link>
        </div>
        <div className="row">
          {/* COURSE INFORMATION */}
          <div className="col-lg-5 mb-4">
            <div className="payment-container">
              <div className="course-summary">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">
                  {course.description.length > 160 ? `${course.description.slice(0, 160)}...` : course.description}
                </p>
                <div className="price-section">
                  <div className="final-price">{amount}</div>
                  {course.discountPercent > 0 && (
                    <>
                      <div className="original-price">{formatRupees(course.originalPrice, false)}</div>
                      <div className="discount-badge">{course.discountPercent}% OFF</div>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="user-info-card">
                  <h4 className="user-info-title">Your Information</h4>
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                </div>
                <div className="features-list">
                  <h5 className="mb-3">What you'll get:</h5>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i>
                    <span>Full lifetime access to all {course.videoCount} videos</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i>
                    <span>Downloadable resources</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i>
                    <span>Certificate of completion</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i>
                    <span>{'Q&A support from instructors'}</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i>
                    <span>Mobile and TV access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT SECTION */}
          <div className="col-lg-7">
            <div className="payment-container">
              <div className="payment-form-section">
                <h3 className="form-title">Complete Your Purchase</h3>
                {blocked ? (
                  <div className="alert-info-custom">
                    <h6>
                      <i className="fa fa-info-circle"></i> {purchase?.canWatch ? 'You already own this course' : 'Payment already submitted'}
                    </h6>
                    <p className="mb-2">
                      {purchase?.canWatch
                        ? 'All videos of this course are unlocked for you.'
                        : 'Your payment for this course is under review. You will receive an email once it is approved (usually within 24 hours).'}
                    </p>
                    <Link to={purchase?.canWatch ? `/courses/${course.slug}` : '/my-orders'} className="btn btn-primary btn-sm">
                      {purchase?.canWatch ? 'Go to Course' : 'View My Orders'}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="alert-info-custom">
                      <h6>
                        <i className="fa fa-clock-o"></i> Payment Approval Process
                      </h6>
                      <p className="mb-0">
                        After payment, submit your transaction ID and payment screenshot. Your payment will be reviewed by our admin team.
                      </p>
                    </div>
                    <form id="paymentForm" onSubmit={onSubmit} noValidate>
                      {formError && (
                        <div className="alert alert-danger">
                          <i className="fa fa-exclamation-circle"></i> {formError}
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label">Select Payment Method</label>
                        <div className="payment-methods">
                          {METHODS.map((m) => (
                            <div
                              key={m.id}
                              className={`payment-method${method === m.id ? ' selected' : ''}`}
                              data-method={m.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setMethod(m.id)}
                              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMethod(m.id)}
                            >
                              <div className="payment-icon">
                                <i className={m.icon}></i>
                              </div>
                              <div className="payment-method-name">{m.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div id="transactionFields" className={`transaction-fields${method ? '' : ' hidden'}`}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="transaction_id">
                            Transaction ID *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="transaction_id"
                            placeholder="Enter your transaction ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Upload Payment Screenshot *</label>
                          <label className="upload-area d-block" htmlFor="screenshot">
                            <div className="upload-icon">
                              <i className="fa fa-cloud-upload-alt"></i>
                            </div>
                            <h5>Click to Upload Screenshot</h5>
                            <p className="text-muted">JPG, PNG, GIF - Max 5MB</p>
                            <input type="file" id="screenshot" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
                          </label>
                          <div id="filePreview" className="file-preview">
                            {file && preview && (
                              <>
                                <div className="alert alert-success">
                                  <i className="fa fa-check-circle"></i> File selected: {file.name}
                                </div>
                                <img src={preview} alt="Payment Screenshot" className="img-thumbnail" />
                              </>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Payment Instructions</label>
                          <div id="paymentInstructions" className="bg-light p-3 rounded">
                            <Instructions method={method} upi={upi} amount={amount} qr={settings?.qrImageCourses ?? '/images/Qr.png'} />
                          </div>
                        </div>
                      </div>
                      <div className="form-group">
                        <button type="submit" className="btn-custom btn-success-custom" id="submitBtn" disabled={!method || submitting} style={{ width: '100%' }}>
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span> Submitting...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-lock"></i> Submit Payment for Approval - {amount}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-center">
                        <small className="text-muted">
                          <i className="fa fa-shield-alt"></i> Your payment information is secure.
                        </small>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Instructions({ method, upi, amount, qr }: { method: PaymentMethod | null; upi: string; amount: string; qr: string }) {
  if (!method) return null;
  if (method === 'upi') {
    return (
      <>
        <h6>UPI Payment Instructions:</h6>
        <ol>
          <li>
            <img src={qr} alt="UPI QR code" style={{ width: '220px', maxWidth: '100%' }} />
          </li>
          <li>Open Google Pay, PhonePe or Paytm.</li>
          <li>
            Send payment to: <strong>{upi}</strong>
          </li>
          <li>
            Enter amount: <strong>{amount}</strong>
          </li>
          <li>Complete the payment.</li>
          <li>Take a screenshot.</li>
          <li>Enter your Transaction ID.</li>
        </ol>
      </>
    );
  }
  const title = { card: 'Card Payment Instructions:', netbanking: 'Net Banking Instructions:', wallet: 'Wallet Payment Instructions:' }[method];
  const first = { card: 'Use your Credit/Debit Card.', netbanking: 'Select your bank.', wallet: 'Open your wallet.' }[method];
  return (
    <>
      <h6>{title}</h6>
      <ol>
        <li>{first}</li>
        <li>
          Pay <strong>{amount}</strong> to <strong>{upi}</strong>.
        </li>
        <li>Complete the payment.</li>
        <li>Take a screenshot.</li>
        <li>Enter your Transaction ID.</li>
      </ol>
    </>
  );
}
