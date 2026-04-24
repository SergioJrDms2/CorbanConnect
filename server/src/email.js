import nodemailer from 'nodemailer';
import { config } from './config.js';

/**
 * Nodemailer SMTP client. Qualquer SMTP serve:
 *  - Gmail com App Password
 *  - AWS SES SMTP
 *  - SendGrid SMTP
 *  - servidor próprio
 */
export const mailer = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

/**
 * Envia e-mail. `cc` é opcional — quando presente, coloca o Corban em cópia
 * (transparência: o Corban enxerga o que foi mandado ao cliente dele).
 */
export async function sendEmail({ to, cc, subject, html, text }) {
  if (!to) throw new Error('to é obrigatório');
  const result = await mailer.sendMail({
    from: config.smtp.from,
    to,
    cc: cc || undefined,
    subject,
    html,
    text,
  });
  return { messageId: result.messageId ?? null };
}

export async function verifyEmailConfig() {
  try {
    await mailer.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
