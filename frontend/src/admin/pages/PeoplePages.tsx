import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ADMIN_ROLES, MESSAGE_STATUSES } from '@shared/constants';
import type { Paginated } from '@shared/types/api';
import type {
  AdminAccount,
  AdminBook,
  AdminCourse,
  AdminMessage,
  AdminSettings,
  AdminSubscriber,
  AdminUser,
  AdminUserDetail,
  AuditEntry,
} from '@shared/types/admin';
import { dateTime, rupees } from '@/utils/format';
import { adminApi, toFormData } from '../api';
import { useAdminAuth } from '../AdminAuth';
import {
  AdminModal,
  confirmAction,
  EmptyRow,
  errorMessage,
  fieldErrors,
  FilterSelect,
  ImageInput,
  Loading,
  PageTitle,
  Pagination,
  SearchBox,
  StatusBadge,
  toast,
  useAdminList,
} from '../ui';

const TYPE = { book_pdf: 'Book (PDF)', book_hardcopy: 'Book (Hard copy)', course: 'Course' } as const;

// ---- Users --------------------------------------------------------------------------

export function UsersPage() {
  const list = useAdminList<AdminUser>('users', '/users');
  return (
    <>
      <PageTitle title="Users" icon="fas fa-users" />
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Name or email…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={['active', 'inactive']} all="All users" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Last login</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td className="small">{dateTime(u.createdAt)}</td>
                    <td className="small">{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</td>
                    <td>{u.payments}</td>
                    <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="text-end">
                      <Link to={`/admin/users/${u.id}`} className="btn btn-sm btn-admin">Open</Link>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text="No users found." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
    </>
  );
}

export function UserDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data: u, isLoading } = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => adminApi.get<AdminUserDetail>(`/users/${id}`) });
  const [granting, setGranting] = useState(false);
  if (isLoading || !u) return <Loading />;

  async function toggleActive() {
    if (!u) return;
    const ok = await confirmAction(
      u.isActive ? 'Deactivate this account?' : 'Activate this account?',
      u.isActive ? 'The user is logged out of purchases and cannot log in.' : 'The user can log in again.',
      u.isActive ? 'Deactivate' : 'Activate',
      u.isActive,
    );
    if (!ok) return;
    try {
      await adminApi.patch(`/users/${u.id}`, { isActive: !u.isActive });
      toast('Account updated');
      await qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function revoke(grantId: string, title: string) {
    if (!(await confirmAction('Remove access?', `The user will no longer be able to open "${title}".`, 'Remove', true))) return;
    try {
      await adminApi.del(`/entitlements/${grantId}`);
      toast('Access removed');
      await qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title={u.name} icon="fas fa-user">
        <Link to="/admin/users" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left"></i> Users
        </Link>
        <button className={`btn ${u.isActive ? 'btn-outline-danger' : 'btn-success'}`} onClick={toggleActive}>
          {u.isActive ? 'Deactivate account' : 'Activate account'}
        </button>
      </PageTitle>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="admin-panel">
            <h5>Account</h5>
            <table className="table table-sm admin-table mb-0">
              <tbody>
                <tr><th>Email</th><td><a href={`mailto:${u.email}`}>{u.email}</a></td></tr>
                <tr><th>Status</th><td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td></tr>
                <tr><th>Registered</th><td>{dateTime(u.createdAt)}</td></tr>
                <tr><th>Last login</th><td>{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</td></tr>
                <tr><th>Consultations</th><td>{u.consultations}</td></tr>
                <tr><th>Event bookings</th><td>{u.bookings}</td></tr>
                {u.legacyId && <tr><th>Old site id</th><td>{u.legacyId}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="admin-panel">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Access</h5>
              <button className="btn btn-sm btn-admin" onClick={() => setGranting(true)}>
                <i className="fas fa-plus"></i> Grant
              </button>
            </div>
            <ul className="list-group list-group-flush">
              {u.entitlements.map((g) => (
                <li key={g.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>
                    {g.itemTitle}
                    <div className="small text-muted">{g.itemType === 'course' ? 'Course' : 'Book PDF'} · {dateTime(g.grantedAt)}</div>
                  </span>
                  <button className="btn btn-sm btn-outline-danger" title="Remove access" onClick={() => revoke(g.id, g.itemTitle)}>
                    <i className="fas fa-times"></i>
                  </button>
                </li>
              ))}
              {u.entitlements.length === 0 && <li className="list-group-item px-0 text-muted">No books or courses yet.</li>}
            </ul>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="admin-panel">
            <h5>Orders and payments</h5>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {u.purchases.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/admin/payments?open=${p.id}`}>{p.orderNumber}</Link>
                        <div className="small text-muted">{dateTime(p.createdAt)}</div>
                      </td>
                      <td>
                        {p.itemTitle}
                        <div className="small text-muted">{TYPE[p.itemType]}</div>
                      </td>
                      <td>{rupees(p.amount, false)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                  {u.purchases.length === 0 && <EmptyRow cols={4} text="No orders." />}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {granting && <GrantModal userId={u.id} onClose={() => setGranting(false)} />}
    </>
  );
}

function GrantModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [itemType, setItemType] = useState<'course' | 'book_pdf'>('course');
  const [itemId, setItemId] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: courses } = useQuery({ queryKey: ['admin', 'courses', 'all'], queryFn: () => adminApi.list<AdminCourse>('/courses', { pageSize: 200 }) });
  const { data: books } = useQuery({ queryKey: ['admin', 'books', 'all'], queryFn: () => adminApi.list<AdminBook>('/books', { pageSize: 200 }) });
  const options = itemType === 'course' ? (courses as Paginated<AdminCourse> | undefined)?.data : (books as Paginated<AdminBook> | undefined)?.data;

  async function grant() {
    if (!itemId) return;
    setBusy(true);
    try {
      await adminApi.post('/entitlements', { userId, itemType, itemId });
      toast('Access granted');
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title="Grant access"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy || !itemId} onClick={grant}>Grant</button>
        </>
      }
    >
      <p className="small text-muted">For a payment received outside the website, or a gift. It is recorded as a ₹0 approved order.</p>
      <label className="form-label fw-semibold">Type</label>
      <select className="form-select mb-3" value={itemType} onChange={(e) => { setItemType(e.target.value as 'course' | 'book_pdf'); setItemId(''); }}>
        <option value="course">Course</option>
        <option value="book_pdf">Book PDF</option>
      </select>
      <label className="form-label fw-semibold">Item</label>
      <select className="form-select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
        <option value="">Choose…</option>
        {options?.map((o) => (
          <option key={o.id} value={o.id}>{o.title}</option>
        ))}
      </select>
    </AdminModal>
  );
}

// ---- Messages -------------------------------------------------------------------------

export function MessagesPage() {
  const [kind, setKind] = useState<'contact' | 'guidance'>('contact');
  const list = useAdminList<AdminMessage>(`messages-${kind}`, '/messages', { kind });
  const [open, setOpen] = useState<AdminMessage | null>(null);
  const qc = useQueryClient();

  async function mark(m: AdminMessage, status: AdminMessage['status']) {
    try {
      await adminApi.patch(`/messages/${m.kind}/${m.id}`, { status });
      await qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  function view(m: AdminMessage) {
    setOpen(m);
    if (m.status === 'new') void mark(m, 'read');
  }

  return (
    <>
      <PageTitle title="Messages" icon="fas fa-envelope" />
      <div className="admin-panel">
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link${kind === 'contact' ? ' active' : ''}`} onClick={() => setKind('contact')}>Contact form</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link${kind === 'guidance' ? ' active' : ''}`} onClick={() => setKind('guidance')}>Free consultation requests</button>
          </li>
        </ul>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Name, email, text…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={MESSAGE_STATUSES} all="All" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((m) => (
                  <tr key={m.id} className={m.status === 'new' ? 'fw-semibold' : ''}>
                    <td className="small">{dateTime(m.createdAt)}</td>
                    <td>
                      {m.name}
                      <div className="small text-muted">{m.email}</div>
                    </td>
                    <td>{m.subject}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-admin" onClick={() => view(m)}>Read</button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={5} text="No messages." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {open && (
        <AdminModal
          title={open.subject}
          onClose={() => setOpen(null)}
          footer={
            <>
              <a
                className="btn btn-admin me-auto"
                href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                onClick={() => void mark(open, 'replied')}
              >
                <i className="fas fa-reply"></i> Reply by email
              </a>
              <button className="btn btn-outline-secondary" onClick={() => { void mark(open, 'new'); setOpen(null); }}>Mark unread</button>
              <button className="btn btn-secondary" onClick={() => setOpen(null)}>Close</button>
            </>
          }
        >
          <p className="mb-1"><strong>{open.name}</strong> &lt;{open.email}&gt;</p>
          <p className="small text-muted">{dateTime(open.createdAt)}</p>
          {Object.entries(open.details).map(([k, val]) => (
            <p key={k} className="mb-1"><strong>{k}:</strong> {val}</p>
          ))}
          <div className="border rounded p-3 mt-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>{open.body || <em className="text-muted">(no message)</em>}</div>
        </AdminModal>
      )}
    </>
  );
}

// ---- Newsletter -----------------------------------------------------------------------------

export function NewsletterPage() {
  const list = useAdminList<AdminSubscriber>('subscribers', '/newsletter-subscribers');
  const qc = useQueryClient();
  async function toggle(s: AdminSubscriber) {
    try {
      await adminApi.patch(`/newsletter-subscribers/${s.id}`, { isActive: !s.isActive });
      await qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }
  return (
    <>
      <PageTitle title="Newsletter Subscribers" icon="fas fa-paper-plane">
        <a className="btn btn-admin" href={adminApi.fileUrl('/newsletter-subscribers?format=csv')}>
          <i className="fas fa-file-csv"></i> Export CSV
        </a>
      </PageTitle>
      <div className="admin-panel">
        <div className="mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Email…" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <table className="table table-hover admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td className="small">{dateTime(s.subscribedAt)}</td>
                  <td><StatusBadge status={s.isActive ? 'active' : 'inactive'} /></td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggle(s)}>
                      {s.isActive ? 'Unsubscribe' : 'Resubscribe'}
                    </button>
                  </td>
                </tr>
              ))}
              {list.data?.data.length === 0 && <EmptyRow cols={4} text="No subscribers yet." />}
            </tbody>
          </table>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
    </>
  );
}

// ---- Settings ---------------------------------------------------------------------------------

export function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => adminApi.get<AdminSettings>('/settings') });
  const [v, setV] = useState<AdminSettings | null>(null);
  const [qrBooks, setQrBooks] = useState<File | null>(null);
  const [qrCourses, setQrCourses] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setV(data);
  }, [data]);
  if (!v) return <Loading />;
  const set = (k: 'upiIdDefault' | 'upiIdPdf' | 'upiIdHardcopy' | 'contactEmail' | 'contactPhone' | 'location' | 'adminNotifyEmail') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => (s ? { ...s, [k]: e.target.value } : s));
  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

  async function save() {
    if (!v) return;
    setBusy(true);
    setErrors({});
    try {
      const { qrImageBooks: _b, qrImageCourses: _c, socialLinks, workingHours, ...fields } = v;
      await adminApi.form(
        'put',
        '/settings',
        toFormData({
          ...fields,
          workingHours: JSON.stringify(workingHours),
          facebookUrl: socialLinks.facebook,
          twitterUrl: socialLinks.twitter,
          instagramUrl: socialLinks.instagram,
          linkedinUrl: socialLinks.linkedin,
        }, { qrImageBooks: qrBooks, qrImageCourses: qrCourses }),
      );
      toast('Settings saved');
      setQrBooks(null);
      setQrCourses(null);
      await qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      await qc.invalidateQueries({ queryKey: ['settings'] });
    } catch (e) {
      setErrors(fieldErrors(e));
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Settings" icon="fas fa-cog" />
      <div className="admin-panel">
        <h5>Payments (UPI)</h5>
        <p className="small text-muted">Only UPI payments with a transaction ID and proof are currently supported. Leave an ID or QR image empty to disable that payment route.</p>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">UPI ID for courses and events</label>
            <input className="form-control" value={v.upiIdDefault} onChange={set('upiIdDefault')} />
            {err('upiIdDefault')}
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">UPI ID shown for book PDFs</label>
            <input className="form-control" value={v.upiIdPdf} onChange={set('upiIdPdf')} />
            {err('upiIdPdf')}
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">UPI ID shown for hard copies</label>
            <input className="form-control" value={v.upiIdHardcopy} onChange={set('upiIdHardcopy')} />
            {err('upiIdHardcopy')}
          </div>
          <div className="col-md-6">
            <ImageInput label="QR code: books and events" current={v.qrImageBooks} file={qrBooks} onFile={setQrBooks} />
          </div>
          <div className="col-md-6">
            <ImageInput label="QR code: course payments" current={v.qrImageCourses} file={qrCourses} onFile={setQrCourses} />
          </div>
        </div>
      </div>
      <div className="admin-panel">
        <h5>Contact details and opening hours</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Contact email</label>
            <input className="form-control" value={v.contactEmail} onChange={set('contactEmail')} />
            {err('contactEmail')}
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Contact phone</label>
            <input className="form-control" value={v.contactPhone} onChange={set('contactPhone')} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Location</label>
            <input className="form-control" value={v.location} onChange={set('location')} />
          </div>
        </div>
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Opening hours</h6>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setV({ ...v, workingHours: [...v.workingHours, { label: '', value: '' }] })}>Add row</button>
          </div>
          {v.workingHours.map((hour, index) => (
            <div className="row g-2 mb-2" key={index}>
              <div className="col-md-4"><input className="form-control" aria-label="Opening hours label" placeholder="Day or label" value={hour.label} onChange={(e) => setV({ ...v, workingHours: v.workingHours.map((item, i) => i === index ? { ...item, label: e.target.value } : item) })} /></div>
              <div className="col-md-6"><input className="form-control" aria-label="Opening hours" placeholder="Hours or closed" value={hour.value} onChange={(e) => setV({ ...v, workingHours: v.workingHours.map((item, i) => i === index ? { ...item, value: e.target.value } : item) })} /></div>
              <div className="col-md-2"><button type="button" className="btn btn-outline-danger w-100" onClick={() => setV({ ...v, workingHours: v.workingHours.filter((_, i) => i !== index) })}>Remove</button></div>
            </div>
          ))}
        </div>
      </div>
      <div className="admin-panel">
        <h5>Social profiles</h5>
        <div className="row g-3">
          {(['facebook', 'twitter', 'instagram', 'linkedin'] as const).map((network) => (
            <div className="col-md-6" key={network}>
              <label className="form-label fw-semibold">{network.charAt(0).toUpperCase() + network.slice(1)} URL</label>
              <input className="form-control" type="url" value={v.socialLinks[network]} onChange={(e) => setV({ ...v, socialLinks: { ...v.socialLinks, [network]: e.target.value } })} />
            </div>
          ))}
        </div>
      </div>
      <div className="admin-panel">
        <h5>Notifications</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Send new-order alerts to</label>
            <input className="form-control" value={v.adminNotifyEmail} onChange={set('adminNotifyEmail')} placeholder="default from server config" />
            {err('adminNotifyEmail')}
          </div>
        </div>
      </div>
      <button className="btn btn-admin px-4" disabled={busy} onClick={save}>
        {busy ? <span className="spinner-border spinner-border-sm"></span> : 'Save settings'}
      </button>
    </>
  );
}

// ---- Admin accounts (super admin) -------------------------------------------------------------------

export function AdminsPage() {
  const qc = useQueryClient();
  const { admin: me } = useAdminAuth();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'admins'], queryFn: () => adminApi.get<AdminAccount[]>('/admins') });
  const [editing, setEditing] = useState<AdminAccount | 'new' | null>(null);
  if (me?.role !== 'superadmin') return <div className="alert alert-warning">Only a super admin can manage admin accounts.</div>;

  return (
    <>
      <PageTitle title="Admin Accounts" icon="fas fa-user-shield">
        <button className="btn btn-admin" onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Admin
        </button>
      </PageTitle>
      <div className="admin-panel">
        {isLoading ? (
          <Loading />
        ) : (
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Last login</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((a) => (
                <tr key={a.id}>
                  <td>{a.username}{a.id === me.id && <span className="badge bg-info ms-1">you</span>}</td>
                  <td>{a.name}<div className="small text-muted">{a.email}</div></td>
                  <td>{a.role}</td>
                  <td className="small">{a.lastLoginAt ? dateTime(a.lastLoginAt) : '—'}</td>
                  <td><StatusBadge status={a.isActive ? 'active' : 'inactive'} /></td>
                  <td className="text-end"><button className="btn btn-sm btn-admin" onClick={() => setEditing(a)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && (
        <AdminForm
          account={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['admin', 'admins'] })}
        />
      )}
    </>
  );
}

function AdminForm({ account, onClose, onSaved }: { account: AdminAccount | null; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    username: account?.username ?? '',
    name: account?.name ?? '',
    email: account?.email ?? '',
    role: account?.role ?? 'admin',
    isActive: account?.isActive ?? true,
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setErrors({});
    try {
      if (account) await adminApi.patch(`/admins/${account.id}`, { name: v.name, email: v.email, role: v.role, isActive: v.isActive, password: v.password || undefined });
      else await adminApi.post('/admins', { username: v.username, name: v.name, email: v.email, role: v.role, password: v.password });
      toast('Admin saved');
      onSaved();
      onClose();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast(errorMessage(e), 'error');
      setBusy(false);
    }
  }
  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;
  return (
    <AdminModal
      title={account ? `Edit ${account.username}` : 'Add Admin'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Username</label>
          <input className="form-control" value={v.username} disabled={Boolean(account)} onChange={(e) => setV({ ...v, username: e.target.value })} />
          {err('username')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Role</label>
          <select className="form-select" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as AdminAccount['role'] })}>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Name</label>
          <input className="form-control" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Email</label>
          <input className="form-control" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          {err('email')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">{account ? 'New password (leave empty to keep)' : 'Password'}</label>
          <input type="password" className="form-control" autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
          {err('password')}
        </div>
        {account && (
          <div className="col-md-6 d-flex align-items-end">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="aact" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />
              <label className="form-check-label" htmlFor="aact">Active</label>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// ---- Activity log ---------------------------------------------------------------------------------------

export function ActivityPage() {
  const list = useAdminList<AuditEntry>('audit', '/audit-log', {}, 50);
  return (
    <>
      <PageTitle title="Activity Log" icon="fas fa-history" />
      <div className="admin-panel">
        <div className="mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Action, admin…" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <table className="table admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((a) => (
                <tr key={a.id}>
                  <td className="small">{dateTime(a.createdAt)}</td>
                  <td>{a.adminUsername}</td>
                  <td><code>{a.action}</code></td>
                  <td className="small text-muted">{a.entity} {a.entityId}</td>
                </tr>
              ))}
              {list.data?.data.length === 0 && <EmptyRow cols={4} text="No activity yet." />}
            </tbody>
          </table>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
    </>
  );
}

// ---- Own password --------------------------------------------------------------------------------------------

export function AccountPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setErrors({ confirm: 'Passwords do not match' });
    setBusy(true);
    setErrors({});
    try {
      await adminApi.post('/account/password', { currentPassword: current, newPassword: next });
      toast('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="My Password" icon="fas fa-key" />
      <form className="admin-panel" style={{ maxWidth: 480 }} onSubmit={save}>
        <label className="form-label fw-semibold">Current password</label>
        <input type="password" className="form-control mb-1" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
        <label className="form-label fw-semibold mt-2">New password</label>
        <input type="password" className="form-control mb-1" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
        <label className="form-label fw-semibold mt-2">Confirm new password</label>
        <input type="password" className="form-control mb-1" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {errors.confirm && <div className="invalid-feedback d-block">{errors.confirm}</div>}
        <button className="btn btn-admin mt-3" disabled={busy}>Change password</button>
      </form>
    </>
  );
}
