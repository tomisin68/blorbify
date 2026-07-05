import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createInvoice,
  downloadInvoicePdf,
  resendInvoiceHandler,
  updateInvoiceStatus,
} from '../controllers/invoices.controller.js';

const router = Router();

router.post('/', requireAuth, createInvoice);
router.post('/:invoiceId/resend', requireAuth, resendInvoiceHandler);
router.get('/:invoiceId/pdf', requireAuth, downloadInvoicePdf);
router.patch('/:invoiceId/status', requireAuth, updateInvoiceStatus);

export default router;
