import nodemailer from 'nodemailer';
import axios from 'axios';
import { env } from './env.js';

let cachedTransport = null;

export function isResendConfigured() {
  return Boolean(env.resendApiKey);
}

export async function sendResendEmail({ to, subject, html, text }) {
  const from = env.resendFrom || env.mailFrom;

  if (!from) {
    throw new Error('Missing RESEND_FROM (must be a verified sender in Resend).');
  }

  const response = await axios.post(
    'https://api.resend.com/emails',
    { from, to, subject, html: html || undefined, text: text || undefined },
    {
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data;
}

export function isMailerConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

export function getMailerTransport() {
  if (!isMailerConfigured()) {
    return null;
  }

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return cachedTransport;
}
