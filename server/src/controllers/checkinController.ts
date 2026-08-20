import { Request, Response } from 'express';
import Registration from '../models/Registration';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * POST /api/checkin
 * Check in a donor via QR code (admin or medical staff)
 */
export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      sendError(res, 'QR code is required', 400);
      return;
    }

    // Find registration by QR code
    const registration = await Registration.findOne({ qrCode })
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate status');

    if (!registration) {
      sendError(res, 'QR không hợp lệ hoặc không tồn tại.', 404);
      return;
    }

    const event = registration.eventId as any;
    const now = new Date();
    if (event?.status !== 'open' || now < new Date(event.startDate) || now > new Date(event.endDate)) {
      sendError(res, 'Đợt hiến máu hiện không trong thời gian điểm danh.', 400);
      return;
    }

    // Check if already checked in
    if (registration.checkIn.status === 'checked_in') {
      sendError(res, 'Người tham gia đã được điểm danh.', 409);
      return;
    }

    // Check registration status
    if (registration.registrationStatus === 'cancelled') {
      sendError(res, 'Registration has been cancelled', 400);
      return;
    }

    if (registration.registrationStatus === 'rejected') {
      sendError(res, 'Registration has been rejected', 400);
      return;
    }

    if (registration.registrationStatus !== 'approved') {
      sendError(res, 'Đăng ký chưa được duyệt để điểm danh.', 400);
      return;
    }

    // Perform check-in
    registration.checkIn.status = 'checked_in';
    registration.checkIn.checkInTime = new Date();
    registration.checkIn.checkedInBy = req.user!._id;
    await registration.save();

    sendSuccess(res, {
      message: 'Check-in successful',
      registration: {
        _id: registration._id,
        user: registration.userId,
        event: registration.eventId,
        registrationStatus: registration.registrationStatus,
        checkIn: registration.checkIn,
        bloodType: registration.bloodType,
        screeningResult: registration.screeningResult,
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Check-in failed', 500);
  }
};

/**
 * GET /api/checkin/event/:eventId
 * Get check-in list for an event
 */
export const getEventCheckIns = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({
      eventId: req.params.eventId,
    })
      .populate('userId', 'fullName email phone bloodType')
      .populate('eventId', 'title')
      .sort({ 'checkIn.checkInTime': -1 });

    sendSuccess(res, registrations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch check-in list', 500);
  }
};
