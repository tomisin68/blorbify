import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { env } from '../config/env.js';
import { createHttpError } from '../utils/httpError.js';
import { createPaystackSubaccount, updatePaystackSubaccount } from '../config/paystack.js';

const SELLER_PAYOUT_COLLECTION = 'sellerPayoutProfiles';

function normalizeAccountNumber(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

function normalizeBankCode(value) {
  return String(value || '').trim();
}

function normalizePercent(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

export async function getSellerPayoutProfile(sellerId) {
  if (!sellerId) {
    throw createHttpError(400, 'sellerId is required.');
  }

  const snapshot = await adminDb.collection(SELLER_PAYOUT_COLLECTION).doc(sellerId).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function upsertSellerPayoutProfile({
  sellerId,
  businessName,
  bankCode,
  accountNumber,
  percentageCharge = env.blorbifyDefaultPlatformPercentage,
  description = '',
  primaryContactEmail = '',
  payload = {},
}) {
  if (!sellerId) {
    throw createHttpError(400, 'sellerId is required.');
  }

  const cleanBankCode = normalizeBankCode(bankCode);
  const cleanAccountNumber = normalizeAccountNumber(accountNumber);
  const cleanPercentageCharge = normalizePercent(percentageCharge, 0);

  if (!businessName?.trim()) {
    throw createHttpError(400, 'businessName is required.');
  }

  if (!cleanBankCode) {
    throw createHttpError(400, 'bankCode is required.');
  }

  if (!cleanAccountNumber) {
    throw createHttpError(400, 'accountNumber is required.');
  }

  let existingProfile = await getSellerPayoutProfile(sellerId);
  let paystackResult;

  if (existingProfile?.subaccountCode) {
    paystackResult = await updatePaystackSubaccount(existingProfile.subaccountCode, {
      business_name: businessName.trim(),
      bank_code: cleanBankCode,
      account_number: cleanAccountNumber,
      percentage_charge: cleanPercentageCharge,
      description,
      primary_contact_email: primaryContactEmail || undefined,
    });
  } else {
    paystackResult = await createPaystackSubaccount({
      business_name: businessName.trim(),
      bank_code: cleanBankCode,
      account_number: cleanAccountNumber,
      percentage_charge: cleanPercentageCharge,
      description,
      primary_contact_email: primaryContactEmail || undefined,
    });
  }

  const paystackData = paystackResult?.data || paystackResult || {};
  const nextProfile = {
    sellerId,
    businessName: businessName.trim(),
    bankCode: cleanBankCode,
    accountNumber: cleanAccountNumber,
    percentageCharge: cleanPercentageCharge,
    description: description || '',
    primaryContactEmail: primaryContactEmail || '',
    subaccountCode: paystackData.subaccount_code || paystackData.subaccountCode || existingProfile?.subaccountCode || '',
    settlementBank: paystackData.settlement_bank || existingProfile?.settlementBank || '',
    accountName: paystackData.account_name || existingProfile?.accountName || '',
    currency: paystackData.currency || 'NGN',
    paystackDomain: paystackData.domain || existingProfile?.paystackDomain || '',
    paystackIntegration: paystackData.integration || existingProfile?.paystackIntegration || null,
    status: paystackData.active === false ? 'inactive' : 'active',
    rawPaystackData: paystackData,
    source: 'blorbify',
    updatedAt: fieldValue.serverTimestamp(),
    createdAt: existingProfile?.createdAt || fieldValue.serverTimestamp(),
    ...payload,
  };

  await adminDb.collection(SELLER_PAYOUT_COLLECTION).doc(sellerId).set(nextProfile, { merge: true });
  return nextProfile;
}
