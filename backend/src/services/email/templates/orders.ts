import { env } from '../../../config/env';
import { formatRupees } from '../../../shared/utils/text';
import type { MailMessage } from '../mailer';
import { emailLayout, escapeHtml } from './layout';

// Customer emails for purchases, consultations and bookings. Wording follows the PHP
// sendOrderNotification() emails (books_details.php), with SANYOD's own contact details.

const site = () => env.APP_URL.replace(/\/$/, '');
const fmtDate = (d: Date) =>
  d.toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const box = (color: string, html: string) =>
  `<div style="background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${color};">${html}</div>`;
const notice = (bg: string, border: string, html: string) =>
  `<div style="background: ${bg}; border: 1px solid ${border}; padding: 15px; border-radius: 5px; margin: 15px 0;">${html}</div>`;
const row = (k: string, v: string) => `<p style="margin: 4px 0;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`;
const footer = `<p>If you have any questions or need assistance, please use the <a href="${site()}/contact">contact form on our website</a>.</p>
<p>Best regards,<br><strong>SANYOD Team</strong></p>
<p style="font-size: 12px; color: #999;">This is an automated email. Please do not reply to this message.</p>`;

export type PurchaseKind = 'book_pdf' | 'book_hardcopy' | 'course';

const KIND_LABEL: Record<PurchaseKind, string> = {
  book_pdf: 'PDF Version',
  book_hardcopy: 'Hard Book (Physical Copy)',
  course: 'Online Course',
};

interface PurchaseInfo {
  to: string;
  name: string;
  kind: PurchaseKind;
  title: string;
  orderNumber: string;
  amount: number;
  transactionId: string;
  date: Date;
}

export function purchaseConfirmationEmail(p: PurchaseInfo): MailMessage {
  const color = p.kind === 'book_hardcopy' ? '#2196F3' : '#4CAF50';
  const heading =
    p.kind === 'book_pdf' ? '📚 PDF Purchase Confirmation' : p.kind === 'book_hardcopy' ? '📦 Hard Book Order Confirmation' : '🎓 Course Purchase Confirmation';
  const thanks =
    p.kind === 'book_pdf'
      ? `Thank you for purchasing the PDF version of <strong>${escapeHtml(p.title)}</strong>!`
      : p.kind === 'book_hardcopy'
        ? `Thank you for ordering the Hard Book of <strong>${escapeHtml(p.title)}</strong>!`
        : `Thank you for purchasing the course <strong>${escapeHtml(p.title)}</strong>!`;
  const details = box(
    color,
    `<h3 style="margin-top: 0;">📋 Order Details:</h3>${row('Order Number', p.orderNumber)}${row(p.kind === 'course' ? 'Course' : 'Book Title', p.title)}${row('Purchase Type', KIND_LABEL[p.kind])}${row('Transaction ID', p.transactionId)}${row('Amount Paid', formatRupees(p.amount))}${row('Order Date', fmtDate(p.date))}`,
  );
  const review =
    p.kind === 'book_hardcopy'
      ? notice(
          '#e3f2fd',
          '#bbdefb',
          '<h4 style="margin-top: 0;">⏰ Order Processing Notice:</h4><p>Your order is currently <strong>under review</strong>. It will be processed within <strong>24 hours</strong> after admin approval.</p><p>You will receive another email with tracking information once your order is shipped.</p>',
        ) +
        notice(
          '#fff8e1',
          '#ffe082',
          '<h4 style="margin-top: 0;">🚚 Shipping Timeline:</h4><ul><li><strong>1-2 Days:</strong> Order Processing &amp; Packaging</li><li><strong>3-5 Days:</strong> Shipping &amp; Delivery</li><li><strong>Total:</strong> 4-7 Business Days</li></ul><p>We offer <strong>FREE shipping</strong> across India!</p>',
        ) +
        `<p>You can track your order status in <a href="${site()}/my-orders">My Orders</a>.</p>`
      : notice(
          '#fff3cd',
          '#ffeaa7',
          `<h4 style="margin-top: 0;">⏰ Important Notice:</h4><p>Your order is currently <strong>under review</strong>. ${
            p.kind === 'book_pdf' ? 'Your PDF will be available for download' : 'All course videos will be unlocked'
          } within <strong>24 hours</strong> after admin approval.</p><p>You will receive another email once your order is approved.</p>`,
        ) +
        (p.kind === 'book_pdf'
          ? `<h3>📥 How to Access Your PDF:</h3><ol><li>Login to your account on our website</li><li>Go to <a href="${site()}/my-books">My Books</a></li><li>Click on 'Read Online' or 'Download PDF'</li></ol>`
          : `<p>After approval, open <a href="${site()}/my-courses">My Courses</a> to start watching.</p>`);

  const subject = `Order Confirmation - ${p.title}`;
  const html = emailLayout(subject, `<h2 style="margin-top: 0;">${heading}</h2><p>Dear ${escapeHtml(p.name)},</p><p>${thanks}</p>${details}${review}${footer}`);
  const text = [
    'Order Confirmation',
    '',
    `Dear ${p.name},`,
    '',
    'Thank you for your order!',
    '',
    `Order Number: ${p.orderNumber}`,
    `${p.kind === 'course' ? 'Course' : 'Book'}: ${p.title}`,
    `Purchase Type: ${KIND_LABEL[p.kind]}`,
    `Amount: ${formatRupees(p.amount)}`,
    `Transaction ID: ${p.transactionId}`,
    '',
    p.kind === 'book_hardcopy'
      ? 'Your hard book will be shipped within 3-5 business days after approval. You will receive tracking information once shipped.'
      : 'Your purchase will be available within 24 hours after admin approval.',
    '',
    'SANYOD Team',
  ].join('\n');
  return { to: p.to, subject, html, text };
}

