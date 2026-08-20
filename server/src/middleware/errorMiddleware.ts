import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global error handling middleware
 */
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400);
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    sendError(res, `Duplicate value for field: ${field}`, 409);
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 'Invalid ID format', 400);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Default server error
  sendError(res, 'Internal server error', 500);
};
