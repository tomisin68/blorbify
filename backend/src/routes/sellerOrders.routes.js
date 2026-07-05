import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import {
  applySellerOrderPayment,
  createSellerOrderPaymentIntent,
  getSellerOrderByReference,
} from '../services/sellerOrder.service.js';
import { verifyPaystackTransaction } from '../config/paystack.js';

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

export default router;
