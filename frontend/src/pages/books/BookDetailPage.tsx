import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type Ref } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SHIPPING_STATES } from '@shared/constants';
import { addressSchema } from '@shared/schemas/purchases';
import type { Address, BookDetail, BookPurchaseStatus, PaymentSummary } from '@shared/types/catalog';
import { ApiError } from '@/api/client';
import { booksApi, paymentsApi, settingsApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { Spinner, StatusChip } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import { ORDER_STATUS_LABEL, nl2lines, rupees } from '@/utils/format';

type Option = 'pdf' | 'hardbook';

const EMPTY_ADDRESS: Address = { fullName: '', phone: '', address: '', city: '', state: '', pincode: '', landmark: '' };

/** Book details + purchase (books_details.php). Login required, as on live. */
export default function BookDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
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
  const checkoutRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (success) window.setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }, [success]);

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (!data) return <PageError error={error} fallback="Unable to load this book. Please refresh the page." />;

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

  function selectOption(next: Option) {
    if (!book.purchasable) return;
    if ((next === 'pdf' && pdfBlocked) || (next === 'hardbook' && (hardBlocked || !book.hardcopyAvailable))) return;
    setOption(next);
    setShowPayment(true);
    setFormError(null);
    window.setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
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

  async function copyUpiId() {
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
        setInvalid(new Set(parsed.error.issues.map((i) => String(i.path[0]))));
        setFormError(parsed.error.issues[0]?.message ?? 'Please fill all required fields');
        document.getElementById('hardbook-address')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      shippingAddress = parsed.data;
    }
    if (transactionId.trim().length < 6) return setFormError('Please enter your UPI Transaction ID.');
    if (!screenshot) return setFormError('Please upload a screenshot of your payment.');
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
      setFormError(err instanceof ApiError ? (err.fields ? (Object.values(err.fields)[0] ?? err.message) : err.message) : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name: keyof Address) => `form-control${invalid.has(name) ? ' is-invalid' : ''}`;

  return (
    <section className="section">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>
            <Link to="/books">Books</Link>
          </span>
          <span>{book.title}</span>
        </nav>

        {success && <SuccessAlert anchorRef={successRef} result={success} email={user?.email ?? ''} onClose={() => setSuccess(null)} />}

        <div className="row g-5">
          <div className="col-lg-4">
            <div className="sticky-aside">
              <div className="cover-frame mx-auto" style={{ maxWidth: 360 }}>
                <img src={book.cover} alt={book.title} />
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <BookInfo book={book} />

            {/* Purchase options */}
            <h2 className="h3 mt-5 mb-3">Choose your format</h2>
            {!book.purchasable && (
              <div className="alert alert-warning">
                <i className="fas fa-info-circle me-2"></i>This book will be available for purchase soon. Please contact us at{' '}
                <a href={`mailto:${settings?.contactEmail ?? 'sanyod@sanyod.in'}`}>{settings?.contactEmail ?? 'sanyod@sanyod.in'}</a>.
              </div>
            )}
            <div className="row g-3">
              <div className="col-md-6">
                <div
                  className={`option-card${option === 'pdf' && showPayment ? ' active' : ''}${pdfBlocked ? ' locked' : ''}`}
                  id="pdf-option"
                  onClick={() => selectOption('pdf')}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="icon-badge mb-0">
                      <i className="fas fa-file-pdf"></i>
                    </span>
                    <StatusBadge kind="pdf" purchase={purchase} />
                  </div>
                  <h3 className="h4 mb-1">PDF Version</h3>
                  <div className="price my-2">{rupees(pdfPrice)}</div>
                  <ul className="check-list small mb-3">
                    <li>Instant download after approval</li>
                    <li>Read on any device</li>
                    <li>Lifetime access</li>
                    <li>Searchable text</li>
                  </ul>
                  {purchase?.canRead ? (
                    <Link to={`/my-books/${book.slug}/read`} className="btn btn-success w-100" onClick={(e) => e.stopPropagation()}>
                      <i className="fas fa-book-open"></i> Read now
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`btn w-100 ${option === 'pdf' && showPayment ? 'btn-primary' : 'btn-outline-primary'}`}
                      disabled={pdfBlocked || !book.purchasable}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectOption('pdf');
                      }}
                    >
                      {purchase?.pdf === 'pending' ? (
                        <>
                          <i className="fas fa-clock"></i> Payment Pending Approval
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart"></i> Select PDF Version
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div
                  className={`option-card${option === 'hardbook' && showPayment ? ' active' : ''}${hardBlocked ? ' locked' : ''}`}
                  id="hardbook-option"
                  onClick={() => selectOption('hardbook')}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="icon-badge indigo mb-0">
                      <i className="fas fa-book"></i>
                    </span>
                    <StatusBadge kind="hardbook" purchase={purchase} />
                  </div>
                  <h3 className="h4 mb-1">Hard Book (Physical Copy)</h3>
                  <div className="price my-2">{rupees(hardPrice, false)}</div>
                  <ul className="check-list small mb-3">
                    <li>Printed paperback or hardcover</li>
                    <li>Free shipping across India</li>
                    <li>3-5 business days delivery</li>
                    <li>7-day return policy</li>
                  </ul>
                  <button
                    type="button"
                    className={`btn w-100 ${option === 'hardbook' && showPayment ? 'btn-primary' : 'btn-outline-primary'}`}
                    disabled={hardBlocked || !book.purchasable || !book.hardcopyAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectOption('hardbook');
                    }}
                  >
                    {!book.hardcopyAvailable ? (
                      <>
                        <i className="fas fa-ban"></i> Currently unavailable
                      </>
                    ) : purchase?.hardcopy === 'pending' ? (
                      <>
                        <i className="fas fa-clock"></i> Order Pending Approval
                      </>
                    ) : hardBlocked ? (
                      <>
                        <i className="fas fa-truck"></i> {ORDER_STATUS_LABEL[purchase?.hardcopyOrderStatus ?? 'processing']}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shopping-cart"></i> Select Hard Book
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <PendingNotice purchase={purchase} />

            {showPayment && price != null && pdfPrice != null && (
              <div ref={checkoutRef} className="mt-4" id="payment-section">
                {option === 'hardbook' && (
                  <div className="card-flat mb-4" id="hardbook-address">
                    <h3 className="h4 mb-1">
                      <i className="fas fa-shipping-fast text-saffron me-2"></i>Shipping address
                    </h3>
                    <p className="text-muted small">Where should we deliver your book?</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="fullName">
                          Full name *
                        </label>
                        <input type="text" className={field('fullName')} id="fullName" name="fullName" autoComplete="name" value={address.fullName} onChange={onAddress} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="phone">
                          Phone number *
                        </label>
                        <input type="tel" inputMode="numeric" className={field('phone')} id="phone" name="phone" autoComplete="tel" placeholder="10 digits" value={address.phone} onChange={onAddress} />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="address">
                          Full address *
                        </label>
                        <textarea className={field('address')} id="address" name="address" rows={2} autoComplete="street-address" placeholder="House no, street, area" value={address.address} onChange={onAddress} />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label" htmlFor="city">
                          City *
                        </label>
                        <input type="text" className={field('city')} id="city" name="city" autoComplete="address-level2" value={address.city} onChange={onAddress} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="state">
                          State *
                        </label>
                        <select className={`form-select${invalid.has('state') ? ' is-invalid' : ''}`} id="state" name="state" value={address.state} onChange={onAddress}>
                          <option value="">Select state</option>
                          {SHIPPING_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label" htmlFor="pincode">
                          Pincode *
                        </label>
                        <input type="text" inputMode="numeric" className={field('pincode')} id="pincode" name="pincode" autoComplete="postal-code" value={address.pincode} onChange={onAddress} />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="landmark">
                          Landmark <span className="text-muted fw-normal">(optional)</span>
                        </label>
                        <input type="text" className="form-control" id="landmark" name="landmark" placeholder="Nearby landmark for easy delivery" value={address.landmark ?? ''} onChange={onAddress} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="card-flat">
                  <div className="row g-4">
                    <div className="col-md-5">
                      <h3 className="h4">Order summary</h3>
                      {option === 'pdf' ? (
                        <>
                          <div className="summary-line">
                            <span>PDF Version</span>
                            <span>{rupees(pdfPrice, false)}</span>
                          </div>
                          <div className="summary-line">
                            <span>Digital delivery</span>
                            <span>FREE</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="summary-line">
                            <span>Hard Book</span>
                            <span>{rupees(pdfPrice, false)}</span>
                          </div>
                          <div className="summary-line">
                            <span>Shipping (free across India)</span>
                            <span>{rupees(price - pdfPrice, false)}</span>
                          </div>
                        </>
                      )}
                      <div className="summary-line">
                        <span>Platform fee</span>
                        <span>₹0</span>
                      </div>
                      <div className="summary-line total">
                        <span>Total</span>
                        <span>{rupees(price, false)}</span>
                      </div>
                      <div className="alert alert-warning small mt-3 mb-0">
                        <i className="fas fa-clock me-1"></i> Your order is reviewed within <strong>24 hours</strong> after payment. Confirmation goes to{' '}
                        <strong>{user?.email}</strong>.
                      </div>
                    </div>
                    <div className="col-md-7">
                      <h3 className="h4">Pay via UPI</h3>
                      <p className="text-muted small mb-3">
                        {option === 'pdf' ? 'Paying for PDF Version - Instant Digital Delivery' : 'Paying for Hard Book - Physical Delivery with Shipping'}
                      </p>
                      <div className="d-flex gap-3 flex-wrap align-items-center mb-3">
                        <div className="qr-box">
                          <img src={qr} alt={option === 'pdf' ? 'PDF payment QR code' : 'Hard book payment QR code'} />
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 200 }}>
                          <p className="small text-muted mb-2">Scan with any UPI app, or pay to:</p>
                          <div className="upi-row">
                            <code id="upi-id">{upiId}</code>
                            <button type="button" className={`btn btn-sm ${copied ? 'btn-success' : 'btn-light'}`} onClick={copyUpiId}>
                              {copied ? (
                                <>
                                  <i className="fas fa-check"></i> Copied!
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-copy"></i> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="mt-3 mb-0">
                            Amount: <strong className="price" style={{ fontSize: '1.3rem' }} id="payment-amount">{rupees(price, false)}</strong>
                          </p>
                        </div>
                      </div>

                      <form onSubmit={onSubmit} id="payment-form" noValidate>
                        {formError && (
                          <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-circle me-2"></i>
                            {formError}
                          </div>
                        )}
                        <div className="mb-3">
                          <label htmlFor="transaction_id" className="form-label">
                            UPI transaction ID *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="transaction_id"
                            name="transaction_id"
                            placeholder="e.g. TXN123456789"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                          />
                          <div className="form-text">You'll find it in your UPI app after paying.</div>
                        </div>
                        <div className="mb-3">
                          <label htmlFor="screenshot" className="form-label">
                            Payment screenshot *
                          </label>
                          <input
                            ref={fileRef}
                            type="file"
                            className="form-control"
                            id="screenshot"
                            name="screenshot"
                            accept="image/*"
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
                          <div className="form-text">A clear screenshot of the payment confirmation (max 5 MB).</div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm text-white" role="status"></span> Submitting…
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane"></i> Submit Payment &amp; Place Order
                            </>
                          )}
                        </button>
                        <p className="text-center text-muted small mt-2 mb-0">By placing the order you agree to our terms &amp; conditions.</p>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookInfo({ book }: { book: BookDetail }) {
  const full = Math.floor(book.rating ?? 0);
  const half = (book.rating ?? 0) - full >= 0.5;
  return (
    <div>
      <div className="eyebrow">Book</div>
      <h1 className="book-title deva mb-2">{book.title}</h1>
      <p className="lead mb-3">by {book.author}</p>
      <ul className="meta-list mb-3">
        {book.pages && (
          <li>
            <i className="fas fa-book-open"></i>
            {book.pages} pages
          </li>
        )}
        {book.publishedYear && (
          <li>
            <i className="fas fa-calendar-alt"></i>
            Published {book.publishedYear}
          </li>
        )}
        <li>
          <i className="fas fa-file-pdf"></i>PDF &amp; printed
        </li>
        {book.rating != null && (
          <li>
            <span className="text-warning">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < full ? 'fas fa-star' : i === full && half ? 'fas fa-star-half-alt' : 'far fa-star'} style={{ color: 'inherit', width: 'auto' }}></i>
              ))}
            </span>
            {book.rating}
            {book.reviewCount ? ` (${book.reviewCount.toLocaleString('en-US')} reviews)` : ''}
          </li>
        )}
      </ul>
      <div className="card-flat prose">
        <h2 className="h5 mb-3">About this book</h2>
        {nl2lines(book.description).map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ kind, purchase }: { kind: Option; purchase: BookPurchaseStatus | null }) {
  if (!purchase) return null;
  if (kind === 'pdf') {
    if (purchase.canRead) return <StatusChip status="approved" label="Purchased" />;
    if (purchase.pdf === 'pending') return <StatusChip status="pending" />;
    if (purchase.pdf === 'rejected') return <StatusChip status="rejected" label="Payment rejected" />;
    return null;
  }
  if (purchase.hardcopy === 'pending') return <StatusChip status="pending" />;
  if (purchase.hardcopy === 'approved') return <StatusChip status={purchase.hardcopyOrderStatus ?? 'processing'} label={ORDER_STATUS_LABEL[purchase.hardcopyOrderStatus ?? 'processing']} />;
  if (purchase.hardcopy === 'rejected') return <StatusChip status="rejected" label="Payment rejected" />;
  return null;
}

function PendingNotice({ purchase }: { purchase: BookPurchaseStatus | null }) {
  const pending = [purchase?.pdf === 'pending' && 'PDF Version', purchase?.hardcopy === 'pending' && 'Hard Book'].filter(Boolean);
  if (!pending.length) return null;
  return (
    <div className="card-flat mt-4">
      <h3 className="h5 mb-3">
        <i className="fas fa-hourglass-half text-saffron me-2"></i>Payment under review: {pending.join(' & ')}
      </h3>
      <div className="steps">
        {[
          ['fas fa-check', 'Payment details submitted', 'sage'],
          ['fas fa-search', 'Admin review, usually within 24 hours', 'gold'],
          ['fas fa-envelope', 'You receive an email once it is approved', 'muted'],
        ].map(([icon, text, tone]) => (
          <div className="step align-items-center" key={text}>
            <span className={`step-num`} style={tone === 'sage' ? { background: 'var(--sage-50)', color: 'var(--sage)', borderColor: '#cfe3d4' } : tone === 'muted' ? { background: 'var(--surface-2)', color: 'var(--faint)', borderColor: 'var(--line)' } : undefined}>
              <i className={icon}></i>
            </span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessAlert({
  anchorRef,
  result,
  email,
  onClose,
}: {
  anchorRef: Ref<HTMLDivElement>;
  result: { payment: PaymentSummary; emailSent: boolean };
  email: string;
  onClose: () => void;
}) {
  const { payment, emailSent } = result;
  const isPdf = payment.itemType === 'book_pdf';
  return (
    <div ref={anchorRef} className="alert alert-success alert-dismissible mb-4 p-4" role="alert">
      <div className="d-flex gap-3">
        <span className="icon-badge sage mb-0">
          <i className="fas fa-check"></i>
        </span>
        <div className="flex-grow-1">
          <h2 className="h4 mb-2">🎉 Order Successful!</h2>
          <p className="mb-1">
            Your order <strong>{payment.orderNumber}</strong> has been placed. Transaction ID: <strong>{payment.upiTransactionId}</strong> · Amount:{' '}
            <strong>{rupees(payment.amount, false)}</strong>
          </p>
          <p className="mb-3">
            {emailSent ? (
              <>
                <i className="fas fa-envelope me-1"></i> Confirmation email sent to <strong>{email}</strong>.
              </>
            ) : (
              <>
                <i className="fas fa-exclamation-triangle me-1"></i> Email notification failed, but your order was saved.
              </>
            )}{' '}
            {isPdf ? 'Your PDF will be available within 24 hours after approval.' : 'Your book ships 3-5 business days after approval.'}
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/my-orders" className="btn btn-success btn-sm">
              <i className="fas fa-receipt"></i> View my orders
            </Link>
            {isPdf && (
              <Link to="/my-books" className="btn btn-light btn-sm">
                <i className="fas fa-book"></i> My books
              </Link>
            )}
          </div>
        </div>
      </div>
      <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
    </div>
  );
}
