import { asyncHandler } from '../middleware/asyncHandler.js';
import { ok } from '../utils/response.js';
import {
  createAndSendInvoice,
  getInvoicePdfBuffer,
  resendInvoice,
  setInvoiceStatus,
} from '../services/invoice.service.js';

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await createAndSendInvoice(req.user.uid, req.body || {});
  return ok(res, { data: invoice }, 201);
});

export const resendInvoiceHandler = asyncHandler(async (req, res) => {
  const result = await resendInvoice(req.params.invoiceId, req.user.uid);
  return ok(res, { data: result });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const pdf = await getInvoicePdfBuffer(req.params.invoiceId, req.user.uid);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.invoiceId}.pdf"`);
  res.send(pdf);
});

export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const result = await setInvoiceStatus(req.params.invoiceId, req.user.uid, req.body?.status);
  return ok(res, { data: result });
});
