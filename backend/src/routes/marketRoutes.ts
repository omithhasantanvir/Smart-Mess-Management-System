import { Router } from 'express';
import {
  getMarketTransactions,
  createMarketTransaction,
  updateMarketTransaction,
  deleteMarketTransaction,
  getMarketSummary
} from '../controllers/marketController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getMarketTransactions);
router.get('/summary', getMarketSummary);
router.post('/', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), createMarketTransaction);
router.put('/:id', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), updateMarketTransaction);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteMarketTransaction);

export default router;

