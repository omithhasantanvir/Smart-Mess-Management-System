import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBuaCookBillHistory
} from '../controllers/expenseController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.get('/bua-bills', getBuaCookBillHistory);
router.post('/', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), createExpense);
router.put('/:id', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), updateExpense);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteExpense);

export default router;