export function paymentApprovedEmail(p: { to: string; name: string; kind: PurchaseKind; title: string; orderNumber: string }): MailMessage {
  const what =
    p.kind === 'book_pdf'
      ? `Your PDF of <strong>${escapeHtml(p.title)}</strong> is ready. Open <a href="${site()}/my-books">My Books</a> to read or download it.`
      : p.kind === 'book_hardcopy'
        ? `Your hard book order for <strong>${escapeHtml(p.title)}</strong> is approved and is being prepared for shipping. The PDF version is also available in <a href="${site()}/my-books">My Books</a>.`
        : `All videos of <strong>${escapeHtml(p.title)}</strong> are now unlocked. Open <a href="${site()}/my-courses">My Courses</a> to start learning.`;
  const subject = `Payment Approved - ${p.title}`;
  return {
    to: p.to,
    subject,
    html: emailLayout(subject, `<h2 style="margin-top: 0;">✅ Payment Approved</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#4CAF50', `${row('Order Number', p.orderNumber)}<p>${what}</p>`)}${footer}`),
    text: `Dear ${p.name},\n\nYour payment for ${p.title} (order ${p.orderNumber}) has been approved.\n\nSANYOD Team`,
  };
}

export function paymentRejectedEmail(p: { to: string; name: string; title: string; orderNumber: string; reason?: string }): MailMessage {
  const subject = `Payment Not Approved - ${p.title}`;
  const reason = p.reason ? row('Reason', p.reason) : '';
  return {
    to: p.to,
    subject,
    html: emailLayout(
      subject,
      `<h2 style="margin-top: 0;">Payment Not Approved</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#e74c3c', `${row('Order Number', p.orderNumber)}${reason}<p>We could not verify your payment. If you have paid, please reply with your payment details or submit the correct transaction ID again.</p>`)}${footer}`,
    ),
    text: `Dear ${p.name},\n\nWe could not verify your payment for ${p.title} (order ${p.orderNumber}).${p.reason ? `\nReason: ${p.reason}` : ''}\n\nSANYOD Team`,
  };
}

