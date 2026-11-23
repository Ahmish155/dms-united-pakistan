import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/firebase-login', AuthController.firebaseLogin);
router.get('/me', requireAuth, AuthController.me);

export const authRoutes = router;
