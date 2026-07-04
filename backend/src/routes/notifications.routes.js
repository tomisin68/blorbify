import { Router } from 'express';
import {
  queueOrderNotice,
  queueWelcomeNotice,
  sendWelcomeEmail,
} from '../controllers/notifications.controller.js';

const router = Router();

router.post('/welcome', queueWelcomeNotice);
router.post('/welcome/send', sendWelcomeEmail);
router.post('/orders', queueOrderNotice);

export default router;
