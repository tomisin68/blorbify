import dotenv from 'dotenv';

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  relaySharedSecret: process.env.RELAY_SHARED_SECRET || '',
  firebaseServiceAccount: parseJson(process.env.FIREBASE_SERVICE_ACCOUNT_KEY),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: toNumber(process.env.SMTP_PORT, 587),
  smtpSecure: toBoolean(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'Blorbify <no-reply@blorbify.com>',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || '',
};

export function isProduction() {
  return env.nodeEnv === 'production';
}
