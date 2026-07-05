import { adminDb } from '../config/firebaseAdmin.js';
import { sendEmail } from './notification.service.js';
import { escapeHtml, renderEmailLayout } from '../utils/emailTemplate.js';
import { renderDocumentPdf } from '../utils/pdf.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNaira(kobo) {
  return `₦${(toNumber(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function formatDateLabel(value) {
  const date = value?.toDate ? value.toDate() : new Date(value || Date.now());
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Emails the SELLER a PDF receipt for one order — the automatic Paystack
// success path and the manual "send me a receipt" WhatsApp-order button both
// funnel through this one function, since both just need `orders/{orderId}`.
export async function sendSellerOrderReceiptEmail({ orderId, sellerId, paymentMethod = '', paymentReference = '' }) {
  if (!orderId || !sellerId) {
    return { sent: false, skipped: true, reason: 'missing-order-or-seller' };
  }

  const [orderSnap, userSnap] = await Promise.all([
    adminDb.collection('orders').doc(orderId).get(),
    adminDb.collection('users').doc(sellerId).get(),
  ]);

  if (!orderSnap.exists) {
    return { sent: false, skipped: true, reason: 'order-not-found' };
  }

  const toEmail = userSnap.exists ? userSnap.data()?.email : '';
  if (!toEmail) {
    return { sent: false, skipped: true, reason: 'no-seller-email' };
  }

  const order = orderSnap.data();
  const items = Array.isArray(order.items) ? order.items : [];
  const dateLabel = formatDateLabel(order.createdAt);
  const storeName = order.storeName || 'Your store';

  const pdf = await renderDocumentPdf({
    docType: 'Order Receipt',
    storeName,
    reference: paymentReference || orderId,
    dateLabel,
    billTo: {
      name: order.customerName || '',
      email: order.customerEmail || '',
      phone: order.customerPhone || '',
      address: order.customerAddress || '',
    },
    items: items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discountAmount,
    total: order.total,
    footerNote: `Payment method: ${paymentMethod || order.paymentMethod || 'unknown'}`,
  });

  const subject = `Receipt for order from ${order.customerName || 'a customer'} — ${storeName}`;
  const html = renderEmailLayout({
    preheader: `You received an order for ${formatNaira(order.total)}.`,
    heading: 'New order receipt',
    bodyHtml: `
      <p style="margin:0 0 14px;">Here's the receipt for an order placed at ${escapeHtml(storeName)}.</p>
      <p style="margin:0 0 6px;">Customer: <strong>${escapeHtml(order.customerName || '')}</strong></p>
      <p style="margin:0 0 6px;">Total: <strong>${formatNaira(order.total)}</strong></p>
      <p style="margin:0;">A PDF copy is attached for your records.</p>
    `,
    footerNote: 'Sent because you received a new order on Blorbify.',
  });
  const text = `Receipt for order from ${order.customerName || 'a customer'} — ${storeName}\n\nTotal: ${formatNaira(order.total)}\n\nA PDF copy is attached.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    attachments: [{ filename: `blorbify-receipt-${orderId}.pdf`, content: pdf }],
  });
}
