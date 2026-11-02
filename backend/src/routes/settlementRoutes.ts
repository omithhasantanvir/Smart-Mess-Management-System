import { Router } from 'express';
import {
  getMonthlySettlementData,
  closeMonth,
  reopenMonth,
  getMemberStatement
} from '../controllers/settlementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getMonthlySettlementData);
router.get('/member-statement', getMemberStatement);
router.post('/close', authorize('ADMIN', 'MANAGER'), closeMonth);
router.post('/reopen', authorize('ADMIN'), reopenMonth);

export default router;

