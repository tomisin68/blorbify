import { getMailerTransport, isMailerConfigured, isResendConfigured, sendResendEmail } from '../config/mailer.js';
import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { escapeHtml, getDashboardUrl, renderEmailCodeBlock, renderEmailCodePill, renderEmailLayout } from '../utils/emailTemplate.js';

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

export async function sendEmail({ to, subject, html, text, data = {}, attachments = [] }) {
  if (!to) {
    throw new Error('Email recipient is required.');
  }

  if (isResendConfigured()) {
    const result = await sendResendEmail({ to, subject, html, text, attachments });
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
      attachments,
    });

    return { sent: true, messageId: result.messageId };
  }

  // Attachments are dropped on this fallback path — the Firestore `notifications`
  // doc is a queued record, not a real transport, so there's nowhere to put a
  // CSV file. Acceptable: the report data can be regenerated on demand via the
  // ledger export routes.

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

export async function sendOtpEmail({ toEmail, name, code, minutes }) {
  const recipientName = name || 'there';
  const subject = 'Your Blorbify verification code';
  const html = renderEmailLayout({
    preheader: `Your verification code is ${code}`,
    heading: 'Verify your email',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0 0 18px;">Use the code below to verify your email address and finish setting up your Blorbify account. It expires in ${minutes} minutes.</p>
      ${renderEmailCodeBlock(code)}
      <p style="margin:16px 0 0; color:#93A2A6; font-size:13px;">Didn&rsquo;t request this? You can safely ignore this email.</p>
    `,
    footerNote: 'Sent because someone requested a verification code for this email address on Blorbify.',
  });
  const text = `Your Blorbify verification code is ${code}. It expires in ${minutes} minutes.\n\nDidn't request this? You can ignore this email.`;

  return sendEmail({ to: toEmail, subject, html, text, data: { type: 'otp' } });
}

export async function sendSignupWelcomeEmail({ toEmail, name }) {
  const recipientName = name || 'there';
  const subject = 'Welcome to Blorbify — a note from our founder';
  const dashboardUrl = getDashboardUrl();
  const html = renderEmailLayout({
    preheader: 'A personal welcome from the Blorbify team.',
    heading: 'Welcome to Blorbify 🎉',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0 0 14px;">Your email is verified and your account is ready. I&rsquo;m genuinely excited to have you here.</p>
      <p style="margin:0 0 14px;">Blorbify exists to help you get your business online quickly — a store, delivery, and marketing, all without needing a developer or designer. Whatever you&rsquo;re building, we&rsquo;re rooting for you.</p>
      <p style="margin:0 0 20px;">If you ever get stuck or have feedback, just reply to this email — it reaches our team directly.</p>
      <p style="margin:0;">Welcome aboard,<br />
      <strong style="color:#f6f8f1;">Samuel Oluwabiyi Oluwatomisin</strong><br />
      Founder &amp; CEO, Blorbify</p>
    `,
    ctaLabel: 'Go to your dashboard',
    ctaUrl: dashboardUrl,
    footerNote: 'You are receiving this email because you created a Blorbify account.',
  });
  const text = `Welcome to Blorbify\n\nHi ${recipientName}, your email is verified and your account is ready.\n\nBlorbify exists to help you get your business online quickly — a store, delivery, and marketing, all without needing a developer or designer.\n\nIf you ever get stuck or have feedback, just reply to this email.\n\nWelcome aboard,\nSamuel Oluwabiyi Oluwatomisin\nFounder & CEO, Blorbify\n\n${dashboardUrl}`;

  return sendEmail({ to: toEmail, subject, html, text, data: { type: 'signup-welcome' } });
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

export async function sendLowStockEmail({ toEmail, storeName, productName, stock }) {
  if (!toEmail) {
    return { sent: false, skipped: true };
  }

  const resolvedStoreName = storeName || 'your store';
  const subject = `Low stock: ${productName} is running out on ${resolvedStoreName}`;
  const message = stock > 0
    ? `Only ${stock} left in stock — restock soon so you don't miss out on sales.`
    : `This product is now out of stock.`;
  const dashboardUrl = getDashboardUrl();
  const html = renderEmailLayout({
    preheader: message,
    heading: 'Low stock alert',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi there,</p>
      <p style="margin:0 0 14px;">${escapeHtml(message)}</p>
      <p style="margin:0;">Product:<br />${renderEmailCodePill(escapeHtml(productName || ''))}</p>
    `,
    ctaLabel: 'Update stock',
    ctaUrl: dashboardUrl,
    footerNote: `Sent because ${escapeHtml(productName || 'a product')} crossed your low-stock threshold.`,
  });
  const text = `${subject}\n\n${message}\n\nProduct: ${productName || ''}\n\n${dashboardUrl}`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    data: { type: 'low-stock', productName, stock },
  });
}

export async function sendAbandonedCartEmail({ toEmail, toName, storeName, storeSlug }) {
  if (!toEmail) {
    return { sent: false, skipped: true };
  }

  const resolvedStoreName = storeName || 'the store';
  const storeUrl = getDashboardUrl(`/${storeSlug || ''}`);
  const subject = `You left something in your cart at ${resolvedStoreName}`;
  const recipientName = toName || 'there';
  const html = renderEmailLayout({
    preheader: `Your cart at ${resolvedStoreName} is still waiting for you.`,
    heading: 'Still thinking it over?',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0;">You left some items in your cart at ${renderEmailCodePill(escapeHtml(resolvedStoreName))}. Come back and finish your order whenever you're ready.</p>
    `,
    ctaLabel: `Return to ${resolvedStoreName}`,
    ctaUrl: storeUrl,
    footerNote: `Sent because you started an order at ${escapeHtml(resolvedStoreName)} on Blorbify.`,
  });
  const text = `${subject}\n\nHi ${recipientName}, you left some items in your cart at ${resolvedStoreName}.\n\n${storeUrl}`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    data: { type: 'abandoned-cart', storeSlug },
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
