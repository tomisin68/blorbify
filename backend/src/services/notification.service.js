import { getMailerTransport, isMailerConfigured, isResendConfigured, sendResendEmail } from '../config/mailer.js';
import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { escapeHtml, getDashboardUrl, renderEmailCodePill, renderEmailLayout } from '../utils/emailTemplate.js';

export async function queueNotification(notification) {
  const payload = {
    type: notification.type || 'general',
    channel: notification.channel || 'system',
    status: 'queued',
    recipientEmail: notification.recipientEmail || '',
    recipientName: notification.recipientName || '',
    subject: notification.subject || '',
    message: notification.message || '',
    data: notification.data || {},
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection('notifications').add(payload);
  return { id: docRef.id, ...payload };
}

export async function sendEmail({ to, subject, html, text, data = {} }) {
  if (!to) {
    throw new Error('Email recipient is required.');
  }

  if (isResendConfigured()) {
    const result = await sendResendEmail({ to, subject, html, text });
    return { sent: true, messageId: result?.id || null };
  }

  if (isMailerConfigured()) {
    const transport = getMailerTransport();
    const result = await transport.sendMail({
      from: process.env.MAIL_FROM || 'Blorbify <no-reply@blorbify.com>',
      to,
      subject,
      text,
      html,
    });

    return { sent: true, messageId: result.messageId };
  }

  const queued = await queueNotification({
    type: 'email',
    channel: 'email',
    recipientEmail: to,
    subject,
    message: text || subject,
    data: { ...data, delivery: 'queued' },
  });

  return { sent: false, queued: true, notification: queued };
}

export async function queueWelcomeNotification({ user, subscription }) {
  const recipientName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'there';
  const subject = 'Welcome to Blorbify';
  const html = renderEmailLayout({
    preheader: `Your ${subscription.planName} plan is now active.`,
    heading: 'Welcome to Blorbify 🎉',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0 0 14px;">Your ${renderEmailCodePill(escapeHtml(subscription.planName))} plan is now active.</p>
      <p style="margin:0;">You can now continue setting up your store, publish products, and start selling online.</p>
    `,
    ctaLabel: 'Go to your dashboard',
    ctaUrl: getDashboardUrl(),
  });
  const text = `Welcome to Blorbify\n\nHi ${recipientName}, your ${subscription.planName} plan is now active.\n\nYou can now continue setting up your store and start selling online.\n\n${getDashboardUrl()}`;

  const notification = await queueNotification({
    type: 'welcome',
    channel: 'email',
    recipientEmail: user.email || '',
    recipientName,
    subject,
    message: `Your ${subscription.planName} plan is active.`,
    data: { userId: user.userId, subscriptionId: subscription.id },
  });

  if (user.email) {
    try {
      await sendEmail({ to: user.email, subject, html, text, data: { userId: user.userId } });
    } catch (error) {
      console.error('Welcome email send error:', error.message);
    }
  }

  return notification;
}

const ORDER_STATUS_EMAIL_COPY = {
  pending: {
    subject: (storeName) => `Your order from ${storeName} is pending`,
    message: 'Your order has been received and is pending confirmation.',
  },
  processing: {
    subject: (storeName) => `Your order from ${storeName} is being processed`,
    message: 'Good news — your order is now being processed and will be shipped soon.',
  },
  shipped: {
    subject: (storeName) => `Your order from ${storeName} has shipped`,
    message: 'Your order is on its way!',
  },
  delivered: {
    subject: (storeName) => `Your order from ${storeName} has been delivered`,
    message: 'Your order has been marked as delivered. We hope you love it!',
  },
  cancelled: {
    subject: (storeName) => `Your order from ${storeName} was cancelled`,
    message: 'Your order has been cancelled. If this is unexpected, please reach out to the seller.',
  },
};

export async function sendOrderStatusEmail({ order, status, storeName }) {
  const copy = ORDER_STATUS_EMAIL_COPY[status];
  if (!copy || !order.customerEmail) {
    return { sent: false, skipped: true };
  }

  const resolvedStoreName = storeName || order.storeName || 'your seller';
  const subject = copy.subject(resolvedStoreName);
  const recipientName = order.customerName || 'there';
  const html = renderEmailLayout({
    preheader: copy.message,
    heading: subject,
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0 0 14px;">${copy.message}</p>
      <p style="margin:0;">Order reference:<br />${renderEmailCodePill(escapeHtml(order.id || ''))}</p>
    `,
    footerNote: `Sent because your order status changed on ${escapeHtml(resolvedStoreName)}.`,
  });
  const text = `${subject}\n\nHi ${recipientName},\n\n${copy.message}\n\nOrder reference: ${order.id || ''}`;

  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
    text,
    data: { orderId: order.id || null, status },
  });
}

export async function queueOrderNotification({ store, order }) {
  return queueNotification({
    type: 'order',
    channel: 'email',
    recipientEmail: store.email || '',
    recipientName: store.businessName || '',
    subject: `New order for ${store.businessName || 'your store'}`,
    message: `You received a new order from ${order.customerName || 'a customer'}.`,
    data: { storeId: store.ownerId, orderId: order.id || null },
  });
}
