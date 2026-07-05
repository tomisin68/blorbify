import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { adminDb } from '../config/firebaseAdmin.js';
import {
  queueOrderNotification,
  queueNotification,
  sendEmail,
  sendLowStockEmail,
  sendOrderStatusEmail,
} from '../services/notification.service.js';
import { sendSellerOrderReceiptEmail } from '../services/receipt.service.js';
import { escapeHtml, getDashboardUrl, renderEmailCodePill, renderEmailLayout } from '../utils/emailTemplate.js';

export const sendWelcomeEmail = asyncHandler(async (req, res) => {
  const { email, name = '', planName = 'your plan' } = req.body || {};

  if (!email) {
    throw createHttpError(400, 'email is required.');
  }

  const recipientName = name || 'there';
  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Blorbify',
    text: `Hi ${recipientName}, your ${planName} subscription is active.\n\n${getDashboardUrl()}`,
    html: renderEmailLayout({
      preheader: `Your ${planName} subscription is active.`,
      heading: 'Welcome to Blorbify 🎉',
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
        <p style="margin:0;">Your ${renderEmailCodePill(escapeHtml(planName))} subscription is active.</p>
      `,
      ctaLabel: 'Go to your dashboard',
      ctaUrl: getDashboardUrl(),
    }),
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

export const sendOrderReceipt = asyncHandler(async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) {
    throw createHttpError(400, 'orderId is required.');
  }

  const orderSnap = await adminDb.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) {
    throw createHttpError(404, 'Order not found.');
  }

  const order = orderSnap.data();
  if (order.storeId !== req.user?.uid) {
    throw createHttpError(403, 'You do not have access to this order.');
  }

  const result = await sendSellerOrderReceiptEmail({
    orderId,
    sellerId: req.user.uid,
    paymentMethod: order.paymentMethod || 'whatsapp',
  });
  return ok(res, { data: result });
});

export const sendLowStockAlert = asyncHandler(async (req, res) => {
  const { productName, stock } = req.body || {};
  if (!productName || stock === undefined) {
    throw createHttpError(400, 'productName and stock are required.');
  }

  let toEmail = req.user?.email || '';
  let storeName = '';

  const userSnap = await adminDb.collection('users').doc(req.user.uid).get();
  if (userSnap.exists) {
    const userData = userSnap.data();
    toEmail = toEmail || userData.email || '';
    storeName = userData.businessName || '';
  }

  if (!storeName) {
    const storeSnap = await adminDb.collection('stores').doc(req.user.uid).get();
    if (storeSnap.exists) {
      storeName = storeSnap.data().businessName || '';
    }
  }

  const result = await sendLowStockEmail({ toEmail, storeName, productName, stock: Number(stock) });
  return ok(res, { data: result });
});
