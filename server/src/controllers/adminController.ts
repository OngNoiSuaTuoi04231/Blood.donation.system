import { Request, Response } from 'express';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/admin/donors
 * List all donors (admin only)
 */
export const getDonors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, bloodType, gender } = req.query;
    const query: any = { role: 'donor' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (bloodType) query.bloodType = bloodType;
    if (gender) query.gender = gender;

    const donors = await User.find(query).select('-password').sort({ createdAt: -1 });
    sendSuccess(res, donors);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch donors', 500);
  }
};

/**
 * GET /api/admin/medical-staff
 * List all medical staff (admin only)
 */
export const getMedicalStaff = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await User.find({ role: 'medical_staff' }).select('-password').sort({ createdAt: -1 });
    sendSuccess(res, staff);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch medical staff', 500);
  }
};

/**
 * POST /api/admin/medical-staff
 * Create medical staff account (admin only)
 */
export const createMedicalStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, phone, dateOfBirth, gender, bloodType } = req.body;

    if (!fullName || !email || !password || !phone || !dateOfBirth || !gender || !bloodType) {
      sendError(res, 'All fields are required', 400);
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email already exists', 409);
      return;
    }

    const staff = await User.create({
      fullName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      role: 'medical_staff',
    });

    sendSuccess(
      res,
      {
        _id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        dateOfBirth: staff.dateOfBirth,
        gender: staff.gender,
        bloodType: staff.bloodType,
        role: staff.role,
        isActive: staff.isActive,
      },
      201
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create medical staff', 500);
  }
};

/**
 * PUT /api/admin/medical-staff/:id
 * Update medical staff account (admin only)
 */
export const updateMedicalStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: 'medical_staff' });
    if (!staff) {
      sendError(res, 'Medical staff not found', 404);
      return;
    }

    const { fullName, phone, dateOfBirth, gender, bloodType, isActive } = req.body;

    if (fullName) staff.fullName = fullName;
    if (phone) staff.phone = phone;
    if (dateOfBirth) staff.dateOfBirth = dateOfBirth;
    if (gender) staff.gender = gender;
    if (bloodType) staff.bloodType = bloodType;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    sendSuccess(res, {
      _id: staff._id,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      dateOfBirth: staff.dateOfBirth,
      gender: staff.gender,
      bloodType: staff.bloodType,
      role: staff.role,
      isActive: staff.isActive,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update medical staff', 500);
  }
};

/**
 * DELETE /api/admin/medical-staff/:id
 * Deactivate medical staff (admin only) - soft delete
 */
export const deleteMedicalStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'medical_staff' },
      { isActive: false },
      { new: true }
    );

    if (!staff) {
      sendError(res, 'Medical staff not found', 404);
      return;
    }

    sendSuccess(res, { message: 'Medical staff deactivated successfully' });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to deactivate medical staff', 500);
  }
};

/**
 * PUT /api/admin/donors/:id/status
 * Activate/deactivate donor (admin only)
 */
export const updateDonorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.body;
    const donor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'donor' },
      { isActive },
      { new: true }
    ).select('-password');

    if (!donor) {
      sendError(res, 'Donor not found', 404);
      return;
    }

    sendSuccess(res, donor);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update donor status', 500);
  }
};
