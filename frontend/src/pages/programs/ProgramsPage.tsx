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
import { EmptyState, PageHero, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { applyApiError } from '@/utils/forms';
import { rupeesGrouped } from '@/utils/format';

const SECTIONS: { id: EventCategory; nav: string; icon: string; title: string; subtitle: string; col: string }[] = [
  {
    id: 'retreat',
    nav: 'Retreat programs',
    icon: 'fas fa-mountain',
    title: 'Retreat programs',
    subtitle: 'Join our peaceful retreat programs and experience meditation, relaxation and spiritual growth.',
    col: 'col-md-6 col-lg-4',
  },
  {
    id: 'seminar',
    nav: 'Seminars',
    icon: 'fas fa-chalkboard-teacher',
    title: 'Seminars & workshops',
    subtitle: 'Attend our educational seminars and interactive workshops.',
    col: 'col-md-6',
  },
  {
    id: 'online',
    nav: 'Online classes',
    icon: 'fas fa-laptop',
    title: 'Online classes',
    subtitle: 'Learn meditation and mindfulness from anywhere through our online classes.',
    col: 'col-md-6',
  },
];

// Shown when an event has no image (or its file is missing).
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d3a8c"/><stop offset="1" stop-color="#d9822b"/></linearGradient></defs><rect width="600" height="340" fill="url(#g)"/><text x="300" y="190" font-size="64" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="serif">ॐ</text></svg>',
  );

