import { getMailerTransport, isMailerConfigured } from '../config/mailer.js';
import { adminDb, fieldValue } from '../config/firebaseAdmin.js';

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

  if (!isMailerConfigured()) {
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

export async function queueWelcomeNotification({ user, subscription }) {
  return queueNotification({
    type: 'welcome',
    channel: 'email',
    recipientEmail: user.email || '',
    recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
    subject: 'Welcome to Blorbify',
    message: `Your ${subscription.planName} plan is active.`,
    data: { userId: user.userId, subscriptionId: subscription.id },
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
