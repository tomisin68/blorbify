import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdminEmail } from '../middleware/adminAuth.js';
import {
  getNotifications,
  getOrders,
  getOverview,
  getSellers,
  getSupportConversations,
  getSupportMessagesForConversation,
  postMarkSellerPaid,
  postSupportReply,
  postSupportRead,
} from '../controllers/admin.controller.js';
import {
  getLogisticsCompanies,
  postLogisticsCompany,
  putLogisticsCompany,
  removeLogisticsCompany,
} from '../controllers/logistics.controller.js';

const router = Router();

router.use(requireAuth, requireAdminEmail);

router.get('/overview', getOverview);
router.get('/sellers', getSellers);
router.post('/sellers/:sellerId/mark-paid', postMarkSellerPaid);
router.get('/orders', getOrders);
router.get('/notifications', getNotifications);
router.get('/support/conversations', getSupportConversations);
router.get('/support/conversations/:sellerId/messages', getSupportMessagesForConversation);
router.post('/support/conversations/:sellerId/messages', postSupportReply);
router.post('/support/conversations/:sellerId/read', postSupportRead);
router.get('/logistics-companies', getLogisticsCompanies);
router.post('/logistics-companies', postLogisticsCompany);
router.put('/logistics-companies/:companyId', putLogisticsCompany);
router.delete('/logistics-companies/:companyId', removeLogisticsCompany);

export default router;
