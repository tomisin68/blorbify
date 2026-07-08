import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendEmailChangeOtp,
  confirmEmailChange,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/otp/send', requireAuth, sendEmailOtp);
router.post('/otp/verify', requireAuth, verifyEmailOtp);
router.post('/email-change/send', requireAuth, sendEmailChangeOtp);
router.post('/email-change/confirm', requireAuth, confirmEmailChange);

export default router;
