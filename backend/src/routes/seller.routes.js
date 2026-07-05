import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { getSellerPayoutProfile, upsertSellerPayoutProfile } from '../services/sellerPayout.service.js';
import { listPaystackBanks } from '../config/paystack.js';

const router = Router();

router.get('/banks', async (req, res) => {
  try {
    const response = await listPaystackBanks();
    const banks = (response?.data || [])
      .map((bank) => ({ name: bank.name, code: bank.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return ok(res, { data: { banks } });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to load bank list.',
    });
  }
});

router.post('/:sellerId/subaccount', requireAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      businessName,
      bankCode,
      accountNumber,
      description = '',
      primaryContactEmail = '',
    } = req.body || {};

    if (req.user?.uid !== sellerId) {
      throw createHttpError(403, 'You can only create a subaccount for your own seller profile.');
    }

    const profile = await upsertSellerPayoutProfile({
      sellerId,
      businessName,
      bankCode,
      accountNumber,
      description,
      primaryContactEmail: primaryContactEmail || req.user?.email || '',
      payload: {
        createdBy: req.user?.uid || sellerId,
      },
    });

    return ok(res, { data: { profile } }, 201);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to create seller subaccount.',
    });
  }
});

router.get('/:sellerId/subaccount', requireAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (req.user?.uid !== sellerId) {
      throw createHttpError(403, 'You can only view your own seller profile.');
    }

    const profile = await getSellerPayoutProfile(sellerId);
    return ok(res, { data: { profile } });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to load seller subaccount.',
    });
  }
});

export default router;
