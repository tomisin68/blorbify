import crypto from 'node:crypto';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { getSubscriptionPlan, subscriptionPlans } from '../services/planCatalog.js';
import { createPendingSubscriptionIntent, applyVerifiedPayment } from '../services/billing.service.js';
import { initializePaystackTransaction, verifyPaystackTransaction } from '../config/paystack.js';

function createReference(prefix = 'sub') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export const listPlans = asyncHandler(async (req, res) => {
  return ok(res, { data: { plans: subscriptionPlans } });
});

export const initializeSubscriptionPayment = asyncHandler(async (req, res) => {
  const {
    userId,
    email,
    firstName = '',
    lastName = '',
    planId,
    callbackUrl = '',
    returnUrl = '',
  } = req.body || {};

  if (!userId) {
    throw createHttpError(400, 'userId is required.');
  }

  if (!email) {
    throw createHttpError(400, 'email is required.');
  }

  if (!planId) {
    throw createHttpError(400, 'planId is required.');
  }

  const plan = getSubscriptionPlan(planId);
  if (!plan) {
    throw createHttpError(404, `Unknown subscription plan: ${planId}`);
  }

  const reference = createReference('plan');
  const metadata = {
    purpose: 'store_owner_subscription',
    userId,
    planId: plan.id,
    planName: plan.name,
    amountNaira: plan.amountNaira,
    email,
    returnUrl,
  };

  await createPendingSubscriptionIntent({
    userId,
    email,
    firstName,
    lastName,
    plan,
    reference,
    callbackUrl,
    metadata,
  });

  const paystackResponse = await initializePaystackTransaction({
    email,
    amount: plan.amountNaira * 100,
    reference,
      callback_url: callbackUrl || undefined,
      metadata,
    });

  return ok(res, {
    data: {
      plan,
      reference: paystackResponse.data?.reference || reference,
      accessCode: paystackResponse.data?.access_code || '',
      authorizationUrl: paystackResponse.data?.authorization_url || '',
    },
  }, 201);
});

export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  const reference = req.params.reference || req.query.reference;

  if (!reference) {
    throw createHttpError(400, 'Payment reference is required.');
  }

  const verificationResponse = await verifyPaystackTransaction(reference);
  const verificationData = verificationResponse.data || {};
  const result = await applyVerifiedPayment({
    reference,
    verificationData,
    source: 'verify',
  });

  return ok(res, {
    data: {
      verification: verificationData,
      result,
    },
  });
});