export function orderStatusEmail(p: {
  to: string;
  name: string;
  title: string;
  orderNumber: string;
  status: string;
  courier?: string | null;
  trackingNumber?: string | null;
}): MailMessage {
  const label = p.status.charAt(0).toUpperCase() + p.status.slice(1);
  const subject = `Order ${label} - ${p.orderNumber}`;
  const tracking = [p.courier ? row('Courier', p.courier) : '', p.trackingNumber ? row('Tracking Number', p.trackingNumber) : ''].join('');
  return {
    to: p.to,
    subject,
    html: emailLayout(
      subject,
      `<h2 style="margin-top: 0;">📦 Order ${escapeHtml(label)}</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#2196F3', `${row('Order Number', p.orderNumber)}${row('Book', p.title)}${row('Status', label)}${tracking}`)}<p>Track your order in <a href="${site()}/my-orders">My Orders</a>.</p>${footer}`,
    ),
    text: `Dear ${p.name},\n\nYour order ${p.orderNumber} (${p.title}) is now ${label}.${p.trackingNumber ? `\nTracking: ${p.courier ?? ''} ${p.trackingNumber}` : ''}\n\nSANYOD Team`,
  };
}

export function consultationReceivedEmail(p: { to: string; name: string; doctorName: string; date: string; time: string }): MailMessage {
  const subject = `Consultation Request Received - Dr. ${p.doctorName}`;
  return {
    to: p.to,
    subject,
    html: emailLayout(
      subject,
      `<h2 style="margin-top: 0;">🩺 Consultation Request Received</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#00b894', `${row('Doctor', `Dr. ${p.doctorName}`)}${row('Preferred Date', p.date)}${row('Preferred Time', p.time)}`)}<p>The doctor will contact you via email/phone within 24 hours to confirm the consultation details.</p>${footer}`,
    ),
    text: `Dear ${p.name},\n\nYour consultation request with Dr. ${p.doctorName} for ${p.date} (${p.time}) has been received. The doctor will contact you within 24 hours.\n\nSANYOD Team`,
  };
}

export function consultationStatusEmail(p: { to: string; name: string; doctorName: string; status: string; note?: string }): MailMessage {
  const label = p.status.charAt(0).toUpperCase() + p.status.slice(1);
  const subject = `Consultation ${label} - Dr. ${p.doctorName}`;
  return {
    to: p.to,
    subject,
    html: emailLayout(
      subject,
      `<h2 style="margin-top: 0;">Consultation ${escapeHtml(label)}</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#00b894', `${row('Doctor', `Dr. ${p.doctorName}`)}${row('Status', label)}${p.note ? row('Note', p.note) : ''}`)}${footer}`,
    ),
    text: `Dear ${p.name},\n\nYour consultation with Dr. ${p.doctorName} is now ${label}.${p.note ? `\nNote: ${p.note}` : ''}\n\nSANYOD Team`,
  };
}

export function eventBookingEmail(p: {
  to: string;
  name: string;
  eventTitle: string;
  dateText: string;
  timeText: string;
  location: string;
  amount: number;
  transactionId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}): MailMessage {
  const heading = p.status === 'pending' ? '🧘 Booking Received' : p.status === 'confirmed' ? '✅ Booking Confirmed' : 'Booking Cancelled';
  const subject = `${heading.replace(/^\W+\s*/, '')} - ${p.eventTitle}`;
  const message =
    p.status === 'pending'
      ? 'We have received your booking. It will be confirmed after we verify your payment (usually within 24 hours).'
      : p.status === 'confirmed'
        ? 'Your payment is verified and your seat is confirmed. We look forward to seeing you!'
        : 'Your booking has been cancelled. If you have questions, please contact us.';
  return {
    to: p.to,
    subject,
    html: emailLayout(
      subject,
      `<h2 style="margin-top: 0;">${heading}</h2><p>Dear ${escapeHtml(p.name)},</p>${box('#4B0082', `${row('Event', p.eventTitle)}${row('Date', p.dateText)}${row('Time', p.timeText)}${row('Location', p.location)}${row('Amount', formatRupees(p.amount))}${row('Transaction ID', p.transactionId)}`)}<p>${message}</p>${footer}`,
    ),
    text: `Dear ${p.name},\n\n${message}\n\nEvent: ${p.eventTitle}\nDate: ${p.dateText} ${p.timeText}\nLocation: ${p.location}\nAmount: ${formatRupees(p.amount)}\nTransaction ID: ${p.transactionId}\n\nSANYOD Team`,
  };
}
