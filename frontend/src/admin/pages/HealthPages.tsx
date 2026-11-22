import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CONSULTATION_STATUSES, DOCTOR_CATEGORIES, PREFERRED_TIME_LABELS } from '@shared/constants';
import type { AdminConsultation, AdminDoctor } from '@shared/types/admin';
import type { ConsultationStatus, DoctorCategory } from '@shared/types/catalog';
import { DoctorPhoto } from '@/components/common/DoctorPhoto';
import { dateTime, longDate, rupees } from '@/utils/format';
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

const CATEGORY_LABEL: Record<DoctorCategory, string> = { physical: 'Physical Health', mental: 'Mental Health', chronical: 'Chronic Disease' };

export function DoctorsPage() {
  const [category, setCategory] = useState('');
  const list = useAdminList<AdminDoctor>('doctors', '/doctors', { category: category || undefined });
  const [editing, setEditing] = useState<AdminDoctor | 'new' | null>(null);
  const qc = useQueryClient();

  async function remove(d: AdminDoctor) {
    if (!(await confirmAction('Delete this doctor?', `Dr. ${d.name} will be removed permanently.`, 'Delete', true))) return;
    try {
      await adminApi.del(`/doctors/${d.id}`);
      toast('Doctor deleted');
      await qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title="Doctors" icon="fas fa-user-md">
        <button className="btn btn-admin" onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Doctor
        </button>
      </PageTitle>
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Name, qualification, disease…" />
          <FilterSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              list.setPage(1);
            }}
            options={DOCTOR_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
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
                  <th></th>
                  <th>Name</th>
                  <th>Categories</th>
                  <th>Qualification</th>
                  <th>Fee</th>
                  <th>CV</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((d) => (
                  <tr key={d.id}>
                    <td style={{ width: 60 }}>
                      <span className="d-block admin-thumb overflow-hidden">
                        <DoctorPhoto src={d.photo} alt="" />
                      </span>
                    </td>
                    <td>
                      <strong>Dr. {d.name}</strong>
                      <div className="small text-muted">{d.experienceYears != null ? `${d.experienceYears} yrs` : ''}{d.legacyIds.length ? ` · old ids ${d.legacyIds.join(', ')}` : ''}</div>
                    </td>
                    <td className="small">{d.categories.map((c) => CATEGORY_LABEL[c.category]).join(', ')}</td>
                    <td>{d.qualification}</td>
                    <td>{rupees(d.fee, false)}</td>
                    <td>{d.hasCv ? <i className="fas fa-check text-success"></i> : '—'}</td>
                    <td><StatusBadge status={d.isActive ? 'active' : 'inactive'} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-admin me-1" onClick={() => setEditing(d)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(d)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={8} text="No doctors yet." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {editing && <DoctorForm doctor={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/** Fields that show their error next to the input; any other error is listed above the form. */
const DOCTOR_INLINE = ['name', 'qualification', 'experienceYears', 'fee', 'categories', 'photo', 'cv', 'rating', 'availabilityText', 'sortOrder'];

function DoctorForm({ doctor, onClose }: { doctor: AdminDoctor | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    name: doctor?.name ?? '',
    slug: doctor?.slug ?? '',
    qualification: doctor?.qualification ?? '',
    experienceYears: doctor?.experienceYears != null ? String(doctor.experienceYears) : '',
    fee: rupeesInput(doctor?.fee),
    bio: doctor?.bio ?? '',
    rating: doctor?.rating != null ? String(doctor.rating) : '',
    isVerified: doctor?.isVerified ?? false,
    availabilityText: doctor?.availabilityText ?? '',
    isActive: doctor?.isActive ?? true,
    sortOrder: String(doctor?.sortOrder ?? 0),
  });
  const [cats, setCats] = useState<Partial<Record<DoctorCategory, string>>>(
    Object.fromEntries((doctor?.categories ?? []).map((c) => [c.category, c.specialisations])),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [removeCv, setRemoveCv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

  async function save() {
    setBusy(true);
    setErrors({});
    const categories = DOCTOR_CATEGORIES.filter((c) => cats[c] !== undefined).map((c) => ({ category: c, specialisations: cats[c] ?? '' }));
    try {
      const data = toFormData({ ...v, categories: JSON.stringify(categories), removeCv }, { photo, cv });
      if (doctor) await adminApi.form('patch', `/doctors/${doctor.id}`, data);
      else await adminApi.form('post', '/doctors', data);
      toast('Doctor saved');
      await qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      await qc.invalidateQueries({ queryKey: ['doctors'] });
      onClose();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast(errorMessage(e), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={doctor ? `Edit: Dr. ${doctor.name}` : 'Add Doctor'}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <FormErrors errors={errors} shown={DOCTOR_INLINE} labels={{ bio: 'About the doctor', slug: 'URL slug' }} />
      <div className="row g-3">
        <div className="col-md-5">
          <label className="form-label fw-semibold">Name * <span className="text-muted fw-normal small">(without "Dr.")</span></label>
          <input className="form-control" value={v.name} onChange={set('name')} />
          {err('name')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Qualification</label>
          <input className="form-control" value={v.qualification} onChange={set('qualification')} placeholder="BNYS, BHMS…" />
          {err('qualification')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Experience (yrs)</label>
          <input className="form-control" inputMode="numeric" value={v.experienceYears} onChange={set('experienceYears')} />
          {err('experienceYears')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Fee (₹) *</label>
          <input className="form-control" inputMode="decimal" value={v.fee} onChange={set('fee')} />
          {err('fee')}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">Categories and diseases treated *</label>
          {err('categories')}
          {DOCTOR_CATEGORIES.map((c) => (
            <div key={c} className="border rounded p-2 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`cat-${c}`}
                  checked={cats[c] !== undefined}
                  onChange={(e) =>
                    setCats((s) => {
                      const n = { ...s };
                      if (e.target.checked) n[c] = n[c] ?? '';
                      else delete n[c];
                      return n;
                    })
                  }
                />
                <label className="form-check-label fw-semibold" htmlFor={`cat-${c}`}>{CATEGORY_LABEL[c]}</label>
              </div>
              {cats[c] !== undefined && (
                <textarea
                  className="form-control mt-2"
                  rows={2}
                  placeholder="Diseases shown on the doctor's card in this category"
                  value={cats[c]}
                  onChange={(e) => setCats((s) => ({ ...s, [c]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">About the doctor</label>
          <textarea className="form-control" rows={4} value={v.bio} onChange={set('bio')} />
        </div>
        <div className="col-md-6">
          <ImageInput label="Photo" current={doctor?.photo} file={photo} onFile={setPhoto} />
          {err('photo')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">CV (PDF or Word) {doctor?.hasCv && <span className="text-success small">(uploaded)</span>}</label>
          <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
          {doctor?.hasCv && (
            <div className="form-check mt-1">
              <input className="form-check-input" type="checkbox" id="rmcv" checked={removeCv} onChange={(e) => setRemoveCv(e.target.checked)} />
              <label className="form-check-label small" htmlFor="rmcv">Remove the current CV</label>
            </div>
          )}
          {err('cv')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Rating</label>
          <input className="form-control" inputMode="decimal" value={v.rating} onChange={set('rating')} placeholder="4.7" />
          {err('rating')}
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Availability badge</label>
          <input className="form-control" value={v.availabilityText} onChange={set('availabilityText')} />
          {err('availabilityText')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Sort order</label>
          <input className="form-control" inputMode="numeric" value={v.sortOrder} onChange={set('sortOrder')} />
          {err('sortOrder')}
        </div>
        <div className="col-md-4 d-flex flex-column justify-content-end gap-1">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="ver" checked={v.isVerified} onChange={set('isVerified')} />
            <label className="form-check-label" htmlFor="ver">"Verified" badge</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="dact" checked={v.isActive} onChange={set('isActive')} />
            <label className="form-check-label" htmlFor="dact">Active (listed on Health page)</label>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export function ConsultationsPage() {
  const list = useAdminList<AdminConsultation>('consultations', '/consultations');
  const [open, setOpen] = useState<AdminConsultation | null>(null);

  return (
    <>
      <PageTitle title="Consultation Requests" icon="fas fa-stethoscope" />
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Patient, phone, issue…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={CONSULTATION_STATUSES} all="All statuses" />
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
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Issue</th>
                  <th>Preferred</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((c) => (
                  <tr key={c.id}>
                    <td className="small">{dateTime(c.createdAt)}</td>
                    <td>
                      {c.patientName}, {c.patientAge}
                      <div className="small text-muted">{c.patientPhone}</div>
                    </td>
                    <td>Dr. {c.doctorName}</td>
                    <td>{c.medicalIssue}</td>
                    <td className="small">
                      {longDate(c.appointmentDate)}
                      <div className="text-muted">{PREFERRED_TIME_LABELS[c.preferredTime]}</div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-admin" onClick={() => setOpen(c)}>Open</button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text="No consultation requests." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {open && <ConsultationModal c={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ConsultationModal({ c, onClose }: { c: AdminConsultation; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ConsultationStatus>(c.status);
  const [notes, setNotes] = useState(c.adminNotes ?? '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminApi.patch(`/consultations/${c.id}`, { status, adminNotes: notes, notify });
      toast('Consultation updated');
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={`Consultation with Dr. ${c.doctorName}`}
      onClose={onClose}
      footer={
        <>
          <a className="btn btn-outline-primary me-auto" href={`mailto:${c.patientEmail}`}>
            <i className="fas fa-envelope"></i> Email patient
          </a>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <table className="table table-sm admin-table">
        <tbody>
          <tr><th>Patient</th><td>{c.patientName} ({c.patientAge} yrs)</td></tr>
          <tr><th>Contact</th><td><a href={`tel:${c.patientPhone}`}>{c.patientPhone}</a> · <a href={`mailto:${c.patientEmail}`}>{c.patientEmail}</a></td></tr>
          <tr><th>Issue</th><td>{c.medicalIssue}</td></tr>
          <tr><th>Preferred</th><td>{longDate(c.appointmentDate)} · {PREFERRED_TIME_LABELS[c.preferredTime]}</td></tr>
          <tr><th>Symptoms</th><td style={{ whiteSpace: 'pre-wrap' }}>{c.symptoms}</td></tr>
          {c.additionalNotes && <tr><th>Notes</th><td style={{ whiteSpace: 'pre-wrap' }}>{c.additionalNotes}</td></tr>}
          <tr><th>Account</th><td>{c.user ? `${c.user.name} (${c.user.email})` : '—'}</td></tr>
        </tbody>
      </table>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as ConsultationStatus)}>
            {CONSULTATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label fw-semibold">Internal notes</label>
          <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="form-check mt-3">
        <input className="form-check-input" type="checkbox" id="cn" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        <label className="form-check-label" htmlFor="cn">Email the patient about the new status</label>
      </div>
    </AdminModal>
  );
}
