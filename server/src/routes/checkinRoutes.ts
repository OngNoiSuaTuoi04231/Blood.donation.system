import { Router } from 'express';
import { checkIn, getEventCheckIns } from '../controllers/checkinController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Admin or medical staff can check in
router.post('/', authenticate, authorize('admin', 'medical_staff'), checkIn);
router.get('/event/:eventId', authenticate, authorize('admin', 'medical_staff'), getEventCheckIns);

export default router;
