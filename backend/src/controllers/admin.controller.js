import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import {
  getAdminOverview,
  listPlatformNotifications,
  listPlatformOrders,
  listSellersOverview,
} from '../services/admin.service.js';
import { applyManualActivation } from '../services/billing.service.js';
import {
  getSupportMessages,
  listSupportConversations,
  markConversationReadByAdmin,
  postAdminReply,
} from '../services/supportChat.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const data = await getAdminOverview();
  return ok(res, { data });
});

export const getSellers = asyncHandler(async (req, res) => {
  const data = await listSellersOverview();
  return ok(res, { data });
});

export const getOrders = asyncHandler(async (req, res) => {
  const limitCount = Math.min(Number(req.query.limit) || 100, 200);
  const data = await listPlatformOrders(limitCount);
  return ok(res, { data });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const limitCount = Math.min(Number(req.query.limit) || 50, 100);
  const data = await listPlatformNotifications(limitCount);
  return ok(res, { data });
});

export const getSupportConversations = asyncHandler(async (req, res) => {
  const data = await listSupportConversations();
  return ok(res, { data });
});

export const getSupportMessagesForConversation = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const data = await getSupportMessages(sellerId);
  return ok(res, { data });
});

export const postSupportReply = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const text = String(req.body?.text || '').trim();
  if (!text) {
    throw createHttpError(400, 'text is required.');
  }

  const data = await postAdminReply(sellerId, text, req.user?.email);
  return ok(res, { data });
});

export const postSupportRead = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  await markConversationReadByAdmin(sellerId);
  return ok(res, { data: { ok: true } });
});

export const postMarkSellerPaid = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const planId = String(req.body?.planId || '').trim();

  if (!planId) {
    throw createHttpError(400, 'planId is required.');
  }

  const data = await applyManualActivation({ userId: sellerId, planId, activatedByEmail: req.user?.email });
  return ok(res, { data });
});
