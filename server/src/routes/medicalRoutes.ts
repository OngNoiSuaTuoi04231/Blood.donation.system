import { Router } from 'express';
import {
  getMedicalRegistrations,
  getMedicalRegistration,
  performScreening,
  updateScreening,
  completeDonation,
} from '../controllers/medicalController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Medical staff and admin can view
router.get('/registrations', authenticate, authorize('admin', 'medical_staff'), getMedicalRegistrations);
router.get('/registrations/:id', authenticate, authorize('admin', 'medical_staff'), getMedicalRegistration);

// Medical staff performs screening
router.post('/screening/:registrationId', authenticate, authorize('medical_staff', 'admin'), performScreening);
router.put('/screening/:registrationId', authenticate, authorize('medical_staff', 'admin'), updateScreening);
// Bước cuối sau khi người hiến thực tế đã hiến máu tại điểm tiếp nhận.
router.post('/complete-donation/:registrationId', authenticate, authorize('medical_staff', 'admin'), completeDonation);

export default router;
