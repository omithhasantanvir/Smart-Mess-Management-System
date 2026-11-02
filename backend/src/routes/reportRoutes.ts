import { Router } from 'express';
import { exportMonthlySettlementExcel } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/settlement/excel', exportMonthlySettlementExcel);

export default router;

