import { Router } from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from '../controllers/eventController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All authenticated users can view events
router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEvent);

// Admin only
router.post('/', authenticate, requireAdmin, createEvent);
router.put('/:id', authenticate, requireAdmin, updateEvent);
router.delete('/:id', authenticate, requireAdmin, deleteEvent);
router.patch('/:id/status', authenticate, requireAdmin, updateEventStatus);

export default router;
