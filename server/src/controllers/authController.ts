import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';
import { calculateAge, exceedsDonationAgeLimit } from '../utils/age';

/**
 * POST /api/auth/register
 * Register a new donor account
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, phone, dateOfBirth, gender, bloodType } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !phone || !dateOfBirth || !gender || !bloodType) {
      sendError(res, 'All fields are required', 400);
      return;
    }

    // Quy tắc an toàn của Quỹ DKT: tài khoản tự đăng ký luôn là người hiến,
    // vì vậy chỉ nhận người không quá 60 tuổi. Nhân viên y tế/admin không đi qua endpoint này.
    if (exceedsDonationAgeLimit(dateOfBirth)) {
      const age = calculateAge(dateOfBirth);
      sendError(res, age === null ? 'Ngày sinh không hợp lệ.' : 'Người hiến phải từ đủ 18 đến 60 tuổi.', 400);
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    // Create user (role defaults to 'donor')
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      role: 'donor', // Only donors can self-register
    });

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bloodType: user.bloodType,
          role: user.role,
        },
      },
      201
    );
  } catch (error: any) {
    sendError(res, error.message || 'Registration failed', 500);
  }
};

/**
 * POST /api/auth/login
 * Login for all roles
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account has been deactivated', 403);
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    sendSuccess(res, {
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bloodType: user.bloodType,
        role: user.role,
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Login failed', 500);
  }
};

/**
 * POST /api/auth/reset-password
 * Luồng khôi phục dành cho bản demo/local: không gửi email vì dự án dùng email giả.
 * Người dùng phải xác minh đồng thời email, họ tên và ngày sinh trước khi được đổi mật khẩu.
 * Khi triển khai thực tế, endpoint này nên được thay bằng token một lần gửi qua email/SMS.
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fullName, dateOfBirth, newPassword } = req.body;
    if (!email || !fullName || !dateOfBirth || !newPassword) {
      sendError(res, 'Vui lòng nhập đầy đủ email, họ tên, ngày sinh và mật khẩu mới.', 400);
      return;
    }
    if (String(newPassword).length < 6) {
      sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
      return;
    }

    // So sánh ngày theo phần năm-tháng-ngày để không bị lệch múi giờ khi MongoDB lưu Date UTC.
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    const submittedDate = new Date(dateOfBirth);
    if (!user || Number.isNaN(submittedDate.getTime())) {
      sendError(res, 'Thông tin xác minh không đúng.', 400);
      return;
    }
    const storedDate = user.dateOfBirth.toISOString().slice(0, 10);
    const requestedDate = submittedDate.toISOString().slice(0, 10);
    if (user.fullName.trim().toLocaleLowerCase('vi-VN') !== String(fullName).trim().toLocaleLowerCase('vi-VN') || storedDate !== requestedDate) {
      sendError(res, 'Thông tin xác minh không đúng.', 400);
      return;
    }

    // Model User tự bcrypt hash vì password đã được gán mới và được đánh dấu modified.
    user.password = newPassword;
    await user.save();
    sendSuccess(res, { message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (error: any) {
    sendError(res, error.message || 'Không thể đổi mật khẩu.', 500);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    sendSuccess(res, {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      dateOfBirth: req.user.dateOfBirth,
      gender: req.user.gender,
      bloodType: req.user.bloodType,
      role: req.user.role,
      createdAt: req.user.createdAt,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to get user', 500);
  }
};

/**
 * PUT /api/auth/me
 * Cập nhật các thông tin cá nhân an toàn. Email, mật khẩu và role không được đổi tại đây.
 */
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const { fullName, phone, dateOfBirth, gender, bloodType } = req.body;
    if (!fullName || !phone || !dateOfBirth || !gender || !bloodType) {
      sendError(res, 'Vui lòng nhập đầy đủ thông tin cá nhân.', 400);
      return;
    }
    if (user.role === 'donor' && exceedsDonationAgeLimit(dateOfBirth)) {
      sendError(res, 'Người hiến phải từ đủ 18 đến 60 tuổi.', 400);
      return;
    }

    user.fullName = String(fullName).trim();
    user.phone = String(phone).trim();
    user.dateOfBirth = new Date(dateOfBirth);
    user.gender = gender;
    user.bloodType = bloodType;
    await user.save();

    sendSuccess(res, {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodType: user.bloodType,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Không thể cập nhật thông tin cá nhân.', 500);
  }
};