/** Events booking (programes.php). Login required, as on live. */
export default function ProgramsPage() {
  const [active, setActive] = useState<EventCategory>('retreat');
  const [booking, setBooking] = useState<EventSummary | null>(null);
  const { data: events, isLoading, error } = useQuery({ queryKey: ['events'], queryFn: eventsApi.list });
  const onClosed = useCallback(() => setBooking(null), []);
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0]!;
  const list = (events ?? []).filter((e) => e.category === section.id);

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Programmes' }]}
        eyebrow="Programmes & events"
        title="Retreats, seminars and online classes"
        lead="Choose a programme, pay by UPI and submit your booking. We confirm every booking after verifying the payment."
      />
      <section className="section">
        <div className="container">
          <div className="segmented mb-4" role="tablist" aria-label="Programme categories">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active === s.id}
                data-category={s.id}
                className={active === s.id ? 'active' : ''}
                onClick={() => setActive(s.id)}
              >
                <i className={s.icon}></i> {s.nav}
              </button>
            ))}
          </div>

          {error && <PageError error={error} />}

          <div id={section.id} role="tabpanel">
            <h2 className="h3 mb-1">{section.title}</h2>
            <p className="text-muted mb-4">{section.subtitle}</p>
            {isLoading && <Spinner />}
            {!isLoading && !error && list.length === 0 && (
              <EmptyState icon="far fa-calendar-alt" title="Coming soon" text="New programmes will be announced soon." />
            )}
            <div className="row g-4">
              {list.map((ev) => (
                <div className={section.col} key={ev.id}>
                  <EventCard ev={ev} onBook={setBooking} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <BookingModal event={booking} onClosed={onClosed} />
    </>
  );
}

function EventCard({ ev, onBook }: { ev: EventSummary; onBook: (e: EventSummary) => void }) {
  const online = ev.category === 'online';
  const meta: { icon: string; text: string }[] = [];
  if (!online && ev.dateText) meta.push({ icon: 'far fa-calendar-alt', text: ev.dateText });
  if (online) {
    if (ev.durationText) meta.push({ icon: 'far fa-calendar-check', text: `Duration: ${ev.durationText}` });
    meta.push({ icon: 'fas fa-map-marker-alt', text: ev.location || 'Online' });
    if (ev.timeText) meta.push({ icon: 'far fa-clock', text: ev.timeText === 'Flexible' ? 'Flexible time' : ev.timeText });
  } else {
    if (ev.timeText) meta.push({ icon: 'far fa-clock', text: ev.timeText });
    if (ev.location) meta.push({ icon: 'fas fa-map-marker-alt', text: ev.location });
    if (ev.durationText) meta.push({ icon: 'far fa-calendar-check', text: `Duration: ${ev.durationText}` });
  }

  return (
    <article className="card-soft card-media hover reveal">
      <div className="media">
        {ev.badge && <span className="chip solid media-tag">{ev.badge}</span>}
        <img
          src={ev.image ?? PLACEHOLDER}
          alt={ev.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
      </div>
      <div className="body">
        <h3 className="h4">{ev.title}</h3>
        <p className="text-muted small">{ev.description}</p>
        <ul className="meta-list flex-column align-items-start gap-1 mb-3">
          {meta.map((m) => (
            <li key={m.text}>
              <i className={m.icon}></i> {m.text}
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-end gap-2 mb-3">
            <span className="price">{rupeesGrouped(ev.price)}</span>
            <span className="small text-muted">
              <i className="fas fa-users me-1"></i>
              {ev.enrolledCount} enrolled
              {ev.rating != null && (
                <>
                  {' · '}
                  {ev.rating} <i className="fas fa-star text-saffron"></i>
                </>
              )}
            </span>
          </div>
          <button type="button" className="btn btn-primary btn-booking w-100" onClick={() => onBook(ev)}>
            {ev.ctaLabel}
          </button>
        </div>
      </div>
    </article>
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

  const upiId = settings?.upiIdDefault ?? '6355034424@upi';

  return (
    <div className="modal fade" id="bookingModal" tabIndex={-1} aria-hidden="true" aria-labelledby="bookingModalTitle" ref={ref}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="bookingModalTitle">
              Book your event
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="bookingForm" onSubmit={onSubmit} noValidate>
              {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card-flat h-100" style={{ background: 'var(--surface-2)' }}>
                    <input type="hidden" id="event_name" value={event?.title ?? ''} readOnly />
                    <div className="small text-muted">Event</div>
                    <h3 className="h5 mb-3">{event?.title}</h3>
                    <div className="summary-line">
                      <span className="text-muted">Date</span>
                      <span id="event_date" className="text-end">{event?.dateText || '—'}</span>
                    </div>
                    <div className="summary-line">
                      <span className="text-muted">Time</span>
                      <span id="event_time" className="text-end">{event?.timeText || '—'}</span>
                    </div>
                    <div className="summary-line">
                      <span className="text-muted">Location</span>
                      <span id="event_location" className="text-end">{event?.location || '—'}</span>
                    </div>
                    <div className="summary-line total">
                      <span>Price</span>
                      <span id="event_price">{event ? `₹${(event.price / 100).toFixed(2)}` : ''}</span>
                    </div>
                    <div className="text-center mt-3">
                      <div className="qr-box">
                        <img src={settings?.qrImageBooks ?? '/Books/QR.jpg'} alt="UPI QR code" />
                      </div>
                      <div className="upi-row mt-3">
                        <span className="small text-muted">UPI ID</span>
                        <code>{upiId}</code>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 d-grid gap-3 align-content-start">
                  <div>
                    <label className="form-label" htmlFor="transaction_id">Transaction ID (UTR)</label>
                    <input type="text" className="form-control" id="transaction_id" placeholder="Enter your UPI transaction ID" {...register('upiTransactionId')} />
                    <FieldError message={errors.upiTransactionId?.message} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="user_name">Full name</label>
                    <input type="text" className="form-control" id="user_name" placeholder="Enter your full name" {...register('name')} />
                    <FieldError message={errors.name?.message} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="user_email">Email address</label>
                    <input type="email" className="form-control" id="user_email" placeholder="Enter your email" {...register('email')} />
                    <FieldError message={errors.email?.message} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="user_phone">Phone number</label>
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
                  <button type="submit" className="btn btn-primary btn-lg w-100 mt-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle"></i> I Have Paid — Submit Booking
                      </>
                    )}
                  </button>
                  <p className="small text-muted mb-0">Pay the amount by UPI first, then enter the transaction ID shown in your UPI app.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
