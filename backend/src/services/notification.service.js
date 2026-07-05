import { getMailerTransport, isMailerConfigured, isResendConfigured, sendResendEmail } from '../config/mailer.js';
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
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#192328;">
      <h2 style="margin:0 0 12px;">Welcome to Blorbify</h2>
      <p style="margin:0 0 12px;">Hi ${recipientName}, your ${subscription.planName} plan is now active.</p>
      <p style="margin:0 0 12px;">You can now continue setting up your store, publish products, and start selling online.</p>
    </div>
  `;
  const text = `Welcome to Blorbify\n\nHi ${recipientName}, your ${subscription.planName} plan is now active.\n\nYou can now continue setting up your store and start selling online.`;

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
