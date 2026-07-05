import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendEmailOtp, verifyEmailOtp } from '../controllers/auth.controller.js';

const router = Router();

router.post('/otp/send', requireAuth, sendEmailOtp);
router.post('/otp/verify', requireAuth, verifyEmailOtp);

export default router;
