import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { initializePaystackTransaction } from '../config/paystack.js';
import { getSellerPayoutProfile } from './sellerPayout.service.js';

const SELLER_ORDERS_COLLECTION = 'sellerOrders';
const SELLER_LEDGER_COLLECTION = 'sellerLedgers';
const SELLER_BALANCES_COLLECTION = 'sellerBalances';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMetadata(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
}

function buildOrderReference(orderId) {
  return `ord_${String(orderId || 'blorbify')}_${Date.now()}`;
}

export async function createSellerOrderPaymentIntent({
  sellerId,
  orderId,
  customerEmail,
  amountNaira,
  callbackUrl = '',
  returnUrl = '',
  buyerName = '',
  buyerPhone = '',
  buyerAddress = '',
  note = '',
  currency = 'NGN',
}) {
  if (!sellerId) throw createHttpError(400, 'sellerId is required.');
  if (!orderId) throw createHttpError(400, 'orderId is required.');

  const sellerProfile = await getSellerPayoutProfile(sellerId);
  if (!sellerProfile?.subaccountCode) {
    throw createHttpError(404, 'Seller payout profile is missing a Paystack subaccount.');
  }

  const amount = toNumber(amountNaira);
  if (!amount || amount <= 0) {
    throw createHttpError(400, 'amountNaira must be greater than zero.');
  }

  const reference = buildOrderReference(orderId);
  const amountKobo = Math.round(amount * 100);
  // Sellers keep 100% of sales — Blorbify monetizes via platform/subscription
  // fees, not sales commission. No commission is deducted here.
  const platformCommission = 0;
  const sellerNetAmount = amountKobo;

  const orderDoc = {
    sellerId,
    sellerBusinessName: sellerProfile.businessName || '',
    sellerSubaccountCode: sellerProfile.subaccountCode,
    orderId,
    reference,
    amountNaira: amount,
    amountKobo,
    platformCommission,
    sellerNetAmount,
    currency,
    status: 'pending',
    paymentStatus: 'pending',
    customerEmail: customerEmail || '',
    buyerName: buyerName || '',
    buyerPhone: buyerPhone || '',
    buyerAddress: buyerAddress || '',
    note: note || '',
    returnUrl: returnUrl || '',
    metadata: {
      purpose: 'seller_order_payment',
      app: 'blorbify',
      sellerId,
      orderId,
      sellerSubaccountCode: sellerProfile.subaccountCode,
      amountNaira: amount,
      platformCommission,
      sellerNetAmount,
      currency,
      returnUrl: returnUrl || '',
    },
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  await adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference).set(orderDoc, { merge: true });

  const paystackResponse = await initializePaystackTransaction(
    {
      email: customerEmail,
      amount: amountKobo,
      reference,
      metadata: orderDoc.metadata,
      callback_url: callbackUrl || undefined,
      subaccount: sellerProfile.subaccountCode,
    }
  );

  if (!paystackResponse?.status) {
    throw createHttpError(400, paystackResponse?.message || 'Failed to initialize payment.');
  }

  await adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference).set(
    {
      accessCode: paystackResponse.data?.access_code || '',
      authorizationUrl: paystackResponse.data?.authorization_url || '',
      paymentStatus: 'initialized',
      updatedAt: fieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    reference,
    sellerProfile,
    order: orderDoc,
    paystack: paystackResponse.data || {},
  };
}

export async function applySellerOrderPayment({ reference, verificationData, source = 'webhook' }) {
  const orderRef = adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw createHttpError(404, `Seller order not found for reference ${reference}.`);
  }

  const order = orderSnap.data();
  const metadata = normalizeMetadata(order.metadata || verificationData.metadata);
  const status = String(verificationData.status || '').toLowerCase();
  const verifiedAmount = toNumber(verificationData.amount || 0);
  const expectedAmount = toNumber(order.amountKobo || 0);

  if (['paid', 'success', 'completed'].includes(String(order.paymentStatus || order.status || '').toLowerCase())) {
    return {
      success: true,
      matched: true,
      alreadyProcessed: true,
      order,
      ledger: null,
      balance: null,
    };
  }

  if (status !== 'success') {
    await orderRef.set(
      {
        paymentStatus: status,
        status,
        verificationSource: source,
        verificationData,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      matched: false,
      order: { ...order, status, paymentStatus: status },
    };
  }

  if (verifiedAmount !== expectedAmount) {
    throw createHttpError(422, 'Paystack amount mismatch for seller order.');
  }

  const sellerId = order.sellerId || metadata.sellerId;
  if (!sellerId) {
    throw createHttpError(422, 'Unable to resolve seller for this order payment.');
  }

  const paidAt = verificationData.paid_at || verificationData.paidAt || verificationData.created_at || new Date().toISOString();
  // Sellers keep 100% of sales — no commission is deducted here either.
  const platformCommission = 0;
  const sellerNetAmount = expectedAmount;

  const paymentUpdate = {
    status: 'paid',
    paymentStatus: 'paid',
    paidAt,
    paystackTransactionId: verificationData.id || null,
    paystackCustomerCode: verificationData.customer?.customer_code || '',
    authorizationCode: verificationData.authorization?.authorization_code || '',
    gatewayResponse: verificationData.gateway_response || '',
    verificationSource: source,
    verificationData,
    updatedAt: fieldValue.serverTimestamp(),
  };

  const ledgerEntry = {
    sellerId,
    reference,
    orderId: order.orderId || metadata.orderId || reference,
    grossAmount: expectedAmount,
    platformCommission,
    sellerNetAmount,
    currency: verificationData.currency || order.currency || 'NGN',
    source,
    status: 'posted',
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  const balanceRef = adminDb.collection(SELLER_BALANCES_COLLECTION).doc(sellerId);
  const balanceSnap = await balanceRef.get();
  const currentBalance = toNumber(balanceSnap.exists ? balanceSnap.data()?.availableBalance : 0);
  const nextBalance = currentBalance + sellerNetAmount;

  await Promise.all([
    orderRef.set(paymentUpdate, { merge: true }),
    adminDb.collection(SELLER_LEDGER_COLLECTION).doc(reference).set(ledgerEntry, { merge: true }),
    balanceRef.set(
      {
        sellerId,
        availableBalance: nextBalance,
        currency: ledgerEntry.currency,
        lastReference: reference,
        updatedAt: fieldValue.serverTimestamp(),
        createdAt: balanceSnap.exists ? balanceSnap.data()?.createdAt || fieldValue.serverTimestamp() : fieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  return {
    success: true,
    matched: true,
    order: { ...order, ...paymentUpdate },
    ledger: ledgerEntry,
    balance: {
      previous: currentBalance,
      current: nextBalance,
    },
  };
}

export async function getSellerOrderByReference(reference) {
  const snapshot = await adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}
