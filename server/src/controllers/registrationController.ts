import { Request, Response } from 'express';
import Registration from '../models/Registration';
import BloodDonationEvent from '../models/BloodDonationEvent';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateQRIdentifier } from '../services/qrService';
import { exceedsDonationAgeLimit } from '../utils/age';

/**
 * POST /api/registrations
 * Create a new registration (donor only)
 */
export const createRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { eventId, bloodType, weight, height, hasFever, hasChronicDisease, takingMedication, recentSurgery } = req.body;

    const screeningFields = [hasFever, hasChronicDisease, takingMedication, recentSurgery];
    if (!eventId || !bloodType || !weight || !height || screeningFields.some((value) => typeof value !== 'boolean')) {
      sendError(res, 'Event ID, blood type, weight, and height are required', 400);
      return;
    }

    // Kiểm tra lại ở bước đăng ký đợt để chặn các tài khoản cũ hoặc request gọi API trực tiếp.
    if (exceedsDonationAgeLimit(req.user!.dateOfBirth)) {
      sendError(res, 'Người hiến phải từ đủ 18 đến 60 tuổi.', 400);
      return;
    }

    // Check event exists and is open
    const event = await BloodDonationEvent.findById(eventId);
    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    if (event.status !== 'open') {
      sendError(res, 'This event is not accepting registrations', 400);
      return;
    }

    if (event.endDate <= new Date()) {
      sendError(res, 'This event has already ended', 400);
      return;
    }

    // Check max participants
    const currentCount = await Registration.countDocuments({
      eventId,
      registrationStatus: { $nin: ['cancelled', 'rejected'] },
    });
    if (currentCount >= event.maxParticipants) {
      sendError(res, 'Đợt hiến máu đã đủ số lượng người đăng ký.', 409);
      return;
    }

    // Check duplicate registration
    const existingReg = await Registration.findOne({
      userId,
      eventId,
      registrationStatus: { $ne: 'cancelled' },
    });
    if (existingReg) {
      sendError(res, 'Bạn đã đăng ký đợt hiến máu này.', 409);
      return;
    }

    // Process initial screening
    const hasHealthIssue = hasFever || hasChronicDisease || takingMedication || recentSurgery;
    const screeningResult = hasHealthIssue ? 'failed' : 'passed';
    // Bệnh nền/sốt/dùng thuốc chỉ là cờ cảnh báo ban đầu, không phải kết luận y khoa.
    // Người hiến vẫn nhận QR để được bác sĩ sàng lọc trực tiếp tại sự kiện; kết luận cuối
    // cùng chỉ được medical_staff ghi trong medicalStatus (eligible/ineligible).
    const registrationStatus = 'approved';

    // Generate QR code identifier
    const qrCode = generateQRIdentifier();

    const registration = await Registration.create({
      userId,
      eventId,
      bloodType,
      weight,
      height,
      hasFever: hasFever || false,
      hasChronicDisease: hasChronicDisease || false,
      takingMedication: takingMedication || false,
      recentSurgery: recentSurgery || false,
      screeningResult,
      registrationStatus,
      qrCode,
      checkIn: { status: 'not_checked_in', checkInTime: null },
      medicalStatus: 'pending',
      registeredAt: new Date(),
    });

    const populated = await Registration.findById(registration._id)
      .populate('userId', 'fullName email phone')
      .populate('eventId', 'title location startDate endDate');

    sendSuccess(res, populated, 201);
  } catch (error: any) {
    if (error.code === 11000) {
      sendError(res, 'Bạn đã đăng ký đợt hiến máu này.', 409);
      return;
    }
    sendError(res, error.message || 'Failed to create registration', 500);
  }
};

/**
 * GET /api/registrations/my
 * Get current donor's registrations
 */
export const getMyRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.user!._id })
      .populate('eventId', 'title location startDate endDate status')
      .sort({ registeredAt: -1 });

    sendSuccess(res, registrations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch registrations', 500);
  }
};

/**
 * GET /api/registrations/:id
 * Get single registration detail
 */
export const getRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate status')
      .populate('checkedBy', 'fullName');

    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    // Donors can only view their own registrations
    if (req.user!.role === 'donor' && registration.userId._id.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized to view this registration', 403);
      return;
    }

    sendSuccess(res, registration);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch registration', 500);
  }
};

/**
 * GET /api/registrations
 * Get all registrations (admin/medical staff)
 */
export const getAllRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};
    const { eventId, status, medicalStatus, checkInStatus } = req.query;

    if (eventId) query.eventId = eventId;
    if (status) query.registrationStatus = status;
    if (medicalStatus) query.medicalStatus = medicalStatus;
    if (checkInStatus) query['checkIn.status'] = checkInStatus;

    const registrations = await Registration.find(query)
      .populate('userId', 'fullName email phone dateOfBirth gender bloodType')
      .populate('eventId', 'title location startDate endDate status')
      .populate('checkedBy', 'fullName')
      .sort({ registeredAt: -1 });

    sendSuccess(res, registrations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch registrations', 500);
  }
};

/**
 * PUT /api/registrations/:id
 * Update registration status (admin)
 */
export const updateRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationStatus } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(registrationStatus)) {
      sendError(res, 'Invalid registration status', 400);
      return;
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { registrationStatus },
      { new: true }
    ).populate('userId', 'fullName email phone')
      .populate('eventId', 'title location startDate endDate');

    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    sendSuccess(res, registration);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update registration', 500);
  }
};

/**
 * DELETE /api/registrations/:id
 * Cancel a registration (donor: own, admin: any)
 */
export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'donor' && req.user!.role !== 'admin') {
      sendError(res, 'Only donors and administrators can cancel registrations', 403);
      return;
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      sendError(res, 'Registration not found', 404);
      return;
    }

    // Donors can only cancel their own registrations
    if (req.user!.role === 'donor' && registration.userId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Not authorized to cancel this registration', 403);
      return;
    }

    // Can only cancel if not yet checked in
    if (registration.checkIn.status === 'checked_in') {
      sendError(res, 'Cannot cancel a registration after check-in', 400);
      return;
    }

    registration.registrationStatus = 'cancelled';
    await registration.save();

    sendSuccess(res, { message: 'Registration cancelled successfully' });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to cancel registration', 500);
  }
};
