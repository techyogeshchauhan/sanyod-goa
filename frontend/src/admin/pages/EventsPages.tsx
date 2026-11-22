import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BOOKING_STATUSES, EVENT_CATEGORIES } from '@shared/constants';
import type { Paginated } from '@shared/types/api';
import type { AdminBooking, AdminEvent } from '@shared/types/admin';
import type { BookingStatus } from '@shared/types/catalog';
import { dateTime, rupees } from '@/utils/format';
import { adminApi, toFormData } from '../api';
import {
  AdminModal,
  confirmAction,
  EmptyRow,
  errorMessage,
  fieldErrors,
  FilterSelect,
  FormErrors,
  ImageInput,
  Loading,
  PageTitle,
  Pagination,
  QueryError,
  rupeesInput,
  SearchBox,
  StatusBadge,
  toast,
  useAdminList,
} from '../ui';

const CATEGORY = { retreat: 'Retreat Program', seminar: 'Seminar & Workshop', online: 'Online Class' } as const;

export function EventsPage() {
  const [category, setCategory] = useState('');
  const list = useAdminList<AdminEvent>('events', '/events', { category: category || undefined });
  const [editing, setEditing] = useState<AdminEvent | 'new' | null>(null);
  const qc = useQueryClient();

  async function remove(e: AdminEvent) {
    if (!(await confirmAction('Delete this programme?', `"${e.title}" will be removed permanently.`, 'Delete', true))) return;
    try {
      await adminApi.del(`/events/${e.id}`);
      toast('Programme deleted');
      await qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title="Programmes (Events)" icon="fas fa-calendar-alt">
        <button className="btn btn-admin" onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Programme
        </button>
      </PageTitle>
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Title or location…" />
          <FilterSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              list.setPage(1);
            }}
            options={EVENT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c] }))}
            all="All categories"
          />
        </div>
        {list.isError && <QueryError error={list.error} onRetry={() => void list.refetch()} />}
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date / Time</th>
                  <th>Price</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.title}</strong>
                      <div className="small text-muted">{e.location}</div>
                    </td>
                    <td>{CATEGORY[e.category]}</td>
                    <td className="small">
                      {e.dateText}
                      <div className="text-muted">{e.timeText}</div>
                    </td>
                    <td>{rupees(e.price, false)}</td>
                    <td>{e.bookings}</td>
                    <td><StatusBadge status={e.isPublished ? 'published' : 'draft'} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-admin me-1" onClick={() => setEditing(e)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(e)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text="No programmes yet." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {editing && <EventForm event={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/** Fields that show their error next to the input; any other error is listed above the form. */
const EVENT_INLINE = ['title', 'badge', 'startDate', 'dateText', 'timeText', 'durationText', 'location', 'price', 'capacity', 'image', 'enrolledCount', 'rating', 'sortOrder'];

