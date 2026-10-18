import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from 'bootstrap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { eventBookingSchema } from '@shared/schemas/purchases';
import type { EventCategory, EventSummary } from '@shared/types/catalog';
import { eventsApi, settingsApi } from '@/api/catalog';
import { FieldError } from '@/components/common/FieldError';
import { PageError } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import { applyApiError } from '@/utils/forms';
import { rupeesGrouped } from '@/utils/format';
import '@/styles/pages/programs.page.css';

const SECTIONS: { id: EventCategory; nav: string; icon: string; title: string; subtitle: string; col: string }[] = [
  {
    id: 'retreat',
    nav: 'RETREAT PROGRAM',
    icon: 'fas fa-mountain me-2',
    title: 'Retreat Programs',
    subtitle: 'Join our peaceful retreat programs and experience meditation, relaxation and spiritual growth.',
    col: 'col-lg-4 col-md-6 mb-4',
  },
  {
    id: 'seminar',
    nav: 'SEMINAR',
    icon: 'fas fa-chalkboard-teacher me-2',
    title: 'Seminars & Workshops',
    subtitle: 'Attend our educational seminars and interactive workshops.',
    col: 'col-lg-6 col-md-6 mb-4',
  },
  {
    id: 'online',
    nav: 'ONLINE CLASS',
    icon: 'fas fa-laptop me-2',
    title: 'Online Classes',
    subtitle: 'Learn meditation and mindfulness from anywhere through our online classes.',
    col: 'col-lg-6 col-md-6 mb-4',
  },
];

// Shown when an event has no image (or its file is missing).
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4B0082"/><stop offset="1" stop-color="#FF9933"/></linearGradient></defs><rect width="600" height="340" fill="url(#g)"/><text x="300" y="190" font-size="64" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="serif">ॐ</text></svg>',
  );

