import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type Ref } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SHIPPING_STATES } from '@shared/constants';
import { addressSchema } from '@shared/schemas/purchases';
import type { Address, BookDetail, BookPurchaseStatus, PaymentSummary } from '@shared/types/catalog';
import { ApiError } from '@/api/client';
import { booksApi, paymentsApi, settingsApi } from '@/api/catalog';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import { ORDER_STATUS_LABEL, nl2lines, rupees } from '@/utils/format';
import '@/styles/pages/book-details.page.css';

type Option = 'pdf' | 'hardbook';

const EMPTY_ADDRESS: Address = { fullName: '', phone: '', address: '', city: '', state: '', pincode: '', landmark: '' };

/** Book details + purchase (books_details.php). Login required, as on live. */
export default function BookDetailPage() {
  useBodyClass('page-book-details');
  const { slug = '' } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['book', slug], queryFn: () => booksApi.get(slug) });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.public, staleTime: 10 * 60 * 1000 });

  const [option, setOption] = useState<Option>('pdf');
  const [showPayment, setShowPayment] = useState(false);
  const [address, setAddress] = useState<Address>({ ...EMPTY_ADDRESS, fullName: user?.name ?? '' });
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ payment: PaymentSummary; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (success) window.setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [success]);

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Unable to load this book. Please refresh the page.</div>
      </div>
    );
  }

  const { book, purchase } = data;
  const pdfPrice = book.pricePdf;
  const hardPrice = book.priceHardcopy;
  const price = option === 'pdf' ? pdfPrice : hardPrice;
  const upiId = !showPayment
    ? (settings?.upiIdDefault ?? '6355034424@upi')
    : option === 'pdf'
      ? (settings?.upiIdPdf ?? 'pdf.6355034424@upi')
      : (settings?.upiIdHardcopy ?? 'hardbook.6355034424@upi');
  const qr = settings?.qrImageBooks ?? '/Books/QR.jpg';

  const pdfBlocked = Boolean(purchase?.canRead || purchase?.pdf === 'pending' || purchase?.pdf === 'approved');
  const hardBlocked = purchase?.hardcopy === 'pending' || (purchase?.hardcopy === 'approved' && purchase.hardcopyOrderStatus !== 'delivered');

  function selectPurchaseOption(next: Option) {
    if (!book.purchasable) return;
    if ((next === 'pdf' && pdfBlocked) || (next === 'hardbook' && (hardBlocked || !book.hardcopyAvailable))) return;
    setOption(next);
    setShowPayment(true);
    setFormError(null);
    window.setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }

  function onAddress(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'pincode') value = value.replace(/\D/g, '').slice(0, 6);
    setAddress((a) => ({ ...a, [name]: value }));
    setInvalid((s) => {
      const n = new Set(s);
      n.delete(name);
      return n;
    });
  }

  async function copyUpiId(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(`Failed to copy UPI ID. Please copy manually: ${upiId}`);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    let shippingAddress: Address | undefined;
    if (option === 'hardbook') {
      const parsed = addressSchema.safeParse(address);
      if (!parsed.success) {
        const bad = new Set(parsed.error.issues.map((i) => String(i.path[0])));
        setInvalid(bad);
        setFormError(parsed.error.issues[0]?.message ?? 'Please fill all required fields');
        document.getElementById('hardbook-address')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      shippingAddress = parsed.data;
    }
    if (transactionId.trim().length < 6) {
      setFormError('Please enter your UPI Transaction ID.');
      return;
    }
    if (!screenshot) {
      setFormError('Please upload a screenshot of your payment.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await paymentsApi.create({
        itemType: option === 'pdf' ? 'book_pdf' : 'book_hardcopy',
        itemSlug: book.slug,
        upiTransactionId: transactionId.trim(),
        screenshot,
        shippingAddress,
      });
      setSuccess(result);
      setShowPayment(false);
      setTransactionId('');
      setScreenshot(null);
      if (fileRef.current) fileRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['book', slug] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setFormError(err instanceof ApiError ? (err.fields ? Object.values(err.fields)[0] ?? err.message : err.message) : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {success && <SuccessAlert anchorRef={successRef} result={success} email={user?.email ?? ''} onClose={() => setSuccess(null)} />}
      <div className="container mt-4">
        {/* User Info */}
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <i className="fas fa-user"></i> Welcome, <strong>{user?.name ?? 'User'}</strong>
            <small className="ms-2 text-muted">({user?.email})</small>
          </div>
          <div>
            <Link to="/my-books" className="btn btn-outline-primary btn-sm me-2">
              <i className="fas fa-book"></i> My Books
            </Link>
            <Link to="/my-orders" className="btn btn-outline-info btn-sm me-2">
              <i className="fas fa-shopping-cart"></i> My Orders
            </Link>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div className="book-container">
          <BookInfo book={book} />

          {/* Purchase Options */}
          <div className="purchase-options mt-4">
            <h3 className="mb-3 ps-3 pt-3">Choose Your Purchase Option</h3>
            {!book.purchasable && (
              <div className="alert alert-warning mx-3">
                <i className="fas fa-info-circle"></i> This book will be available for purchase soon. Please contact us at{' '}
                <a href={`mailto:${settings?.contactEmail ?? 'sanyod@sanyod.in'}`}>{settings?.contactEmail ?? 'sanyod@sanyod.in'}</a>.
              </div>
            )}

            {/* PDF Option */}
            <div className={`purchase-option${option === 'pdf' ? ' active' : ''}`} id="pdf-option">
              <div className="option-header">
                <div className="option-title">
                  <i className="fas fa-file-pdf"></i>
                  PDF Version
                  <StatusIndicator kind="pdf" purchase={purchase} />
                </div>
                <div className="option-price">{rupees(pdfPrice)}</div>
              </div>
              <ul className="option-features">
                <li><i className="fas fa-check-circle"></i> Instant download after approval</li>
                <li><i className="fas fa-check-circle"></i> Read on any device</li>
                <li><i className="fas fa-check-circle"></i> Lifetime access</li>
                <li><i className="fas fa-check-circle"></i> Searchable text</li>
                <li><i className="fas fa-check-circle"></i> Environment friendly</li>
              </ul>
              {purchase?.canRead ? (
                <Link to={`/my-books/${book.slug}/read`} className="option-select-btn d-block text-center text-decoration-none" style={{ background: '#198754' }}>
                  <i className="fas fa-book-open"></i> Read Now
                </Link>
              ) : (
                <button
                  type="button"
                  className={`option-select-btn${option === 'pdf' && !pdfBlocked ? ' selected' : ''}${pdfBlocked || !book.purchasable ? ' disabled' : ''}`}
                  disabled={pdfBlocked || !book.purchasable}
                  onClick={() => selectPurchaseOption('pdf')}
                >
                  {purchase?.pdf === 'pending' ? (
                    <><i className="fas fa-clock"></i> Payment Pending Approval</>
                  ) : (
                    <><i className="fas fa-shopping-cart"></i> Select PDF Version</>
                  )}
                </button>
              )}
            </div>

            {/* Hard Book Option */}
            <div className={`purchase-option${option === 'hardbook' ? ' active' : ''}`} id="hardbook-option">
              <div className="option-header">
                <div className="option-title">
                  <i className="fas fa-book"></i>
                  Hard Book (Physical Copy)
                  <StatusIndicator kind="hardbook" purchase={purchase} />
                </div>
                <div className="option-price">{rupees(hardPrice, false)}</div>
              </div>
              <ul className="option-features">
                <li><i className="fas fa-check-circle"></i> Physical paperback/hardcover book</li>
                <li><i className="fas fa-check-circle"></i> Free shipping across India</li>
                <li><i className="fas fa-check-circle"></i> 3-5 business days delivery</li>
                <li><i className="fas fa-check-circle"></i> 7-day return policy</li>
                <li><i className="fas fa-check-circle"></i> Gift wrapping available</li>
              </ul>
              <button
                type="button"
                className={`option-select-btn${option === 'hardbook' && !hardBlocked ? ' selected' : ''}${hardBlocked || !book.purchasable || !book.hardcopyAvailable ? ' disabled' : ''}`}
                disabled={hardBlocked || !book.purchasable || !book.hardcopyAvailable}
                onClick={() => selectPurchaseOption('hardbook')}
              >
                {!book.hardcopyAvailable ? (
                  <><i className="fas fa-ban"></i> Currently Unavailable</>
                ) : purchase?.hardcopy === 'pending' ? (
                  <><i className="fas fa-clock"></i> Order Pending Approval</>
                ) : hardBlocked ? (
                  <><i className="fas fa-truck"></i> {ORDER_STATUS_LABEL[purchase?.hardcopyOrderStatus ?? 'processing']}</>
                ) : (
                  <><i className="fas fa-shopping-cart"></i> Select Hard Book</>
                )}
              </button>
            </div>
          </div>

          {/* Shipping Address Section (for hard book) */}
          <div className={`address-section${showPayment && option === 'hardbook' ? ' active' : ''}`} id="hardbook-address">
            <h4><i className="fas fa-shipping-fast"></i> Shipping Address</h4>
            <p className="text-muted">Please provide your shipping address for hard book delivery</p>
            <div id="address-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name <span className="required">*</span></label>
                  <input type="text" className={`form-control${invalid.has('fullName') ? ' is-invalid' : ''}`} id="fullName" name="fullName" value={address.fullName} onChange={onAddress} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number <span className="required">*</span></label>
                  <input type="tel" inputMode="numeric" className={`form-control${invalid.has('phone') ? ' is-invalid' : ''}`} id="phone" name="phone" title="10 digit phone number" value={address.phone} onChange={onAddress} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="address">Full Address <span className="required">*</span></label>
                <textarea className={`form-control${invalid.has('address') ? ' is-invalid' : ''}`} id="address" name="address" rows={3} placeholder="House no, Street, Area" value={address.address} onChange={onAddress} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="city">City <span className="required">*</span></label>
                  <input type="text" className={`form-control${invalid.has('city') ? ' is-invalid' : ''}`} id="city" name="city" value={address.city} onChange={onAddress} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="state">State <span className="required">*</span></label>
                  <select className={`form-control${invalid.has('state') ? ' is-invalid' : ''}`} id="state" name="state" value={address.state} onChange={onAddress}>
                    <option value="">Select State</option>
                    {SHIPPING_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pincode">Pincode <span className="required">*</span></label>
                  <input type="text" inputMode="numeric" className={`form-control${invalid.has('pincode') ? ' is-invalid' : ''}`} id="pincode" name="pincode" title="6 digit pincode" value={address.pincode} onChange={onAddress} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="landmark">Landmark (Optional)</label>
                <input type="text" className="form-control" id="landmark" name="landmark" placeholder="Nearby landmark for easy delivery" value={address.landmark ?? ''} onChange={onAddress} />
              </div>
            </div>
          </div>

          {/* Purchase Summary */}
          {showPayment && price != null && pdfPrice != null && (
            <div className="purchase-summary" id="purchase-summary">
              <h4><i className="fas fa-receipt"></i> Order Summary</h4>
              <div id="summary-content">
                {option === 'pdf' ? (
                  <>
                    <div className="summary-item"><span>PDF Version</span><span>{rupees(pdfPrice, false)}</span></div>
                    <div className="summary-item"><span>Digital Delivery</span><span>FREE</span></div>
                    <div className="summary-item"><span>Platform Fee</span><span>₹0</span></div>
                  </>
                ) : (
                  <>
                    <div className="summary-item"><span>Hard Book</span><span>{rupees(pdfPrice, false)}</span></div>
                    <div className="summary-item"><span>Shipping (Free across India)</span><span>{rupees(price - pdfPrice, false)}</span></div>
                    <div className="summary-item"><span>Platform Fee</span><span>₹0</span></div>
                  </>
                )}
                <div className="summary-item summary-total"><span>Total Amount</span><span>{rupees(price, false)}</span></div>
              </div>
            </div>
          )}

          {/* Payment Status for each type */}
          <PendingNotice purchase={purchase} />

          {/* Payment Section (Shows only when option selected and not purchased) */}
          {showPayment && (
            <div className="payment-section mt-4" id="payment-section" ref={paymentRef}>
              <h3><i className="fas fa-qrcode"></i> Pay via UPI / QR Code</h3>
              <div className="notice-24h">
                <h5><i className="fas fa-clock text-warning"></i> Important Notice:</h5>
                <p className="mb-1"><strong>⏰ 24-Hour Processing Time:</strong> Your order will be reviewed and processed within <strong>24 hours</strong> after payment verification.</p>
                <p className="mb-0"><strong>📧 Email Confirmation:</strong> You will receive order confirmation email at <strong>{user?.email}</strong></p>
              </div>
              <div className="payment-type-info" id="payment-type-info">
                <i className="fas fa-info-circle"></i>{' '}
                <span id="payment-info-text">
                  {option === 'pdf' ? 'Paying for PDF Version - Instant Digital Delivery' : 'Paying for Hard Book - Physical Delivery with Shipping'}
                </span>
              </div>
              <div className="qr-container">
                <img src={qr} alt={option === 'pdf' ? 'PDF Payment QR Code' : 'Hard Book Payment QR Code'} className="qr-image" style={{ display: 'block', width: '200px', height: '200px' }} />
                <p className="qr-caption" id="qr-caption">
                  {option === 'pdf' ? 'Scan this QR code with any UPI app to pay for PDF version' : 'Scan this QR code with any UPI app to pay for Hard Book (includes shipping)'}
                </p>
              </div>
              <div className="alert alert-secondary text-center">
                <strong>UPI ID:</strong> <span id="upi-id">{upiId}</span>
                <button type="button" className={`btn btn-sm ms-2 ${copied ? 'btn-success' : 'btn-outline-primary'}`} onClick={copyUpiId}>
                  {copied ? <><i className="fas fa-check"></i> Copied!</> : <><i className="fas fa-copy"></i> Copy</>}
                </button>
              </div>
              <p className="text-muted text-center mb-4" id="payment-description">
                Pay <strong id="payment-amount">{rupees(price, false)}</strong> using any UPI app
              </p>

              <form onSubmit={onSubmit} id="payment-form" noValidate>
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    <strong>Error:</strong> {formError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="transaction_id" className="form-label">Transaction ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="transaction_id"
                    name="transaction_id"
                    required
                    placeholder="Enter UPI Transaction ID (e.g., TXN123456789)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <small className="text-muted">Found in your UPI app after payment</small>
                </div>
                <div className="form-group">
                  <label htmlFor="screenshot" className="form-label">Payment Screenshot *</label>
                  <input
                    ref={fileRef}
                    type="file"
                    className="form-control"
                    id="screenshot"
                    name="screenshot"
                    accept="image/*"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        window.alert('File size must be less than 5MB.');
                        e.target.value = '';
                        setScreenshot(null);
                        return;
                      }
                      setScreenshot(file);
                    }}
                  />
                  <small className="text-muted">Upload clear screenshot of payment confirmation from your UPI app</small>
                </div>
                <div className="email-confirmation">
                  <p className="mb-0"><i className="fas fa-envelope text-primary"></i> Order confirmation will be sent to: <strong>{user?.email}</strong></p>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-100 py-3" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Submitting...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Submit Payment &amp; Place Order</>
                  )}
                </button>
                <p className="text-center text-muted mt-2">
                  <small>By placing order, you agree to our Terms &amp; Conditions</small>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BookInfo({ book }: { book: BookDetail }) {
  const full = Math.floor(book.rating ?? 0);
  const half = (book.rating ?? 0) - full >= 0.5;
  return (
    <div className="row">
      <div className="col-md-4">
        <div className="book-image">
          <img src={book.cover} alt={book.title} style={{ width: '400px' }} />
        </div>
      </div>
      <div className="col-md-8">
        <div className="book-details">
          <h1 className="book-title">{book.title}</h1>
          <p className="book-author">By {book.author}</p>
          {(book.pages || book.publishedYear) && (
            <div className="book-meta">
              {book.pages && (
                <div className="meta-item">
                  <i className="fas fa-book-open"></i>
                  <span>{book.pages} Pages</span>
                </div>
              )}
              {book.publishedYear && (
                <div className="meta-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Published: {book.publishedYear}</span>
                </div>
              )}
            </div>
          )}
          {book.rating != null && (
            <div className="mb-3">
              <span className="text-warning">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} className={i < full ? 'fas fa-star' : i === full && half ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
                ))}
              </span>
              <span className="text-muted ms-2">
                {book.rating}
                {book.reviewCount ? ` (${book.reviewCount.toLocaleString('en-US')} reviews)` : ''}
              </span>
            </div>
          )}
          <div className="book-description">
            <div className="description-header">
              <i className="fas fa-file-alt"></i>
              <h4>Book Description</h4>
            </div>
            {nl2lines(book.description).map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ kind, purchase }: { kind: Option; purchase: BookPurchaseStatus | null }) {
  if (!purchase) return null;
  const cls = `purchase-type-indicator ${kind === 'pdf' ? 'pdf-indicator' : 'hardbook-indicator'}`;
  if (kind === 'pdf') {
    if (purchase.canRead) return <span className={cls}><i className="fas fa-check"></i> Purchased</span>;
    if (purchase.pdf === 'pending') return <span className={cls}><i className="fas fa-clock"></i> Pending</span>;
    if (purchase.pdf === 'rejected') return <span className={cls} style={{ background: '#fdecea', color: '#c0392b' }}>Payment rejected</span>;
    return null;
  }
  if (purchase.hardcopy === 'pending') return <span className={cls}><i className="fas fa-clock"></i> Pending</span>;
  if (purchase.hardcopy === 'approved') return <span className={cls}><i className="fas fa-truck"></i> {ORDER_STATUS_LABEL[purchase.hardcopyOrderStatus ?? 'processing']}</span>;
  if (purchase.hardcopy === 'rejected') return <span className={cls} style={{ background: '#fdecea', color: '#c0392b' }}>Payment rejected</span>;
  return null;
}

