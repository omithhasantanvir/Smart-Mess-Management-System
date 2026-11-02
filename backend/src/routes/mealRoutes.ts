import { Router } from 'express';
import {
  getDailyMeals,
  bulkSaveDailyMeals,
  getMonthlyMeals
} from '../controllers/mealController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/daily', getDailyMeals);
router.get('/monthly', getMonthlyMeals);
router.post('/daily/bulk', authorize('ADMIN', 'MANAGER'), bulkSaveDailyMeals);

export default router;

