import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { verifyPaystackSignature } from '../config/paystack.js';
import { applyVerifiedPayment } from '../services/billing.service.js';
import { verifyPaystackTransaction } from '../config/paystack.js';
import { applySellerOrderPayment } from '../services/sellerOrder.service.js';

function parseRawJson(rawBody) {
  if (Buffer.isBuffer(rawBody)) {
    return JSON.parse(rawBody.toString('utf8') || '{}');
  }

  if (typeof rawBody === 'string') {
    return JSON.parse(rawBody || '{}');
  }

  return rawBody || {};
}

export const handlePaystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!verifyPaystackSignature(req.body, signature)) {
    throw createHttpError(401, 'Invalid Paystack webhook signature.');
  }

  const event = parseRawJson(req.body);
  const reference = event?.data?.reference;

  if (!reference) {
    return ok(res, { data: { received: true, processed: false, reason: 'missing reference' } });
  }

  const verificationResponse = await verifyPaystackTransaction(reference);
  const verificationData = verificationResponse.data || {};
  const metadata = verificationData.metadata || {};

  if (String(verificationData.status || '').toLowerCase() === 'success') {
    if (metadata?.purpose === 'seller_order_payment') {
      await applySellerOrderPayment({
        reference,
        verificationData,
        source: 'webhook',
      });
    } else {
      await applyVerifiedPayment({
        reference,
        verificationData,
        source: 'webhook',
      });
    }
  }

  return ok(res, {
    data: {
      received: true,
      processed: true,
      event: event.event || 'unknown',
      reference,
    },
  });
});
