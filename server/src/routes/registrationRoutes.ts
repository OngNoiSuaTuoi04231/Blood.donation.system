import { Router } from 'express';
import {
  createRegistration,
  getMyRegistrations,
  getRegistration,
  getAllRegistrations,
  updateRegistration,
  cancelRegistration,
} from '../controllers/registrationController';
import { authenticate, authorize, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Donor creates registration
router.post('/', authenticate, authorize('donor'), createRegistration);

// Donor views own registrations
router.get('/my', authenticate, authorize('donor'), getMyRegistrations);

// Admin/medical view all registrations
router.get('/', authenticate, authorize('admin', 'medical_staff'), getAllRegistrations);

// View single registration (donors: own only, admin/medical: any)
router.get('/:id', authenticate, getRegistration);

// Admin updates registration
router.put('/:id', authenticate, requireAdmin, updateRegistration);

// Cancel registration (donor: own, admin: any)
router.delete('/:id', authenticate, cancelRegistration);

export default router;
