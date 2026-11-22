import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import Swal from 'sweetalert2';
import type { Paginated } from '@shared/types/api';
import { ApiError } from '@/api/client';
import { adminApi, type ListParams } from './api';

export function PageTitle({ title, icon, children }: { title: string; icon: string; children?: ReactNode }) {
  return (
    <div className="admin-page-title">
      <h1>
        <i className={`${icon} text-admin me-2`}></i>
        {title}
      </h1>
      {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

/** Search box that reports its value after the user stops typing. */
export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    const id = window.setTimeout(() => text !== value && onChange(text), 350);
    return () => window.clearTimeout(id);
  }, [text, value, onChange]);
  return (
    <div className="input-group" style={{ maxWidth: 320 }}>
      <span className="input-group-text bg-white">
        <i className="fas fa-search text-muted"></i>
      </span>
      <input type="search" className="form-control" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  all = 'All',
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  all?: string;
}) {
  return (
    <select className="form-select" style={{ maxWidth: 200 }} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1) } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3 small">
      <span className="text-muted">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="btn-group">
        <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="btn btn-outline-secondary btn-sm disabled">
          {page} / {pages}
        </span>
        <button className="btn btn-outline-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

const BADGE: Record<string, string> = {
  pending: 'warning text-dark',
  approved: 'success',
  rejected: 'danger',
  processing: 'info text-dark',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'secondary',
  confirmed: 'success',
  completed: 'success',
  new: 'danger',
  read: 'secondary',
  replied: 'success',
  active: 'success',
  inactive: 'secondary',
  published: 'success',
  draft: 'secondary',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge bg-${BADGE[status] ?? 'secondary'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

export function Loading() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-danger" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export function EmptyRow({ cols, text = 'Nothing found.' }: { cols: number; text?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center text-muted py-4">
        {text}
      </td>
    </tr>
  );
}

/** A failed load: the reason and a Retry button (instead of an empty table or an endless spinner). */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center gap-2 flex-wrap" role="alert">
      <span>
        <i className="fas fa-exclamation-triangle me-2"></i>
        {errorMessage(error)}
      </span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');

export function toast(message: string, icon: 'success' | 'error' = 'success') {
  void Swal.fire({ toast: true, position: 'top-end', icon, title: message, showConfirmButton: false, timer: 2500, timerProgressBar: true });
}

export async function confirmAction(title: string, text: string, confirmText = 'Yes', danger = false): Promise<boolean> {
  const r = await Swal.fire({
    title,
    text,
    icon: danger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    confirmButtonColor: danger ? '#d32f2f' : '#28a745',
  });
  return r.isConfirmed;
}

/** Paginated admin list with search/filter state. */
export function useAdminList<T>(key: string, path: string, extra: ListParams = {}, pageSize = 25, initialStatus = '') {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const params: ListParams = { page, pageSize, q: q || undefined, status: status || undefined, ...extra };
  const query = useQuery<Paginated<T>>({
    queryKey: ['admin', key, params],
    queryFn: () => adminApi.list<T>(path, params),
    placeholderData: keepPreviousData,
  });
  // After deleting the last row of the last page, step back to the new last page.
  const total = query.data?.total;
  useEffect(() => {
    if (total === undefined || query.isPlaceholderData) return;
    const last = Math.max(1, Math.ceil(total / pageSize));
    if (page > last) setPage(last);
  }, [total, page, pageSize, query.isPlaceholderData]);
  return {
    ...query,
    page,
    setPage,
    /** Back to page 1 with no search (e.g. when switching tabs). */
    reset: () => {
      setQ('');
      setPage(1);
    },
    q,
    setQ: (v: string) => {
      setQ(v);
      setPage(1);
    },
    status,
    setStatus: (v: string) => {
      setStatus(v);
      setPage(1);
    },
    pageSize,
  };
}

/** File input with an image preview (current image or the newly chosen file). */
export function ImageInput({
  label,
  current,
  file,
  onFile,
  required,
  accept = 'image/*',
}: {
  label: string;
  current?: string | null;
  file: File | null;
  onFile: (f: File | null) => void;
  required?: boolean;
  accept?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const shown = preview ?? current;
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <div className="d-flex align-items-center gap-3">
        {shown && <img src={shown} alt="" className="admin-thumb" style={{ width: 70, height: 70 }} />}
        <input type="file" className="form-control" accept={accept} onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </div>
    </div>
  );
}

export const rupeesInput = (paise: number | null | undefined) => (paise == null ? '' : String(paise / 100));

/** Simple controlled modal (React-rendered, no Bootstrap JS). */
export function AdminModal({
  title,
  onClose,
  children,
  footer,
  size = 'lg',
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'lg' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog modal-${size} modal-dialog-scrollable`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Server field errors that have no inline message next to an input (e.g. "workingHours.0.label"),
 * so the "check the highlighted fields" toast never points at nothing.
 */
export function FormErrors({ errors, shown = [], labels = {} }: { errors: Record<string, string>; shown?: string[]; labels?: Record<string, string> }) {
  const rest = Object.entries(errors).filter(([k]) => !shown.includes(k));
  if (rest.length === 0) return null;
  return (
    <div className="alert alert-danger small" role="alert">
      <ul className="mb-0 ps-3">
        {rest.map(([k, message]) => (
          <li key={k}>
            <strong>{labels[k] ?? k}:</strong> {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Field-level errors from a 400 response, keyed by field name. */
export const fieldErrors = (err: unknown): Record<string, string> => (err instanceof ApiError && err.fields ? err.fields : {});
