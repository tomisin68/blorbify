import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdminEmail } from '../middleware/adminAuth.js';
import { getNotifications, getOrders, getOverview, getSellers } from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdminEmail);

router.get('/overview', getOverview);
router.get('/sellers', getSellers);
router.get('/orders', getOrders);
router.get('/notifications', getNotifications);

export default router;
