import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { adminAuth, adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { generateAndSendOtp, verifyOtp, generateAndSendEmailChangeOtp, verifyEmailChangeOtp } from '../services/otp.service.js';
import { sendSignupWelcomeEmail } from '../services/notification.service.js';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendEmailOtp = asyncHandler(async (req, res) => {
  const { uid, email } = req.user;
  if (!email) {
    throw createHttpError(400, 'Your account has no email address on file.');
  }

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : {};
  const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();

  const result = await generateAndSendOtp({ uid, email, name });
  return ok(res, { data: result });
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { uid, email } = req.user;
  const { code } = req.body || {};
  if (!code) {
    throw createHttpError(400, 'code is required.');
  }

  await verifyOtp({ uid, code: String(code) });

  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};
  const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();

  await userRef.set({ emailVerified: true, updatedAt: fieldValue.serverTimestamp() }, { merge: true });
  await adminAuth.updateUser(uid, { emailVerified: true }).catch((error) => {
    console.error('Failed to sync Firebase Auth emailVerified flag:', error.message);
  });

  if (email) {
    sendSignupWelcomeEmail({ toEmail: email, name }).catch((error) => {
      console.error('Signup welcome email error:', error.message);
    });
  }

  return ok(res, { data: { verified: true } });
});

export const sendEmailChangeOtp = asyncHandler(async (req, res) => {
  const { uid, email: currentEmail } = req.user;
  const newEmail = String(req.body?.newEmail || '').trim().toLowerCase();

  if (!newEmail || !EMAIL_FORMAT_REGEX.test(newEmail)) {
    throw createHttpError(400, 'Enter a valid email address.');
  }
  if (newEmail === String(currentEmail || '').toLowerCase()) {
    throw createHttpError(400, 'That is already your current email address.');
  }

  let emailTaken = true;
  try {
    await adminAuth.getUserByEmail(newEmail);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
    emailTaken = false;
  }
  if (emailTaken) {
    throw createHttpError(409, 'That email address is already in use by another account.');
  }

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : {};
  const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();

  const result = await generateAndSendEmailChangeOtp({ uid, newEmail, name });
  return ok(res, { data: result });
});

export const confirmEmailChange = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { code } = req.body || {};
  if (!code) {
    throw createHttpError(400, 'code is required.');
  }

  const newEmail = await verifyEmailChangeOtp({ uid, code: String(code) });

  await adminAuth.updateUser(uid, { email: newEmail, emailVerified: true });
  await adminDb.collection('users').doc(uid).set(
    { email: newEmail, updatedAt: fieldValue.serverTimestamp() },
    { merge: true }
  );

  return ok(res, { data: { email: newEmail } });
});
