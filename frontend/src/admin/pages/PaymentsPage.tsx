import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ITEM_TYPES, PAYMENT_STATUSES } from '@shared/constants';
import type { AdminPayment } from '@shared/types/admin';
import { dateTime, rupees } from '@/utils/format';
import { adminApi } from '../api';
import { EmptyRow, errorMessage, FilterSelect, Loading, PageTitle, Pagination, SearchBox, StatusBadge, toast, useAdminList } from '../ui';

const TYPE = { book_pdf: 'Book (PDF)', book_hardcopy: 'Book (Hard copy)', course: 'Course' } as const;
const METHOD = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet' } as const;

/** Payment review queue: check the screenshot, then approve (unlocks access) or reject. */
export default function PaymentsPage() {
  const [itemType, setItemType] = useState('');
  const list = useAdminList<AdminPayment>('payments', '/payments', { itemType: itemType || undefined });
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<AdminPayment | null>(null);
  const { setStatus } = list;

  // Default to the pending queue; ?open=<id> (from the dashboard) opens a payment.
  useEffect(() => {
    if (!params.get('open')) setStatus('pending');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = params.get('open');
    if (!id) return;
    adminApi
      .get<AdminPayment>(`/payments/${id}`)
      .then(setOpen)
      .catch(() => undefined)
      .finally(() => setParams({}, { replace: true }));
  }, [params, setParams]);

  return (
    <>
      <PageTitle title="Payments" icon="fas fa-money-check-alt" />
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Order, transaction ID, name, email, title…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={PAYMENT_STATUSES} all="All statuses" />
          <FilterSelect value={itemType} onChange={(v) => { setItemType(v); list.setPage(1); }} options={ITEM_TYPES.map((t) => ({ value: t, label: TYPE[t] }))} all="All items" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Order / Date</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.orderNumber}</strong>
                      <div className="small text-muted">{dateTime(p.createdAt)}</div>
                    </td>
                    <td>
                      {p.user ? (
                        <Link to={`/admin/users/${p.user.id}`}>{p.user.name}</Link>
                      ) : (
                        '—'
                      )}
                      <div className="small text-muted">{p.user?.email}</div>
                    </td>
                    <td>
                      {p.itemTitle}
                      <div className="small text-muted">
                        {TYPE[p.itemType]}
                        {p.itemType === 'course' && ` · ${METHOD[p.paymentMethod]}`}
                      </div>
                    </td>
                    <td>{rupees(p.amount, false)}</td>
                    <td>
                      <code>{p.upiTransactionId}</code>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-admin" onClick={() => setOpen(p)}>
                        {p.status === 'pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text={list.status === 'pending' ? 'No payments waiting for review. 🎉' : 'No payments found.'} />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {open && <PaymentReview payment={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function PaymentReview({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const shot = adminApi.fileUrl(`/payments/${payment.id}/screenshot`);
  const a = payment.shippingAddress;

  async function done(message: string) {
    toast(message);
    await qc.invalidateQueries({ queryKey: ['admin'] });
    onClose();
  }

  async function approve() {
    const r = await Swal.fire({
      title: 'Approve this payment?',
      html: `Order <b>${payment.orderNumber}</b> · ${rupees(payment.amount, false)}<br><small>The customer gets access${payment.itemType === 'book_hardcopy' ? ', the order moves to processing' : ''} and is emailed.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      confirmButtonColor: '#28a745',
    });
    if (!r.isConfirmed) return;
    setBusy(true);
    try {
      await adminApi.post(`/payments/${payment.id}/approve`);
      await done('Payment approved');
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  async function reject() {
    const r = await Swal.fire({
      title: 'Reject this payment?',
      input: 'text',
      inputLabel: 'Reason (sent to the customer)',
      inputPlaceholder: 'e.g. Amount not received / transaction ID not found',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#d32f2f',
    });
    if (!r.isConfirmed) return;
    setBusy(true);
    try {
      await adminApi.post(`/payments/${payment.id}/reject`, { reason: (r.value as string) || undefined });
      await done('Payment rejected');
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Payment {payment.orderNumber} <StatusBadge status={payment.status} />
            </h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row g-4">
              <div className="col-lg-6 text-center">
                {payment.upiTransactionId.startsWith('MANUAL-') || imgFailed ? (
                  <div className="alert alert-secondary">No screenshot (manual access grant or file missing).</div>
                ) : (
                  <a href={shot} target="_blank" rel="noopener">
                    <img src={shot} alt="Payment screenshot" className="screenshot-preview" onError={() => setImgFailed(true)} />
                  </a>
                )}
                <div className="small text-muted mt-2">Click the screenshot to open it full size.</div>
              </div>
              <div className="col-lg-6">
                <table className="table table-sm admin-table">
                  <tbody>
                    <tr><th>Customer</th><td>{payment.user ? `${payment.user.name} (${payment.user.email})` : '—'}</td></tr>
                    <tr><th>Item</th><td>{payment.itemTitle} <span className="text-muted">· {TYPE[payment.itemType]}</span></td></tr>
                    <tr><th>Amount</th><td><strong>{rupees(payment.amount, false)}</strong></td></tr>
                    <tr><th>Method</th><td>{METHOD[payment.paymentMethod]}</td></tr>
                    <tr><th>Transaction ID</th><td><code className="fs-6">{payment.upiTransactionId}</code></td></tr>
                    <tr><th>Submitted</th><td>{dateTime(payment.createdAt)}</td></tr>
                    {payment.reviewedAt && (
                      <tr><th>Reviewed</th><td>{dateTime(payment.reviewedAt)}{payment.reviewedBy && ` by ${payment.reviewedBy}`}</td></tr>
                    )}
                    {payment.rejectionReason && <tr><th>Reason</th><td className="text-danger">{payment.rejectionReason}</td></tr>}
                  </tbody>
                </table>
                {a && (
                  <div className="alert alert-light border">
                    <strong><i className="fas fa-shipping-fast"></i> Shipping address</strong>
                    <div>{a.fullName} · {a.phone}</div>
                    <div>{a.address}</div>
                    <div>{a.city}, {a.state} - {a.pincode}</div>
                    {a.landmark && <div className="text-muted">Landmark: {a.landmark}</div>}
                  </div>
                )}
                <div className="alert alert-info small mb-0">
                  Check that the amount and transaction ID in the screenshot match your UPI / bank statement before approving.
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {payment.status !== 'rejected' && (
              <button className="btn btn-outline-danger" disabled={busy} onClick={reject}>
                <i className="fas fa-times"></i> Reject
              </button>
            )}
            {payment.status !== 'approved' && (
              <button className="btn btn-success" disabled={busy} onClick={approve}>
                <i className="fas fa-check"></i> Approve
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
