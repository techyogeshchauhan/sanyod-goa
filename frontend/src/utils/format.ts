// Display helpers shared by the commerce pages (money arrives in paise).

/** "₹499.00" (as the live course/event cards) or, with decimals=false, "₹300". */
export function rupees(paise: number | null | undefined, decimals = true): string {
  if (paise == null) return '—';
  const r = paise / 100;
  return `₹${decimals ? r.toFixed(2) : Number.isInteger(r) ? String(r) : r.toFixed(2)}`;
}

/** "₹2,999.00" with Indian digit grouping (programes.php price tags). */
export function rupeesGrouped(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** "10:00" from seconds. */
export function duration(sec: number | null | undefined): string {
  const s = sec ?? 600;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Text with line breaks preserved, like PHP nl2br(htmlspecialchars()). */
export function nl2lines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n');
}

export const PAYMENT_STATUS_LABEL = { pending: 'Pending Approval', approved: 'Approved', rejected: 'Rejected' } as const;
export const ORDER_STATUS_LABEL = {
  pending: 'Order Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const;
