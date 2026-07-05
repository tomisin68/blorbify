import crypto from 'node:crypto';
import { adminDb, fieldValue, timestamp } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { sendOtpEmail } from './notification.service.js';

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 45;
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function generateAndSendOtp({ uid, email, name }) {
  const docRef = adminDb.collection('emailOtps').doc(uid);
  const existing = await docRef.get();

  if (existing.exists) {
    const lastSentAt = existing.data().lastSentAt?.toDate ? existing.data().lastSentAt.toDate() : null;
    if (lastSentAt) {
      const secondsSinceLastSend = (Date.now() - lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        throw createHttpError(429, `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)}s before requesting another code.`);
      }
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await docRef.set({
    email,
    codeHash: hashCode(code),
    attempts: 0,
    expiresAt: timestamp.fromDate(expiresAt),
    lastSentAt: fieldValue.serverTimestamp(),
    createdAt: existing.exists ? existing.data().createdAt : fieldValue.serverTimestamp(),
  });

  await sendOtpEmail({ toEmail: email, name, code, minutes: OTP_TTL_MINUTES });

  return { expiresInSeconds: OTP_TTL_MINUTES * 60, resendCooldownSeconds: RESEND_COOLDOWN_SECONDS };
}

export async function verifyOtp({ uid, code }) {
  const docRef = adminDb.collection('emailOtps').doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw createHttpError(400, 'No verification code found. Please request a new one.');
  }

  const data = snap.data();
  const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    await docRef.delete();
    throw createHttpError(400, 'This code has expired. Please request a new one.');
  }

  if ((data.attempts || 0) >= MAX_ATTEMPTS) {
    await docRef.delete();
    throw createHttpError(429, 'Too many incorrect attempts. Please request a new code.');
  }

  if (hashCode(code) !== data.codeHash) {
    await docRef.update({ attempts: fieldValue.increment(1) });
    throw createHttpError(400, 'Incorrect code. Please try again.');
  }

  await docRef.delete();
  return true;
}
