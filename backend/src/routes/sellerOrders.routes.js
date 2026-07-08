import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRelaySecret } from '../middleware/relayAuth.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import {
  applySellerOrderPayment,
  createSellerOrderPaymentIntent,
  getSellerOrderByReference,
} from '../services/sellerOrder.service.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { verifyPaystackTransaction } from '../config/paystack.js';
import { toCsv } from '../utils/csv.js';

const router = Router();

router.post('/paystack/initialize', asyncHandler(async (req, res) => {
  const {
    sellerId,
    orderId,
    email,
    amountNaira,
    callbackUrl = '',
    returnUrl = '',
    buyerName = '',
    buyerPhone = '',
    buyerAddress = '',
    note = '',
    couponCode = '',
  } = req.body || {};

  if (!sellerId) throw createHttpError(400, 'sellerId is required.');
  if (!orderId) throw createHttpError(400, 'orderId is required.');
  if (!email) throw createHttpError(400, 'email is required.');

  const result = await createSellerOrderPaymentIntent({
    sellerId,
    orderId,
    customerEmail: email,
    amountNaira,
    callbackUrl,
    returnUrl,
    buyerName,
    buyerPhone,
    buyerAddress,
    note,
    couponCode,
  });

  return ok(res, {
    data: {
      reference: result.reference,
      plan: null,
      paystack: result.paystack,
      sellerId,
      orderId,
    },
  }, 201);
}));

router.get('/paystack/verify/:reference', asyncHandler(async (req, res) => {
  const { reference } = req.params;

  if (!reference) {
    throw createHttpError(400, 'Reference is required.');
  }

  const verificationResponse = await verifyPaystackTransaction(reference);
  const verificationData = verificationResponse.data || {};
  const result = await applySellerOrderPayment({
    reference,
    verificationData,
    source: 'verify',
  });

  return ok(res, {
    data: {
      verification: verificationData,
      result,
      order: await getSellerOrderByReference(reference),
    },
  });
}));

// Called by Blorbmart's webhook when it receives a live-mode Paystack event
// tagged metadata.app === 'blorbify' with purpose 'seller_order_payment' —
// Blorbmart owns the only registered live webhook, so it relays here.
router.post('/paystack/relay', requireRelaySecret, asyncHandler(async (req, res) => {
  const reference = req.body?.reference;

  if (!reference) {
    throw createHttpError(400, 'reference is required.');
  }

  const verificationResponse = await verifyPaystackTransaction(reference);
  const verificationData = verificationResponse.data || {};
  const result = await applySellerOrderPayment({
    reference,
    verificationData,
    source: 'webhook-relay',
  });

  return ok(res, {
    data: {
      verification: verificationData,
      result,
    },
  });
}));

router.get('/:sellerId/ledger.csv', requireAuth, asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { from, to } = req.query;

  if (req.user?.uid !== sellerId) {
    throw createHttpError(403, 'You can only export your own ledger.');
  }

  const startAt = from ? new Date(from) : null;
  const endAt = to ? new Date(to) : null;

  // Single equality filter on sellerId only — date range is applied in memory so
  // this never needs a composite Firestore index (see computeSellerLedgerTotals).
  const snapshot = await adminDb.collection('sellerLedgers').where('sellerId', '==', sellerId).get();
  const rows = snapshot.docs
    .map((doc) => doc.data())
    .filter((entry) => {
      const createdAt = entry.createdAt?.toDate ? entry.createdAt.toDate() : null;
      if (startAt && createdAt && createdAt < startAt) return false;
      if (endAt && createdAt && createdAt >= endAt) return false;
      return true;
    })
    .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

  const csv = toCsv(
    rows.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt?.toDate ? entry.createdAt.toDate().toISOString() : '',
    })),
    [
      { key: 'createdAt', header: 'Date' },
      { key: 'type', header: 'Type' },
      { key: 'reference', header: 'Reference' },
      { key: 'orderId', header: 'Order ID' },
      { key: 'grossAmount', header: 'Gross amount (kobo)' },
      { key: 'sellerNetAmount', header: 'Net amount (kobo)' },
      { key: 'currency', header: 'Currency' },
      { key: 'status', header: 'Status' },
      { key: 'reason', header: 'Reason' },
    ]
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ledger.csv"');
  res.send(csv);
}));

export default router;
