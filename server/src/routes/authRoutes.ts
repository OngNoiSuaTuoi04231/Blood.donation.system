import { Router } from 'express';
import { register, login, getMe, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

export default router;
