import crypto from 'node:crypto';
import { adminDb, fieldValue, timestamp } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { sendOtpEmail, sendEmailChangeOtpEmail } from './notification.service.js';

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 45;
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// TEMPORARY: OTP email delivery is broken in production (see generateAndSendOtp
// below), so the code is pinned to a fixed value instead of a random one, and
// sending is best-effort. This means ANYONE can verify ANY email address on
// this deployment by typing 123456 — it must be reverted to crypto.randomInt
// once real email delivery (Resend/SMTP) is fixed and confirmed working.
const DEV_FIXED_OTP = '123456';

function generateCode() {
  return DEV_FIXED_OTP;
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

  // Best-effort: the code above is already fixed/known, so a delivery failure
  // shouldn't block verification — log it and move on instead of failing the request.
  try {
    await sendOtpEmail({ toEmail: email, name, code, minutes: OTP_TTL_MINUTES });
  } catch (error) {
    console.error('OTP email send failed (continuing — code is fixed for now):', error.message);
  }

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

export async function generateAndSendEmailChangeOtp({ uid, newEmail, name }) {
  const docRef = adminDb.collection('emailChangeOtps').doc(uid);
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
    newEmail,
    codeHash: hashCode(code),
    attempts: 0,
    expiresAt: timestamp.fromDate(expiresAt),
    lastSentAt: fieldValue.serverTimestamp(),
    createdAt: existing.exists ? existing.data().createdAt : fieldValue.serverTimestamp(),
  });

  // Best-effort, same as generateAndSendOtp: the code is already fixed/known
  // (see DEV_FIXED_OTP above), so a delivery failure shouldn't block verification.
  try {
    await sendEmailChangeOtpEmail({ toEmail: newEmail, name, code, minutes: OTP_TTL_MINUTES });
  } catch (error) {
    console.error('Email-change OTP send failed (continuing — code is fixed for now):', error.message);
  }

  return { expiresInSeconds: OTP_TTL_MINUTES * 60, resendCooldownSeconds: RESEND_COOLDOWN_SECONDS };
}

export async function verifyEmailChangeOtp({ uid, code }) {
  const docRef = adminDb.collection('emailChangeOtps').doc(uid);
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
  return data.newEmail;
}
