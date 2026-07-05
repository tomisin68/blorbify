import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  queueOrderNotice,
  queueWelcomeNotice,
  sendLowStockAlert,
  sendOrderReceipt,
  sendOrderStatusUpdate,
  sendWelcomeEmail,
} from '../controllers/notifications.controller.js';

const router = Router();

router.post('/welcome', queueWelcomeNotice);
router.post('/welcome/send', sendWelcomeEmail);
router.post('/orders', queueOrderNotice);
router.post('/order-status', requireAuth, sendOrderStatusUpdate);
router.post('/orders/receipt', requireAuth, sendOrderReceipt);
router.post('/low-stock', requireAuth, sendLowStockAlert);

export default router;
