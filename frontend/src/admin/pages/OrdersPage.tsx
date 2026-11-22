import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ORDER_STATUSES } from '@shared/constants';
import type { AdminOrder } from '@shared/types/admin';
import type { OrderStatus } from '@shared/types/catalog';
import { dateTime, rupees } from '@/utils/format';
import { adminApi } from '../api';
import { AdminModal, EmptyRow, errorMessage, FilterSelect, Loading, PageTitle, Pagination, QueryError, SearchBox, StatusBadge, toast, useAdminList } from '../ui';

/** These need an approved payment (the API refuses them otherwise). */
const NEEDS_PAYMENT: OrderStatus[] = ['processing', 'shipped', 'delivered'];

/** Hard copy orders: shipping progress, courier and tracking number. */
export default function OrdersPage() {
  const list = useAdminList<AdminOrder>('orders', '/orders');
  const [open, setOpen] = useState<AdminOrder | null>(null);

  return (
    <>
      <PageTitle title="Book Orders (Hard Copies)" icon="fas fa-truck" />
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Order, name, phone, tracking…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={ORDER_STATUSES} all="All statuses" />
        </div>
        {list.isError && <QueryError error={list.error} onRetry={() => void list.refetch()} />}
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Order / Date</th>
                  <th>Customer</th>
                  <th>Book</th>
                  <th>Ship to</th>
                  <th>Payment</th>
                  <th>Order status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.orderNumber}</strong>
                      <div className="small text-muted">{dateTime(o.createdAt)}</div>
                    </td>
                    <td>
                      {o.user?.name ?? '—'}
                      <div className="small text-muted">{o.user?.email}</div>
                    </td>
                    <td>
                      {o.bookTitle}
                      <div className="small text-muted">{rupees(o.amount, false)}</div>
                    </td>
                    <td className="small">
                      {o.shippingAddress.fullName}, {o.shippingAddress.city} ({o.shippingAddress.pincode})
                      <div className="text-muted">{o.shippingAddress.phone}</div>
                    </td>
                    <td>{o.paymentStatus && <StatusBadge status={o.paymentStatus} />}</td>
                    <td>
                      <StatusBadge status={o.status} />
                      {o.trackingNumber && <div className="small text-muted">{o.trackingNumber}</div>}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-admin" onClick={() => setOpen(o)}>
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={7} text="No orders found." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {open && <OrderModal order={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function OrderModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [courier, setCourier] = useState(order.courier ?? '');
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const a = order.shippingAddress;
  const paid = order.paymentStatus === 'approved';

  async function save() {
    setBusy(true);
    try {
      await adminApi.patch(`/orders/${order.id}`, { status, courier, trackingNumber: tracking, notify });
      toast('Order updated');
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={`Order ${order.orderNumber}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      {!paid && (
        <div className="alert alert-warning small">
          {order.paymentStatus ? `The payment for this order is ${order.paymentStatus}.` : 'This order has no payment record.'} Approve the payment in
          Payments before processing or shipping it.
        </div>
      )}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="alert alert-light border mb-0 h-100">
            <strong><i className="fas fa-map-marker-alt"></i> Ship to</strong>
            <div>{a.fullName}</div>
            <div>{a.phone}</div>
            <div>{a.address}</div>
            <div>{a.city}, {a.state} - {a.pincode}</div>
            {a.landmark && <div className="text-muted">Landmark: {a.landmark}</div>}
            <hr />
            <div><strong>{order.bookTitle}</strong> · {rupees(order.amount, false)}</div>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Status</label>
          <select className="form-select mb-3" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} disabled={!paid && s !== order.status && NEEDS_PAYMENT.includes(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <label className="form-label fw-semibold">Courier</label>
          <input className="form-control mb-3" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. India Post, Delhivery" />
          <label className="form-label fw-semibold">Tracking number</label>
          <input className="form-control mb-3" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="notify" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <label className="form-check-label" htmlFor="notify">Email the customer when the status changes to shipped, delivered or cancelled</label>
          </div>
        </div>
      </div>
      {order.statusHistory.length > 0 && (
        <div className="mt-3 small">
          <strong>History:</strong>{' '}
          {order.statusHistory.map((h, i) => (
            <span key={i} className="me-2">
              <StatusBadge status={h.status} /> {dateTime(h.at)}
            </span>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
