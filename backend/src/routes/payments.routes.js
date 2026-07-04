import { Router } from 'express';
import {
  initializeSubscriptionPayment,
  listPlans,
  verifySubscriptionPayment,
} from '../controllers/payments.controller.js';

const router = Router();

router.get('/plans', listPlans);
router.post('/subscriptions/initialize', initializeSubscriptionPayment);
router.get('/subscriptions/verify/:reference', verifySubscriptionPayment);

export default router;
