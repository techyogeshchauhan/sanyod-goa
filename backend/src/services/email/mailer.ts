import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Messages "sent" without SMTP (development/tests). Newest last. */
export const outbox: MailMessage[] = [];

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/** Sends an email. Never throws: a failed email must not fail the user's request. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!message.to.trim()) return false;
  const transport = getTransporter();
  if (!transport) {
    outbox.push(message);
    if (outbox.length > 50) outbox.shift();
    logger.info({ to: message.to, subject: message.subject, text: message.text }, 'Email (SMTP not configured)');
    return true;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await transport.sendMail({ from: env.MAIL_FROM, ...message });
      return true;
    } catch (err) {
      logger.warn({ err, attempt, to: message.to, subject: message.subject }, 'Email send failed');
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return false;
}
