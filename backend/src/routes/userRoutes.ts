import { Router } from 'express';
import { getUsers, updateUserRole, resetPassword } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/reset-password', resetPassword);

export default router;

