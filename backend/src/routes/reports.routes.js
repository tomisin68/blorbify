import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requestFinancialReport } from '../controllers/reports.controller.js';

const router = Router();

router.post('/financial', requireAuth, requestFinancialReport);

export default router;