function EventForm({ event, onClose }: { event: AdminEvent | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    title: event?.title ?? '',
    slug: event?.slug ?? '',
    category: event?.category ?? 'retreat',
    description: event?.description ?? '',
    badge: event?.badge ?? '',
    startDate: event?.startDate ? event.startDate.slice(0, 10) : '',
    dateText: event?.dateText ?? '',
    timeText: event?.timeText ?? '',
    durationText: event?.durationText ?? '',
    location: event?.location ?? '',
    price: rupeesInput(event?.price),
    capacity: event?.capacity != null ? String(event.capacity) : '',
    enrolledCount: String(event?.enrolledCount ?? 0),
    rating: event?.rating != null ? String(event.rating) : '',
    ctaLabel: event?.ctaLabel ?? 'Book Now',
    isPublished: event?.isPublished ?? true,
    sortOrder: String(event?.sortOrder ?? 0),
  });
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const data = toFormData(v, { image });
      if (event) await adminApi.form('patch', `/events/${event.id}`, data);
      else await adminApi.form('post', '/events', data);
      toast('Programme saved');
      await qc.invalidateQueries({ queryKey: ['admin', 'events'] });
      await qc.invalidateQueries({ queryKey: ['events'] });
      onClose();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast(errorMessage(e), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={event ? `Edit: ${event.title}` : 'Add Programme'}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <FormErrors errors={errors} shown={EVENT_INLINE} labels={{ description: 'Description', ctaLabel: 'Button', category: 'Category' }} />
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Title *</label>
          <input className="form-control" value={v.title} onChange={set('title')} />
          {err('title')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Category *</label>
          <select className="form-select" value={v.category} onChange={set('category')}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY[c]}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Badge</label>
          <input className="form-control" value={v.badge} onChange={set('badge')} placeholder="Featured, Popular, New…" />
          {err('badge')}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">Short description</label>
          <textarea className="form-control" rows={2} value={v.description} onChange={set('description')} />
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Start date</label>
          <input type="date" className="form-control" value={v.startDate} onChange={set('startDate')} />
          {err('startDate')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Date text (shown)</label>
          <input className="form-control" value={v.dateText} onChange={set('dateText')} placeholder="October 15, 2026 / Online - Anytime" />
          {err('dateText')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Time text</label>
          <input className="form-control" value={v.timeText} onChange={set('timeText')} placeholder="9:00 AM - 5:00 PM / Flexible" />
          {err('timeText')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Duration</label>
          <input className="form-control" value={v.durationText} onChange={set('durationText')} placeholder="3 Days" />
          {err('durationText')}
        </div>
        <div className="col-md-5">
          <label className="form-label fw-semibold">Location</label>
          <input className="form-control" value={v.location} onChange={set('location')} />
          {err('location')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Price (₹) *</label>
          <input className="form-control" inputMode="decimal" value={v.price} onChange={set('price')} />
          {err('price')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Capacity</label>
          <input className="form-control" inputMode="numeric" value={v.capacity} onChange={set('capacity')} />
          {err('capacity')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Button</label>
          <select className="form-select" value={v.ctaLabel} onChange={set('ctaLabel')}>
            <option>Book Now</option>
            <option>Enroll Now</option>
          </select>
        </div>
        <div className="col-md-6">
          <ImageInput label="Image" current={event?.image} file={image} onFile={setImage} />
          {err('image')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Enrolled</label>
          <input className="form-control" inputMode="numeric" value={v.enrolledCount} onChange={set('enrolledCount')} />
          {err('enrolledCount')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Rating</label>
          <input className="form-control" inputMode="decimal" value={v.rating} onChange={set('rating')} />
          {err('rating')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Sort</label>
          <input className="form-control" inputMode="numeric" value={v.sortOrder} onChange={set('sortOrder')} />
          {err('sortOrder')}
        </div>
        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="epub" checked={v.isPublished} onChange={set('isPublished')} />
            <label className="form-check-label" htmlFor="epub">Published (shown on the Programmes page)</label>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export function BookingsPage() {
  const [eventId, setEventId] = useState('');
  const list = useAdminList<AdminBooking>('bookings', '/event-bookings', { eventId: eventId || undefined });
  const { data: events } = useQuery({
    queryKey: ['admin', 'events', 'all'],
    queryFn: () => adminApi.list<AdminEvent>('/events', { pageSize: 200 }),
  });
  const qc = useQueryClient();

  async function setStatus(b: AdminBooking, status: BookingStatus) {
    const verb = status === 'confirmed' ? 'Confirm' : status === 'cancelled' ? 'Cancel' : 'Reset';
    if (!(await confirmAction(`${verb} this booking?`, `${b.name} · ${b.eventTitle}. The guest is emailed.`, verb, status === 'cancelled'))) return;
    try {
      await adminApi.patch(`/event-bookings/${b.id}`, { status });
      toast('Booking updated');
      await qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title="Event Bookings" icon="fas fa-ticket-alt" />
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Name, email, phone, UTR…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={BOOKING_STATUSES} all="All statuses" />
          <FilterSelect
            value={eventId}
            onChange={(v) => {
              setEventId(v);
              list.setPage(1);
            }}
            options={((events as Paginated<AdminEvent> | undefined)?.data ?? []).map((e) => ({ value: e.id, label: e.title }))}
            all="All programmes"
          />
        </div>
        {list.isError && <QueryError error={list.error} onRetry={() => void list.refetch()} />}
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Guest</th>
                  <th>Programme</th>
                  <th>Amount</th>
                  <th>Transaction (UTR)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((b) => (
                  <tr key={b.id}>
                    <td className="small">{dateTime(b.createdAt)}</td>
                    <td>
                      {b.name}
                      <div className="small text-muted">
                        {b.phone} · {b.email}
                      </div>
                    </td>
                    <td>{b.eventTitle}</td>
                    <td>{rupees(b.amount, false)}</td>
                    <td><code>{b.upiTransactionId}</code></td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-end text-nowrap">
                      {b.status !== 'confirmed' && (
                        <button className="btn btn-sm btn-success me-1" onClick={() => setStatus(b, 'confirmed')}>Confirm</button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(b, 'cancelled')}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text="No bookings." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
    </>
  );
}
