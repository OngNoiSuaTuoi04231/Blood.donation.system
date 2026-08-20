import { Request, Response } from 'express';
import BloodDonationEvent from '../models/BloodDonationEvent';
import Registration from '../models/Registration';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/events
 * Get all events (public for all authenticated users)
 */
export const getEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await BloodDonationEvent.find()
      .populate('createdBy', 'fullName')
      .sort({ startDate: -1 });

    // Attach registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          registrationStatus: { $nin: ['cancelled', 'rejected'] },
        });
        return {
          ...event.toObject(),
          registrationCount,
        };
      })
    );

    sendSuccess(res, eventsWithCounts);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch events', 500);
  }
};

/**
 * GET /api/events/:id
 * Get single event detail
 */
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await BloodDonationEvent.findById(req.params.id)
      .populate('createdBy', 'fullName');

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    const registrationCount = await Registration.countDocuments({
      eventId: event._id,
      registrationStatus: { $nin: ['cancelled', 'rejected'] },
    });

    sendSuccess(res, { ...event.toObject(), registrationCount });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch event', 500);
  }
};

/**
 * POST /api/events
 * Create new event (admin only)
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, imageUrl, location, startDate, endDate, maxParticipants, status } = req.body;

    if (status && !['upcoming', 'open', 'closed', 'completed'].includes(status)) {
      sendError(res, 'Invalid event status', 400);
      return;
    }
    if (maxParticipants !== undefined && (!Number.isInteger(Number(maxParticipants)) || Number(maxParticipants) < 1)) {
      sendError(res, 'Maximum participants must be a positive integer', 400);
      return;
    }

    if (!title || !description || !location || !startDate || !endDate || !maxParticipants) {
      sendError(res, 'All fields are required', 400);
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      sendError(res, 'End date must be after start date', 400);
      return;
    }

    const event = await BloodDonationEvent.create({
      title,
      description,
      imageUrl,
      location,
      startDate,
      endDate,
      maxParticipants,
      status: status || 'upcoming',
      createdBy: req.user!._id,
    });

    sendSuccess(res, event, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create event', 500);
  }
};

/**
 * PUT /api/events/:id
 * Update event (admin only)
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await BloodDonationEvent.findById(req.params.id);
    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    const { title, description, imageUrl, location, startDate, endDate, maxParticipants, status } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (location) event.location = location;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (maxParticipants !== undefined) event.maxParticipants = Number(maxParticipants);
    if (status) event.status = status;

    if (event.endDate <= event.startDate) {
      sendError(res, 'End date must be after start date', 400);
      return;
    }

    await event.save();
    sendSuccess(res, event);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update event', 500);
  }
};

/**
 * DELETE /api/events/:id
 * Delete event (admin only)
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await BloodDonationEvent.findById(req.params.id);
    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    // Check if there are registrations
    const regCount = await Registration.countDocuments({ eventId: event._id });
    if (regCount > 0) {
      sendError(res, 'Cannot delete event with existing registrations. Consider closing it instead.', 400);
      return;
    }

    await BloodDonationEvent.findByIdAndDelete(req.params.id);
    sendSuccess(res, { message: 'Event deleted successfully' });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete event', 500);
  }
};

/**
 * PATCH /api/events/:id/status
 * Update event status (admin only)
 */
export const updateEventStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['upcoming', 'open', 'closed', 'completed'].includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const event = await BloodDonationEvent.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    sendSuccess(res, event);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update event status', 500);
  }
};
