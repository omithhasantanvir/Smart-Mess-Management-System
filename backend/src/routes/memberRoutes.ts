import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from '../controllers/memberController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', authorize('ADMIN', 'MANAGER'), createMember);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateMember);
router.delete('/:id', authorize('ADMIN'), deleteMember);

export default router;

