import type { MailMessage } from '../mailer';
import { emailLayout, escapeHtml } from './layout';

export function resetPasswordEmail(to: string, name: string, link: string, ttlMinutes: number): MailMessage {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);
  const html = emailLayout(
    'Reset your SANYOD password',
    `<h2 style="margin-top: 0;">Dear ${safeName},</h2>
     <p>We received a request to reset the password of your SANYOD account.</p>
     <p style="text-align: center; margin: 30px 0;">
       <a href="${safeLink}" style="background: linear-gradient(90deg, #dc3545, #fd7e14); color: #fff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: bold;">Reset Password Now</a>
     </p>
     <p>Or copy this link into your browser:<br><span style="word-break: break-all;">${safeLink}</span></p>
     <p style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
       This link is valid for ${ttlMinutes} minutes. If you did not request a password reset, you can ignore this email.
     </p>`,
  );
  const text = `Dear ${name},\n\nReset your SANYOD password using this link (valid for ${ttlMinutes} minutes):\n${link}\n\nIf you did not request a password reset, you can ignore this email.`;
  return { to, subject: 'Reset your SANYOD password', html, text };
}
