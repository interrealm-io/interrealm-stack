import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorMiddleware(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('Error:', {
    error: message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: error.stack,
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
