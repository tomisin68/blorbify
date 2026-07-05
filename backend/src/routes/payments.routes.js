import { Router } from 'express';
import {
  initializeSubscriptionPayment,
  listPlans,
  relaySubscriptionPayment,
  verifySubscriptionPayment,
} from '../controllers/payments.controller.js';
import { requireRelaySecret } from '../middleware/relayAuth.js';

const router = Router();

router.get('/plans', listPlans);
router.post('/subscriptions/initialize', initializeSubscriptionPayment);
router.get('/subscriptions/verify/:reference', verifySubscriptionPayment);
router.post('/subscriptions/relay', requireRelaySecret, relaySubscriptionPayment);

export default router;
