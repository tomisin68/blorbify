import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { sendSellerRangeReportEmail } from '../services/monthlyReport.service.js';

export const requestFinancialReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body || {};
  if (!startDate || !endDate) {
    throw createHttpError(400, 'startDate and endDate are required.');
  }

  const startAt = new Date(startDate);
  const endAt = new Date(endDate);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
    throw createHttpError(400, 'startDate must be a valid date before endDate.');
  }

  const rangeLabel = `${startAt.toLocaleDateString('en-NG')} – ${endAt.toLocaleDateString('en-NG')}`;
  const result = await sendSellerRangeReportEmail(req.user.uid, {
    startAt,
    endAt,
    toEmail: req.user.email || '',
    rangeLabel,
  });

  return ok(res, { data: result });
});
