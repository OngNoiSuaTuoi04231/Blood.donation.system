import { Router } from 'express';
import {
  getStatistics,
  getEventReport,
  exportEventReport,
  getGeneralReport,
  exportGeneralReport,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Statistics (admin, limited for medical)
router.get('/statistics', authenticate, authorize('admin', 'medical_staff'), getStatistics);

// Event report
router.get('/event/:eventId', authenticate, authorize('admin', 'medical_staff'), getEventReport);
router.get('/event/:eventId/export', authenticate, authorize('admin'), exportEventReport);

// General report
router.get('/general', authenticate, authorize('admin', 'medical_staff'), getGeneralReport);
router.get('/general/export', authenticate, authorize('admin'), exportGeneralReport);

export default router;
