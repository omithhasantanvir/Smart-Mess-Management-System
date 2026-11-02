import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);

export default router;

