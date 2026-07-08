import crypto from 'node:crypto';
import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { initializePaystackTransaction } from '../config/paystack.js';
import { getSellerPayoutProfile } from './sellerPayout.service.js';
import { sendSellerOrderReceiptEmail } from './receipt.service.js';
import { deliverDigitalItems, resolveDigitalDeliveryItems } from './digitalDelivery.service.js';

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

// Validates a coupon against the seller's own `stores/{sellerId}.coupons` map and
// atomically increments its usage count within the same transaction as the read,
// so two concurrent checkouts can't both slip through under a usage limit.
// Known, accepted tradeoff: a checkout that's initialized here but never actually
// paid for still consumes a use — not worth a two-phase reserve/release scheme
// for this scale.
async function validateAndApplyCoupon(sellerId, rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { discountAmount: 0, couponCode: '' };

  const storeRef = adminDb.collection('stores').doc(sellerId);

  const discountAmount = await adminDb.runTransaction(async (transaction) => {
    const storeSnap = await transaction.get(storeRef);
    const coupons = storeSnap.exists ? storeSnap.data().coupons || {} : {};
    const coupon = coupons[code];

    if (!coupon || !coupon.active) {
      throw createHttpError(400, 'This coupon code is not valid.');
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      throw createHttpError(400, 'This coupon code has expired.');
    }

    const usageCount = toNumber(coupon.usageCount, 0);
    const usageLimit = coupon.usageLimit ? toNumber(coupon.usageLimit) : null;
    if (usageLimit && usageCount >= usageLimit) {
      throw createHttpError(400, 'This coupon code has reached its usage limit.');
    }

    const value = toNumber(coupon.value, 0);
    const rawDiscount = coupon.type === 'percent' ? (subtotal * value) / 100 : value;
    const discount = Math.round(Math.max(0, Math.min(rawDiscount, subtotal)));

    transaction.update(storeRef, {
      [`coupons.${code}.usageCount`]: fieldValue.increment(1),
    });

    return discount;
  });

  return { discountAmount, couponCode: code };
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
  couponCode = '',
}) {
  if (!sellerId) throw createHttpError(400, 'sellerId is required.');
  if (!orderId) throw createHttpError(400, 'orderId is required.');

  const sellerProfile = await getSellerPayoutProfile(sellerId);
  if (!sellerProfile?.subaccountCode) {
    throw createHttpError(404, 'Seller payout profile is missing a Paystack subaccount.');
  }

  // Recompute the charge from the order doc the buyer already created client-side
  // (Storefront.jsx writes it before calling this endpoint) rather than trusting
  // the client-supplied amountNaira outright — otherwise a coupon param would be
  // pointless, since a buyer could just send a manually reduced amount instead.
  // Note: item *prices* inside that order doc are still client-supplied at
  // creation time — fully closing that would mean re-validating every item price
  // against `stores/{sellerId}.products` too, which is out of scope here.
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  let amount;
  let discountAmount = 0;
  let appliedCouponCode = '';

  if (orderSnap.exists) {
    const orderData = orderSnap.data();
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const subtotal = items.reduce(
      (sum, item) => sum + toNumber(item.subtotal, toNumber(item.price) * toNumber(item.quantity, 1)),
      0
    );
    const orderDeliveryFee = toNumber(orderData.deliveryFee, 0);

    if (couponCode) {
      const result = await validateAndApplyCoupon(sellerId, couponCode, subtotal);
      discountAmount = result.discountAmount;
      appliedCouponCode = result.couponCode;
    }

    amount = Math.max(0, subtotal + orderDeliveryFee - discountAmount);

    await orderRef.set(
      {
        couponCode: appliedCouponCode,
        discountAmount,
        total: amount,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // Defensive fallback only — the order doc should already exist by the time
    // checkout calls this. Coupons aren't honored on this path since there's no
    // stored subtotal to validate a discount against.
    amount = toNumber(amountNaira);
  }

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

// Wrapped in a single transaction (rather than the previous read-then-write with
// three independent Promise.all writes) because recordSellerOrderRefund now also
// writes to the same sellerBalances doc — without a transaction, two concurrent
// calls for the same seller (a new sale and a refund, or two sales) can lose an
// increment/decrement.
export async function applySellerOrderPayment({ reference, verificationData, source = 'webhook' }) {
  const orderRef = adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference);

  const result = await adminDb.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

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
      transaction.set(
        orderRef,
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
      type: 'sale',
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
    const balanceSnap = await transaction.get(balanceRef);
    const currentBalance = toNumber(balanceSnap.exists ? balanceSnap.data()?.availableBalance : 0);
    const nextBalance = currentBalance + sellerNetAmount;

    transaction.set(orderRef, paymentUpdate, { merge: true });
    transaction.set(adminDb.collection(SELLER_LEDGER_COLLECTION).doc(reference), ledgerEntry, { merge: true });
    transaction.set(
      balanceRef,
      {
        sellerId,
        availableBalance: nextBalance,
        currency: ledgerEntry.currency,
        lastReference: reference,
        updatedAt: fieldValue.serverTimestamp(),
        createdAt: balanceSnap.exists ? balanceSnap.data()?.createdAt || fieldValue.serverTimestamp() : fieldValue.serverTimestamp(),
      },
      { merge: true }
    );

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
  });

  const orderIdForDelivery = result.order?.orderId || result.order?.metadata?.orderId;

  // Awaited (unlike the fire-and-forget block below) because the client-side
  // verify response is what the storefront's checkout-success screen reads to
  // show download links immediately — this is just two fast doc reads, no
  // email wait, so it doesn't meaningfully slow down the webhook/verify response.
  if (result.matched && orderIdForDelivery) {
    try {
      const orderSnap = await adminDb.collection('orders').doc(orderIdForDelivery).get();
      result.digitalDelivery = orderSnap.exists
        ? await resolveDigitalDeliveryItems({ order: orderSnap.data() })
        : [];
    } catch (error) {
      console.error('Digital delivery resolution failed:', error.message);
      result.digitalDelivery = [];
    }
  }

  // Fire-and-forget, outside the transaction, and only on the one caller that
  // actually flipped this order to paid — `matched && !alreadyProcessed` is the
  // same flag the transaction above already uses to guard against the three
  // call sites (webhook, callback, client verify) double-processing.
  if (result.matched && !result.alreadyProcessed) {
    sendSellerOrderReceiptEmail({
      orderId: orderIdForDelivery,
      sellerId: result.order.sellerId,
      paymentMethod: 'paystack',
      paymentReference: reference,
    }).catch((error) => {
      console.error('Seller order receipt email failed:', error.message);
    });

    if (orderIdForDelivery) {
      deliverDigitalItems({ orderId: orderIdForDelivery }).catch((error) => {
        console.error('Digital delivery failed:', error.message);
      });
    }
  }

  return result;
}

export async function getSellerOrderByReference(reference) {
  const snapshot = await adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

// Books a reversing ledger entry for a refund that was already issued out-of-band
// (e.g. manually via the Paystack dashboard) — this never calls a payment gateway
// itself, it only keeps the books accurate for a refund that already happened.
// A seller's recorded balance is allowed to go negative here (e.g. they'd already
// withdrawn funds outside the platform); that's surfaced by reconciliation rather
// than silently clamped, since clamping would misstate the ledger.
export async function recordSellerOrderRefund({
  reference,
  amountKobo,
  reason = '',
  recordedBy = '',
  refundId = '',
}) {
  const refundAmount = toNumber(amountKobo, 0);
  if (!reference) throw createHttpError(400, 'reference is required.');
  if (!refundAmount || refundAmount <= 0) {
    throw createHttpError(400, 'amountKobo must be greater than zero.');
  }

  const resolvedRefundId = String(refundId || crypto.randomUUID());
  const orderRef = adminDb.collection(SELLER_ORDERS_COLLECTION).doc(reference);
  const refundLedgerRef = adminDb
    .collection(SELLER_LEDGER_COLLECTION)
    .doc(`${reference}__refund__${resolvedRefundId}`);

  return adminDb.runTransaction(async (transaction) => {
    const [orderSnap, refundSnap] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(refundLedgerRef),
    ]);

    if (!orderSnap.exists) {
      throw createHttpError(404, `Seller order not found for reference ${reference}.`);
    }

    // Idempotent retry of the same refundId — already applied, don't double-count.
    if (refundSnap.exists) {
      return {
        success: true,
        alreadyProcessed: true,
        ledger: refundSnap.data(),
        order: (await orderRef.get()).data(),
        balance: null,
      };
    }

    const order = orderSnap.data();
    if (!['paid', 'partially_refunded'].includes(String(order.status || '').toLowerCase())) {
      throw createHttpError(409, `Order ${reference} is not in a refundable state (status: ${order.status}).`);
    }

    const existingRefundsSnap = await transaction.get(
      adminDb.collection(SELLER_LEDGER_COLLECTION).where('reference', '==', reference)
    );
    const amountAlreadyRefunded = existingRefundsSnap.docs.reduce((sum, doc) => {
      const data = doc.data();
      return data.type === 'refund' ? sum + Math.abs(toNumber(data.sellerNetAmount, 0)) : sum;
    }, 0);

    const orderAmountKobo = toNumber(order.amountKobo, 0);
    if (amountAlreadyRefunded + refundAmount > orderAmountKobo) {
      throw createHttpError(400, 'Refund would exceed the original payment amount.');
    }

    const sellerId = order.sellerId;
    if (!sellerId) {
      throw createHttpError(422, 'Unable to resolve seller for this order.');
    }

    const balanceRef = adminDb.collection(SELLER_BALANCES_COLLECTION).doc(sellerId);
    const balanceSnap = await transaction.get(balanceRef);
    const currentBalance = toNumber(balanceSnap.exists ? balanceSnap.data()?.availableBalance : 0);
    const nextBalance = currentBalance - refundAmount;

    const totalRefunded = amountAlreadyRefunded + refundAmount;
    const nextStatus = totalRefunded >= orderAmountKobo ? 'refunded' : 'partially_refunded';

    const ledgerEntry = {
      sellerId,
      reference,
      orderId: order.orderId || reference,
      type: 'refund',
      refundId: resolvedRefundId,
      grossAmount: -refundAmount,
      platformCommission: 0,
      sellerNetAmount: -refundAmount,
      currency: order.currency || 'NGN',
      source: 'admin',
      status: 'posted',
      reason,
      recordedBy,
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    };

    transaction.set(refundLedgerRef, ledgerEntry);
    transaction.set(
      orderRef,
      {
        status: nextStatus,
        refundedAmount: totalRefunded,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    transaction.set(
      balanceRef,
      {
        sellerId,
        availableBalance: nextBalance,
        currency: ledgerEntry.currency,
        lastReference: reference,
        updatedAt: fieldValue.serverTimestamp(),
        createdAt: balanceSnap.exists ? balanceSnap.data()?.createdAt || fieldValue.serverTimestamp() : fieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      alreadyProcessed: false,
      ledger: ledgerEntry,
      order: { ...order, status: nextStatus, refundedAmount: totalRefunded },
      balance: { previous: currentBalance, current: nextBalance },
    };
  });
}

// Sums a seller's ledger entries by type. Date range (if given) is filtered in
// memory rather than added as a second `where` clause — combining an equality
// filter (sellerId) with a range filter (createdAt) would need a composite
// Firestore index, which this project deliberately avoids (see cartSweep.service.js
// for the same tradeoff at a similar data scale).
export async function computeSellerLedgerTotals(sellerId, { startAt, endAt } = {}) {
  const snapshot = await adminDb
    .collection(SELLER_LEDGER_COLLECTION)
    .where('sellerId', '==', sellerId)
    .get();

  let grossSales = 0;
  let refundsTotal = 0;
  let orderCount = 0;
  let refundCount = 0;

  for (const doc of snapshot.docs) {
    const entry = doc.data();
    const createdAt = entry.createdAt?.toDate ? entry.createdAt.toDate() : null;
    if (startAt && createdAt && createdAt < startAt) continue;
    if (endAt && createdAt && createdAt >= endAt) continue;

    const netAmount = toNumber(entry.sellerNetAmount, 0);
    if (entry.type === 'refund') {
      refundsTotal += Math.abs(netAmount);
      refundCount += 1;
    } else if (entry.type === 'sale') {
      grossSales += netAmount;
      orderCount += 1;
    }
  }

  return {
    grossSales,
    refundsTotal,
    netRevenue: grossSales - refundsTotal,
    orderCount,
    refundCount,
  };
}

export async function reconcileSellerBalance(sellerId) {
  const [totals, balanceSnap] = await Promise.all([
    computeSellerLedgerTotals(sellerId),
    adminDb.collection(SELLER_BALANCES_COLLECTION).doc(sellerId).get(),
  ]);

  const storedBalance = toNumber(balanceSnap.exists ? balanceSnap.data()?.availableBalance : 0);
  const computedBalance = totals.netRevenue;
  const drift = Math.round((storedBalance - computedBalance) * 100) / 100;

  return {
    sellerId,
    computedBalance,
    storedBalance,
    drift,
    ok: drift === 0,
  };
}

export async function reconcileAllSellerBalances() {
  const balancesSnap = await adminDb.collection(SELLER_BALANCES_COLLECTION).get();
  const results = await Promise.all(balancesSnap.docs.map((doc) => reconcileSellerBalance(doc.id)));
  const flagged = results.filter((result) => !result.ok);

  return { results, flagged, checkedCount: results.length, flaggedCount: flagged.length };
}
