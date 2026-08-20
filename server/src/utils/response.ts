import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: 'Success',
    data,
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
