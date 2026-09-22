import { Router } from 'express';
import { register, login, getMe, updateMe, resetPassword, checkEmail } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

export default router;