/** Events booking (programes.php). Login required, as on live. */
export default function ProgramsPage() {
  useBodyClass('page-programs');
  const [active, setActive] = useState<EventCategory>('retreat');
  const [booking, setBooking] = useState<EventSummary | null>(null);
  const { data: events, isLoading, error } = useQuery({ queryKey: ['events'], queryFn: eventsApi.list });
  const onClosed = useCallback(() => setBooking(null), []);

  return (
    <div className="container-fluid py-4">
      <div className="container">
        <div className="d-flex justify-content-center mb-5">
          <nav className="nav category-nav">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className={`nav-links${active === s.id ? ' active' : ''}`}
                data-category={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setActive(s.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(s.id)}
              >
                <i className={s.icon}></i>
                {s.nav}
              </a>
            ))}
          </nav>
        </div>

        {error && <PageError error={error} />}

        {SECTIONS.map((s) => {
          const list = (events ?? []).filter((e) => e.category === s.id);
          return (
            <div key={s.id} id={s.id} className={`content-section${active === s.id ? ' active' : ''}`}>
              <h2 className="section-title">{s.title}</h2>
              <p className="section-subtitle">{s.subtitle}</p>
              {isLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!isLoading && list.length === 0 && <p className="text-center text-muted">New programmes will be announced soon.</p>}
              <div className="row">
                {list.map((ev) => (
                  <div className={s.col} key={ev.id}>
                    {s.id === 'retreat' ? (
                      <div className="card-container">
                        <EventCard ev={ev} onBook={setBooking} />
                      </div>
                    ) : (
                      <EventCard ev={ev} onBook={setBooking} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <BookingModal event={booking} onClosed={onClosed} />
    </div>
  );
}

function EventCard({ ev, onBook }: { ev: EventSummary; onBook: (e: EventSummary) => void }) {
  const online = ev.category === 'online';
  return (
    <div className="card">
      <img
        src={ev.image ?? PLACEHOLDER}
        className="card-img-top"
        alt={ev.title}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER;
        }}
      />
      <div className="card-body">
        {ev.badge && <span className="badge">{ev.badge}</span>}
        {!online && ev.dateText && (
          <div className="event-date">
            <i className="far fa-calendar-alt me-1"></i>
            {ev.dateText}
          </div>
        )}
        <h5 className="card-title">{ev.title}</h5>
        <p className="card-text">{ev.description}</p>
        <div className="price-tag">{rupeesGrouped(ev.price)}</div>
        <div className="event-meta">
          {online ? (
            <>
              {ev.durationText && (
                <p>
                  <i className="far fa-calendar-check"></i> Duration: {ev.durationText}
                </p>
              )}
              <p>
                <i className="fas fa-map-marker-alt"></i> {ev.location || 'Online'}
              </p>
              <p>
                <i className="far fa-clock"></i> {ev.timeText === 'Flexible' ? 'Flexible Time' : ev.timeText}
              </p>
            </>
          ) : (
            <>
              {ev.timeText && (
                <p>
                  <i className="far fa-clock"></i> {ev.timeText}
                </p>
              )}
              {ev.location && (
                <p>
                  <i className="fas fa-map-marker-alt"></i> {ev.location}
                </p>
              )}
              {ev.durationText && (
                <p>
                  <i className="far fa-calendar-check"></i> Duration: {ev.durationText}
                </p>
              )}
            </>
          )}
        </div>
        <div className="event-stats">
          <span>
            <i className="fas fa-users me-1"></i>
            {ev.enrolledCount} enrolled
          </span>
          {ev.rating != null && (
            <span className="star-rating">
              {ev.rating} <i className="fas fa-star"></i>
            </span>
          )}
        </div>
        <button type="button" className="btn btn-booking w-100 mt-3 text-white" onClick={() => onBook(ev)}>
          {ev.ctaLabel}
        </button>
      </div>
    </div>
  );
}

const bookingForm = eventBookingSchema.omit({ eventSlug: true });
type BookingForm = z.infer<typeof bookingForm>;

function BookingModal({ event, onClosed }: { event: EventSummary | null; onClosed: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.public, staleTime: 10 * 60 * 1000 });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({ resolver: zodResolver(bookingForm) });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('hidden.bs.modal', onClosed);
    return () => el.removeEventListener('hidden.bs.modal', onClosed);
  }, [onClosed]);

  // Opening the modal for an event: fresh form, prefilled with the user's name and email.
  useEffect(() => {
    if (!event || !ref.current) return;
    setStatus(null);
    reset({ name: user?.name ?? '', email: user?.email ?? '', phone: '', upiTransactionId: '' });
    Modal.getOrCreateInstance(ref.current).show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  useEffect(() => () => Modal.getInstance(ref.current as HTMLElement)?.dispose(), []);

  const onSubmit = handleSubmit(async (values) => {
    if (!event) return;
    setStatus(null);
    try {
      const { message } = await eventsApi.book({ ...values, eventSlug: event.slug });
      setStatus({ type: 'success', text: `${message} We will confirm your booking after verifying the payment.` });
      reset({ name: values.name, email: values.email, phone: '', upiTransactionId: '' });
      void queryClient.invalidateQueries({ queryKey: ['event-bookings'] });
    } catch (err) {
      setStatus({ type: 'danger', text: applyApiError(err, setError) });
    }
  });

  return (
    <div className="modal fade" id="bookingModal" tabIndex={-1} aria-hidden="true" ref={ref}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Book Your Event</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="bookingForm" onSubmit={onSubmit} noValidate>
              {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
              <div className="mb-3">
                <label className="form-label">Event</label>
                <input type="text" className="form-control" id="event_name" readOnly value={event?.title ?? ''} />
              </div>
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input type="text" className="form-control" id="event_date" readOnly value={event?.dateText ?? ''} />
              </div>
              <div className="mb-3">
                <label className="form-label">Time</label>
                <input type="text" className="form-control" id="event_time" readOnly value={event?.timeText ?? ''} />
              </div>
              <div className="mb-3">
                <label className="form-label">Location</label>
                <input type="text" className="form-control" id="event_location" readOnly value={event?.location ?? ''} />
              </div>
              <div className="mb-3">
                <label className="form-label">Price</label>
                <input type="text" className="form-control" id="event_price" readOnly value={event ? `₹${(event.price / 100).toFixed(2)}` : ''} />
              </div>
              <div className="upi-section">
                <h5>
                  <i className="fas fa-qrcode me-2"></i>Pay Using UPI
                </h5>
                <img src={settings?.qrImageBooks ?? '/Books/QR.jpg'} alt="UPI QR" className="upi-qr" />
                <p className="mt-2">
                  <strong>UPI ID:</strong> {settings?.upiIdDefault ?? '6355034424@upi'}
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="transaction_id">Transaction ID (UTR)</label>
                <input type="text" className="form-control" id="transaction_id" placeholder="Enter your UPI transaction ID" {...register('upiTransactionId')} />
                <FieldError message={errors.upiTransactionId?.message} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user_name">Full Name</label>
                <input type="text" className="form-control" id="user_name" placeholder="Enter your full name" {...register('name')} />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user_email">Email Address</label>
                <input type="email" className="form-control" id="user_email" placeholder="Enter your email" {...register('email')} />
                <FieldError message={errors.email?.message} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user_phone">Phone Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="form-control"
                  id="user_phone"
                  placeholder="10-digit phone number"
                  {...register('phone', { onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)) })}
                />
                <FieldError message={errors.phone?.message} />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-booking" style={{ color: '#fff' }} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i>I Have Paid — Submit Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