function PendingNotice({ purchase }: { purchase: BookPurchaseStatus | null }) {
  const pending = [purchase?.pdf === 'pending' && 'PDF Version', purchase?.hardcopy === 'pending' && 'Hard Book'].filter(Boolean);
  if (!pending.length) return null;
  return (
    <div className="success-timeline">
      <h5><i className="fas fa-hourglass-half text-warning"></i> Payment Under Review: {pending.join(' & ')}</h5>
      <div className="timeline-step">
        <div className="timeline-icon"><i className="fas fa-check"></i></div>
        <div>Payment details submitted</div>
      </div>
      <div className="timeline-step">
        <div className="timeline-icon" style={{ background: '#ffc107' }}><i className="fas fa-search"></i></div>
        <div>Admin review — usually within 24 hours</div>
      </div>
      <div className="timeline-step mb-0">
        <div className="timeline-icon" style={{ background: '#adb5bd' }}><i className="fas fa-envelope"></i></div>
        <div>You will receive an email once it is approved</div>
      </div>
    </div>
  );
}

const SuccessAlert = ({
  anchorRef,
  result,
  email,
  onClose,
}: {
  anchorRef: Ref<HTMLDivElement>;
  result: { payment: PaymentSummary; emailSent: boolean };
  email: string;
  onClose: () => void;
}) => {
  const { payment, emailSent } = result;
  const isPdf = payment.itemType === 'book_pdf';
  return (
    <div ref={anchorRef} className="alert alert-success alert-dismissible fade show" role="alert">
      <div className="d-flex align-items-center">
        <i className="fas fa-check-circle fa-2x me-3 text-success"></i>
        <div>
          <h4 className="alert-heading mb-1">🎉 Order Successful!</h4>
          <p className="mb-1">Your order <strong>{payment.orderNumber}</strong> has been placed successfully!</p>
          <p className="mb-1">Transaction ID: <strong>{payment.upiTransactionId}</strong></p>
          <p className="mb-1">Amount Paid: <strong>{rupees(payment.amount, false)}</strong></p>
          {emailSent ? (
            <p className="mb-1"><i className="fas fa-envelope text-primary"></i> Confirmation email sent to <strong>{email}</strong></p>
          ) : (
            <p className="mb-1 text-warning"><i className="fas fa-exclamation-triangle"></i> Email notification failed, but order was saved.</p>
          )}
        </div>
      </div>
      <hr />
      <div className="mt-2">
        <h5><i className="fas fa-clock text-info"></i> Order Processing Timeline:</h5>
        <div className="row mt-2">
          <div className="col-md-6">
            <div className="card bg-light mb-2">
              <div className="card-body p-3">
                <h6 className="card-title"><i className="fas fa-search text-primary"></i> Order Review</h6>
                <p className="card-text mb-0">Your order will be reviewed by admin</p>
                <small className="text-muted">Within 24 hours</small>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-light mb-2">
              <div className="card-body p-3">
                {isPdf ? (
                  <>
                    <h6 className="card-title"><i className="fas fa-file-pdf text-danger"></i> PDF Availability</h6>
                    <p className="card-text mb-0">PDF will be available for download</p>
                    <small className="text-muted">Within 24 hours after approval</small>
                  </>
                ) : (
                  <>
                    <h6 className="card-title"><i className="fas fa-shipping-fast text-warning"></i> Shipping</h6>
                    <p className="card-text mb-0">Book will be shipped to your address</p>
                    <small className="text-muted">3-5 business days after approval</small>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/my-orders" className="btn btn-primary me-2">
          <i className="fas fa-shopping-cart"></i> View My Orders
        </Link>
        {isPdf && (
          <Link to="/my-books" className="btn btn-success">
            <i className="fas fa-book"></i> My Books
          </Link>
        )}
      </div>
      <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
    </div>
  );
};
