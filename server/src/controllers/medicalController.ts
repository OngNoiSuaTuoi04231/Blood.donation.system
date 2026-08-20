import { Request, Response } from 'express';
import Registration from '../models/Registration';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/medical/registrations
 * Get registrations that need medical screening (medical staff / admin)
 */
export const getMedicalRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = {
      'checkIn.status': 'checked_in',
    };

    const { medicalStatus, eventId } = req.query;
    if (medicalStatus) query.medicalStatus = medicalStatus;
    if (eventId) query.eventId = eventId;

    const registrations = await Registration.find(query)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate')
      .populate('checkedBy', 'fullName')
      .sort({ registeredAt: -1 });

    sendSuccess(res, registrations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch medical registrations', 500);
  }
};

/**
 * GET /api/medical/registrations/:id
 * Get single registration for medical screening
 */
export const getMedicalRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate')
      .populate('checkedBy', 'fullName');

    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    sendSuccess(res, registration);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch registration', 500);
  }
};

/**
 * POST /api/medical/screening/:registrationId
 * Perform medical screening (medical staff)
 */
export const performScreening = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { medicalResult, medicalStatus, medicalNote } = req.body;

    if (!medicalStatus || !['eligible', 'ineligible'].includes(medicalStatus)) {
      sendError(res, 'Medical status must be "eligible" or "ineligible"', 400);
      return;
    }

    const registration = await Registration.findById(req.params.registrationId);
    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    if (registration.checkIn.status !== 'checked_in') {
      sendError(res, 'Donor must be checked in before medical screening', 400);
      return;
    }

    if (registration.registrationStatus === 'cancelled') {
      sendError(res, 'Cannot screen a cancelled registration', 400);
      return;
    }

    // Update medical screening data
    registration.medicalResult = medicalResult || '';
    registration.medicalStatus = medicalStatus;
    registration.medicalNote = medicalNote || '';
    registration.checkedBy = req.user!._id;
    registration.checkedAt = new Date();

    // "Đủ điều kiện" chỉ là kết quả khám. Người hiến vẫn phải hiến máu thực tế
    // rồi nhân viên y tế xác nhận ở completeDonation mới được chuyển completed.
    if (medicalStatus === 'eligible') {
      registration.registrationStatus = 'approved';
    } else if (medicalStatus === 'ineligible') {
      registration.registrationStatus = 'rejected';
    }

    await registration.save();

    const populated = await Registration.findById(registration._id)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate')
      .populate('checkedBy', 'fullName');

    sendSuccess(res, populated);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to perform screening', 500);
  }
};

/**
 * PUT /api/medical/screening/:registrationId
 * Update medical screening (medical staff)
 */
export const updateScreening = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { medicalResult, medicalStatus, medicalNote } = req.body;

    const registration = await Registration.findById(req.params.registrationId);
    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    if (registration.checkIn.status !== 'checked_in' || registration.registrationStatus === 'cancelled') {
      sendError(res, 'Only checked-in, active registrations can be updated', 400);
      return;
    }

    if (medicalResult !== undefined) registration.medicalResult = medicalResult;
    if (medicalStatus) {
      registration.medicalStatus = medicalStatus;
      if (medicalStatus === 'eligible') {
        registration.registrationStatus = 'approved';
      } else if (medicalStatus === 'ineligible') {
        registration.registrationStatus = 'rejected';
      }
    }
    if (medicalNote !== undefined) registration.medicalNote = medicalNote;
    registration.checkedBy = req.user!._id;
    registration.checkedAt = new Date();

    await registration.save();

    const populated = await Registration.findById(registration._id)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate')
      .populate('checkedBy', 'fullName');

    sendSuccess(res, populated);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update screening', 500);
  }
};

/**
 * POST /api/medical/complete-donation/:registrationId
 * Xác nhận nghiệp vụ cuối: người hiến đã hiến máu thành công tại sự kiện.
 * Chỉ người đã check-in và được kết luận eligible mới có thể hoàn thành.
 */
export const completeDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registration = await Registration.findById(req.params.registrationId);
    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }
    if (registration.registrationStatus === 'completed') {
      sendError(res, 'Lượt hiến máu này đã được xác nhận hoàn thành.', 409);
      return;
    }
    if (registration.checkIn.status !== 'checked_in' || registration.medicalStatus !== 'eligible') {
      sendError(res, 'Chỉ người đã điểm danh và đủ điều kiện y tế mới được xác nhận hiến máu thành công.', 400);
      return;
    }

    registration.registrationStatus = 'completed';
    await registration.save();
    const populated = await Registration.findById(registration._id)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate')
      .populate('checkedBy', 'fullName');
    sendSuccess(res, populated);
  } catch (error: any) {
    sendError(res, error.message || 'Không thể xác nhận hiến máu thành công.', 500);
  }
};
