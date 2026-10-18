import type { MailMessage } from '../mailer';
import { emailLayout, escapeHtml } from './layout';

/** Plain notification to the site admin listing submitted fields. */
export function adminNotificationEmail(to: string, title: string, fields: Record<string, string | undefined>): MailMessage {
  const rows = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding: 6px 12px; font-weight: bold; vertical-align: top;">${escapeHtml(k)}</td><td style="padding: 6px 12px; white-space: pre-wrap;">${escapeHtml(v ?? '')}</td></tr>`,
    )
    .join('');
  const text = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return {
    to,
    subject: `[SANYOD] ${title}`,
    html: emailLayout(title, `<h2 style="margin-top: 0;">${escapeHtml(title)}</h2><table style="border-collapse: collapse; width: 100%; background: #fff;">${rows}</table>`),
    text: `${title}\n\n${text}`,
  };
}
