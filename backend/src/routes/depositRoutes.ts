import { Router } from 'express';
import {
  getDeposits,
  createDeposit,
  updateDeposit,
  deleteDeposit
} from '../controllers/depositController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getDeposits);
router.post('/', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), createDeposit);
router.put('/:id', authorize('ADMIN', 'MANAGER'), upload.single('receipt'), updateDeposit);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteDeposit);

export default router;

