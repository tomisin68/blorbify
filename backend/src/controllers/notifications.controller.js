import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { adminDb } from '../config/firebaseAdmin.js';
import {
  queueOrderNotification,
  queueNotification,
  sendEmail,
  sendOrderStatusEmail,
} from '../services/notification.service.js';

export const sendWelcomeEmail = asyncHandler(async (req, res) => {
  const { email, name = '', planName = 'your plan' } = req.body || {};

  if (!email) {
    throw createHttpError(400, 'email is required.');
  }

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Blorbify',
    text: `Hi ${name || 'there'}, your ${planName} subscription is active.`,
    html: `<p>Hi ${name || 'there'},</p><p>Your <strong>${planName}</strong> subscription is active.</p>`,
    data: { type: 'welcome', planName },
  });

  return ok(res, { data: result }, 201);
});

export const queueWelcomeNotice = asyncHandler(async (req, res) => {
  const result = await queueNotification({
    type: 'welcome',
    channel: 'email',
    recipientEmail: req.body?.email || '',
    recipientName: req.body?.name || '',
    subject: req.body?.subject || 'Welcome to Blorbify',
    message: req.body?.message || 'Your account is ready.',
    data: req.body?.data || {},
  });

  return ok(res, { data: result }, 201);
});

export const queueOrderNotice = asyncHandler(async (req, res) => {
  const result = await queueOrderNotification({
    store: req.body?.store || {},
    order: req.body?.order || {},
  });

  return ok(res, { data: result }, 201);
});

export const sendOrderStatusUpdate = asyncHandler(async (req, res) => {
  const { orderId, status } = req.body || {};
  if (!orderId || !status) {
    throw createHttpError(400, 'orderId and status are required.');
  }

  const orderSnap = await adminDb.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) {
    throw createHttpError(404, 'Order not found.');
  }

  const order = { id: orderSnap.id, ...orderSnap.data() };
  if (order.storeId !== req.user?.uid) {
    throw createHttpError(403, 'You do not have access to this order.');
  }

  const result = await sendOrderStatusEmail({ order, status, storeName: order.storeName });
  return ok(res, { data: result });
});
