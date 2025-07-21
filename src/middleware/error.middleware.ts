/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '../utils/constants';
import { createErrorResponse } from '../utils/helpers';
import { Prisma } from '@prisma/client';
import { 
  AppError,
  AuthenticationError,
  TokenExpiredError,
  TokenInvalidError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../utils/errors';

/**
 * Global error handler middleware
 */
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response has already been sent, delegate to default Express error handler
  if (res.headersSent) {
    next(error);
    return;
  }

  // Log the error
  logger.error('Global error handler', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    },
    userId: req.user?.userId
  });

  // Handle AppError instances (our custom errors)
  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      createErrorResponse(error.message, error.code)
    );
    return;
  }

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    handlePrismaValidationError(error, res);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const tokenError = new TokenInvalidError();
    res.status(tokenError.statusCode).json(
      createErrorResponse(tokenError.message, tokenError.code)
    );
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const tokenError = new TokenExpiredError();
    res.status(tokenError.statusCode).json(
      createErrorResponse(tokenError.message, tokenError.code)
    );
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const validationError = new ValidationError(error.message);
    res.status(validationError.statusCode).json(
      createErrorResponse(validationError.message, validationError.code)
    );
    return;
  }

  // Default to internal server error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    createErrorResponse(
      process.env.NODE_ENV === 'production' 
        ? ERROR_MESSAGES.INTERNAL_ERROR 
        : error.message,
      ERROR_CODES.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    )
  );
}

/**
 * Handle Prisma known request errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, res: Response): void {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const conflictError = new ConflictError(`Dữ liệu đã tồn tại: ${error.meta?.target}`);
      res.status(conflictError.statusCode).json(
        createErrorResponse(conflictError.message, conflictError.code, { field: error.meta?.target })
      );
      break;

    case 'P2025':
      // Record not found
      const notFoundError = new NotFoundError('Bản ghi');
      res.status(notFoundError.statusCode).json(
        createErrorResponse(notFoundError.message, notFoundError.code)
      );
      break;

    case 'P2003':
      // Foreign key constraint violation
      const validationError = new ValidationError(`Ràng buộc khóa ngoại bị vi phạm: ${error.meta?.field_name}`);
      res.status(validationError.statusCode).json(
        createErrorResponse(validationError.message, validationError.code, { field: error.meta?.field_name })
      );
      break;

    case 'P2014':
      // Required relation violation
      const relationError = new ValidationError(`Thiếu quan hệ bắt buộc: ${error.meta?.relation_name}`);
      res.status(relationError.statusCode).json(
        createErrorResponse(relationError.message, relationError.code, { relation: error.meta?.relation_name })
      );
      break;

    default:
      const dbError = new DatabaseError(`Lỗi cơ sở dữ liệu: ${error.message}`);
      res.status(dbError.statusCode).json(
        createErrorResponse(
          dbError.message,
          dbError.code,
          process.env.NODE_ENV === 'development' ? { prismaCode: error.code } : undefined
        )
      );
  }
}

/**
 * Handle Prisma validation errors
 */
function handlePrismaValidationError(error: Prisma.PrismaClientValidationError, res: Response): void {
  const validationError = new ValidationError('Dữ liệu không hợp lệ');
  res.status(validationError.statusCode).json(
    createErrorResponse(
      validationError.message,
      validationError.code,
      process.env.NODE_ENV === 'development' ? { details: error.message } : undefined
    )
  );
}

/**
 * Handle 404 errors for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const notFoundError = new NotFoundError(`Endpoint ${req.method} ${req.path}`);
  res.status(notFoundError.statusCode).json(
    createErrorResponse(
      notFoundError.message,
      notFoundError.code,
      {
        method: req.method,
        path: req.path,
        availableEndpoints: [
          'GET /health',
          'GET /health/database',
          'POST /auth/login',
          'POST /auth/refresh',
          'GET /auth/profile'
        ]
      }
    )
  );
}

/**
 * Create operational error (known error that should be handled gracefully)
 * @deprecated Use specific error classes from utils/errors.ts instead
 */
export function createAppError(message: string, statusCode: number, code?: string): AppError {
  return new AppError(message, statusCode, code);
}

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
