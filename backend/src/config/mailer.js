import nodemailer from 'nodemailer';
import { env } from './env.js';

let cachedTransport = null;

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
