import { asyncHandler } from '../middleware/asyncHandler.js';
import { ok } from '../utils/response.js';
import {
  getAdminOverview,
  listPlatformNotifications,
  listPlatformOrders,
  listSellersOverview,
} from '../services/admin.service.js';

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
