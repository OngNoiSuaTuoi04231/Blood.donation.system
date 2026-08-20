import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { sendError } from '../utils/response';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Xác thực JWT từ `Authorization: Bearer <token>`.
 * Payload chỉ chứa userId/role; middleware luôn đọc lại User từ DB để tôn trọng isActive và role hiện tại.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Access denied. No token provided.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      sendError(res, 'Server configuration error', 500);
      return;
    }

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      sendError(res, 'User not found or deactivated', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

/**
 * Phân quyền theo role đã xác thực. Route gọi authorize(...) để chặn quyền trước khi vào controller.
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403);
      return;
    }
    next();
  };
};

/** Shortcut: require admin role */
export const requireAdmin = authorize('admin');

/** Shortcut: require medical_staff role */
export const requireMedicalStaff = authorize('medical_staff');

/** Shortcut: require admin or medical_staff */
export const requireAdminOrMedical = authorize('admin', 'medical_staff');
