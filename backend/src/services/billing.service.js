import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';
import { getSubscriptionPlan, subscriptionPlans } from './planCatalog.js';
import { queueWelcomeNotification } from './notification.service.js';

function normalizeMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  return metadata;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function planDurationDays(plan) {
  return plan?.interval === 'yearly' ? 365 : 30;
}

export async function createPendingSubscriptionIntent({ userId, email, firstName, lastName, plan, reference, callbackUrl, returnUrl, metadata }) {
  const subscriptionDoc = {
    userId,
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    planId: plan.id,
    planName: plan.name,
    amountNaira: plan.amountNaira,
    amountKobo: plan.amountNaira * 100,
    interval: plan.interval,
    status: 'pending',
    paymentStatus: 'pending',
    reference,
    callbackUrl: callbackUrl || '',
    returnUrl: returnUrl || '',
    metadata: metadata || {},
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  const transactionDoc = {
    reference,
    purpose: 'store_owner_subscription',
    userId,
    email,
    planId: plan.id,
    planName: plan.name,
    amountNaira: plan.amountNaira,
    amountKobo: plan.amountNaira * 100,
    currency: 'NGN',
    status: 'pending',
    paymentStatus: 'initialized',
    metadata: metadata || {},
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  await Promise.all([
    adminDb.collection('billingSubscriptions').doc(userId).set(subscriptionDoc, { merge: true }),
    adminDb.collection('billingTransactions').doc(reference).set(transactionDoc, { merge: true }),
    adminDb.collection('users').doc(userId).set(
      {
        billing: {
          planId: plan.id,
          planName: plan.name,
          status: 'pending',
          reference,
        },
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  return { subscriptionDoc, transactionDoc };
}

export async function applyVerifiedPayment({ reference, verificationData, source = 'verify' }) {
  const transactionRef = adminDb.collection('billingTransactions').doc(reference);
  const transactionSnap = await transactionRef.get();

  if (!transactionSnap.exists) {
    throw createHttpError(404, `No billing transaction was found for reference ${reference}.`);
  }

  const transaction = transactionSnap.data();
  const metadata = normalizeMetadata(transaction.metadata || verificationData.metadata);
  const plan = getSubscriptionPlan(transaction.planId || metadata.planId);

  if (!plan) {
    throw createHttpError(422, 'Subscription plan could not be resolved for this payment.');
  }

  const status = String(verificationData.status || '').toLowerCase();
  const verifiedAmount = Number(verificationData.amount || 0);
  const expectedAmount = Number(transaction.amountKobo || plan.amountNaira * 100);

  if (['paid', 'success', 'completed', 'active'].includes(String(transaction.paymentStatus || transaction.status || '').toLowerCase())) {
    return {
      transaction,
      subscription: transaction,
      user: null,
      matched: true,
      alreadyProcessed: true,
    };
  }

  if (status !== 'success') {
    await transactionRef.set(
      {
        status,
        paymentStatus: status,
        gatewayResponse: verificationData.gateway_response || '',
        verificationSource: source,
        verificationPayload: verificationData,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      transaction: { ...transaction, status },
      subscription: null,
      user: null,
      matched: false,
    };
  }

  if (verifiedAmount !== expectedAmount) {
    throw createHttpError(422, 'Paystack amount mismatch. Refusing to activate the subscription.');
  }

  const paidAt = toDate(verificationData.paid_at || verificationData.paidAt || verificationData.created_at);
  const activationDate = paidAt || new Date();
  const expiresAt = addDays(activationDate, planDurationDays(plan));
  const userId = transaction.userId || metadata.userId;

  if (!userId) {
    throw createHttpError(422, 'Unable to resolve the owner account for this payment.');
  }

  const subscriptionUpdate = {
    userId,
    email: transaction.email || verificationData.customer?.email || '',
    planId: plan.id,
    planName: plan.name,
    amountNaira: plan.amountNaira,
    amountKobo: expectedAmount,
    interval: plan.interval,
    status: 'active',
    paymentStatus: 'paid',
    reference,
    paystackTransactionId: verificationData.id || null,
    paystackCustomerCode: verificationData.customer?.customer_code || '',
    authorizationCode: verificationData.authorization?.authorization_code || '',
    gatewayResponse: verificationData.gateway_response || '',
    paidAt: paidAt ? paidAt.toISOString() : null,
    startsAt: activationDate.toISOString(),
    endsAt: expiresAt.toISOString(),
    verificationSource: source,
    verificationPayload: verificationData,
    updatedAt: fieldValue.serverTimestamp(),
  };

  const userUpdate = {
    subscription: {
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      reference,
      amountNaira: plan.amountNaira,
      amountKobo: expectedAmount,
      startsAt: subscriptionUpdate.startsAt,
      endsAt: subscriptionUpdate.endsAt,
    },
    billing: {
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      reference,
    },
    updatedAt: fieldValue.serverTimestamp(),
  };

  const transactionUpdate = {
    status: 'success',
    paymentStatus: 'paid',
    gatewayResponse: verificationData.gateway_response || '',
    paystackTransactionId: verificationData.id || null,
    paystackCustomerCode: verificationData.customer?.customer_code || '',
    authorizationCode: verificationData.authorization?.authorization_code || '',
    paidAt: paidAt ? paidAt.toISOString() : null,
    verificationSource: source,
    verificationPayload: verificationData,
    updatedAt: fieldValue.serverTimestamp(),
  };

  const subscriptionRef = adminDb.collection('billingSubscriptions').doc(userId);
  const userRef = adminDb.collection('users').doc(userId);

  await Promise.all([
    transactionRef.set(transactionUpdate, { merge: true }),
    subscriptionRef.set(subscriptionUpdate, { merge: true }),
    userRef.set(userUpdate, { merge: true }),
  ]);

  const userSnap = await userRef.get();
  const user = userSnap.exists ? userSnap.data() : {};

  await queueWelcomeNotification({
    user: {
      userId,
      email: user.email || transaction.email || '',
      firstName: user.firstName || transaction.firstName || '',
      lastName: user.lastName || transaction.lastName || '',
    },
    subscription: {
      id: userId,
      planName: plan.name,
    },
  });

  return {
    transaction: { ...transaction, ...transactionUpdate },
    subscription: subscriptionUpdate,
    user: userUpdate,
    matched: true,
  };
}

export async function applyManualActivation({ userId, planId, activatedByEmail }) {
  const plan = getSubscriptionPlan(planId);

  if (!plan) {
    throw createHttpError(422, `Unknown plan "${planId}".`);
  }

  const reference = `admin-override-${Date.now()}`;
  const activationDate = new Date();
  const expiresAt = addDays(activationDate, planDurationDays(plan));

  const subscriptionUpdate = {
    userId,
    planId: plan.id,
    planName: plan.name,
    amountNaira: plan.amountNaira,
    amountKobo: plan.amountNaira * 100,
    interval: plan.interval,
    status: 'active',
    paymentStatus: 'manual',
    reference,
    activatedBy: 'admin',
    activatedByEmail: activatedByEmail || '',
    startsAt: activationDate.toISOString(),
    endsAt: expiresAt.toISOString(),
    updatedAt: fieldValue.serverTimestamp(),
  };

  const userUpdate = {
    subscription: {
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      reference,
      amountNaira: plan.amountNaira,
      amountKobo: plan.amountNaira * 100,
      startsAt: subscriptionUpdate.startsAt,
      endsAt: subscriptionUpdate.endsAt,
      activatedBy: 'admin',
    },
    billing: {
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      reference,
    },
    updatedAt: fieldValue.serverTimestamp(),
  };

  const subscriptionRef = adminDb.collection('billingSubscriptions').doc(userId);
  const userRef = adminDb.collection('users').doc(userId);

  await Promise.all([
    subscriptionRef.set(subscriptionUpdate, { merge: true }),
    userRef.set(userUpdate, { merge: true }),
  ]);

  return { subscription: subscriptionUpdate, user: userUpdate };
}

export async function getSubscriptionByUserId(userId) {
  const snapshot = await adminDb.collection('billingSubscriptions').doc(userId).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listSubscriptionPlans() {
  return subscriptionPlans;
}
