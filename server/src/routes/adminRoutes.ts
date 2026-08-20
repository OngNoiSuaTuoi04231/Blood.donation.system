import { Router } from 'express';
import {
  getDonors,
  getMedicalStaff,
  createMedicalStaff,
  updateMedicalStaff,
  deleteMedicalStaff,
  updateDonorStatus,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All admin routes require admin role
router.get('/donors', authenticate, requireAdmin, getDonors);
router.put('/donors/:id/status', authenticate, requireAdmin, updateDonorStatus);

router.get('/medical-staff', authenticate, requireAdmin, getMedicalStaff);
router.post('/medical-staff', authenticate, requireAdmin, createMedicalStaff);
router.put('/medical-staff/:id', authenticate, requireAdmin, updateMedicalStaff);
router.delete('/medical-staff/:id', authenticate, requireAdmin, deleteMedicalStaff);

export default router;
