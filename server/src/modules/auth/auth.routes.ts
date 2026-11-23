import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/firebase-login', AuthController.firebaseLogin);
router.get('/me', requireAuth, AuthController.me);

// Super Admin User Approval Management
router.get('/pending-users', requireAuth, AuthController.getPendingUsers);
router.patch('/users/:id/approve', requireAuth, AuthController.approveUser);
router.patch('/users/:id/reject', requireAuth, AuthController.rejectUser);

export const authRoutes = router;
