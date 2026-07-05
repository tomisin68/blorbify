import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { sendEmail } from './notification.service.js';
import { escapeHtml, renderEmailLayout } from '../utils/emailTemplate.js';
import { renderDocumentPdf } from '../utils/pdf.js';

const INVOICES_COLLECTION = 'invoices';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNaira(amountNaira) {
  return `₦${toNumber(amountNaira).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function buildInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

function normalizeItems(rawItems) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) {
    throw createHttpError(400, 'At least one invoice item is required.');
  }

  return items.map((item) => {
    const description = String(item.description || item.name || '').trim();
    const quantity = toNumber(item.quantity, 1);
    const unitPrice = toNumber(item.unitPrice ?? item.price, 0);

    if (!description) {
      throw createHttpError(400, 'Every invoice item needs a description.');
    }
    if (!(quantity > 0)) {
      throw createHttpError(400, 'Every invoice item needs a quantity greater than zero.');
    }
    if (!(unitPrice >= 0)) {
      throw createHttpError(400, 'Every invoice item needs a valid unit price.');
    }

    return { description, quantity, unitPrice, subtotal: quantity * unitPrice };
  });
}

async function emailInvoicePdf(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const dateLabel = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

  const pdf = await renderDocumentPdf({
    docType: 'Invoice & Receipt',
    storeName: invoice.storeName,
    reference: invoice.invoiceNumber,
    dateLabel,
    billTo: {
      name: invoice.customerName,
      email: invoice.customerEmail,
      phone: invoice.customerPhone,
    },
    items,
    subtotal: invoice.subtotal,
    total: invoice.total,
    note: invoice.note,
  });

  const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.storeName}`;
  const html = renderEmailLayout({
    preheader: `Your invoice total is ${formatNaira(invoice.total)}.`,
    heading: `Invoice from ${escapeHtml(invoice.storeName)}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(invoice.customerName || 'there')},</p>
      <p style="margin:0 0 14px;">${escapeHtml(invoice.storeName)} sent you an invoice for <strong>${formatNaira(invoice.total)}</strong>. A PDF copy is attached — it also serves as your receipt.</p>
    `,
    footerNote: `Sent because ${escapeHtml(invoice.storeName)} issued you an invoice on Blorbify.`,
  });
  const text = `Invoice from ${invoice.storeName}\n\nTotal: ${formatNaira(invoice.total)}\n\nA PDF copy is attached.`;

  return sendEmail({
    to: invoice.customerEmail,
    subject,
    html,
    text,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }],
  });
}

export async function createAndSendInvoice(sellerId, { customerName, customerEmail, customerPhone = '', items: rawItems, note = '' }) {
  if (!customerName) throw createHttpError(400, 'customerName is required.');
  if (!customerEmail) throw createHttpError(400, 'customerEmail is required.');

  const items = normalizeItems(rawItems);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const storeSnap = await adminDb.collection('stores').doc(sellerId).get();
  const storeName = storeSnap.exists ? storeSnap.data()?.businessName || 'Your store' : 'Your store';

  const invoiceNumber = buildInvoiceNumber();
  const invoiceRef = adminDb.collection(INVOICES_COLLECTION).doc();
  const invoice = {
    sellerId,
    storeName,
    invoiceNumber,
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    total: subtotal,
    note,
    status: 'sending',
    createdAt: fieldValue.serverTimestamp(),
  };

  await invoiceRef.set(invoice);

  const sendResult = await emailInvoicePdf(invoice);

  await invoiceRef.set(
    { status: 'sent', sentAt: fieldValue.serverTimestamp() },
    { merge: true }
  );

  return { id: invoiceRef.id, ...invoice, status: 'sent', sendResult };
}

async function loadOwnedInvoice(invoiceId, sellerId) {
  const invoiceRef = adminDb.collection(INVOICES_COLLECTION).doc(invoiceId);
  const snap = await invoiceRef.get();
  if (!snap.exists) {
    throw createHttpError(404, 'Invoice not found.');
  }
  const invoice = snap.data();
  if (invoice.sellerId !== sellerId) {
    throw createHttpError(403, 'You do not have access to this invoice.');
  }
  return { invoiceRef, invoice };
}

export async function resendInvoice(invoiceId, sellerId) {
  const { invoiceRef, invoice } = await loadOwnedInvoice(invoiceId, sellerId);
  const sendResult = await emailInvoicePdf(invoice);
  await invoiceRef.set({ sentAt: fieldValue.serverTimestamp() }, { merge: true });
  return { sendResult };
}

export async function getInvoicePdfBuffer(invoiceId, sellerId) {
  const { invoice } = await loadOwnedInvoice(invoiceId, sellerId);
  const dateLabel = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

  return renderDocumentPdf({
    docType: 'Invoice & Receipt',
    storeName: invoice.storeName,
    reference: invoice.invoiceNumber,
    dateLabel,
    billTo: {
      name: invoice.customerName,
      email: invoice.customerEmail,
      phone: invoice.customerPhone,
    },
    items: invoice.items,
    subtotal: invoice.subtotal,
    total: invoice.total,
    note: invoice.note,
  });
}

export async function setInvoiceStatus(invoiceId, sellerId, status) {
  if (!['sent', 'paid'].includes(status)) {
    throw createHttpError(400, 'status must be "sent" or "paid".');
  }
  const { invoiceRef } = await loadOwnedInvoice(invoiceId, sellerId);
  await invoiceRef.set({ status, updatedAt: fieldValue.serverTimestamp() }, { merge: true });
  return { status };
}
