import { HTTP_STATUS, ERROR_CODES } from './constants';

// Base error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, code: string = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Xác thực thất bại') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Tên đăng nhập hoặc mật khẩu không đúng') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token đã hết hạn') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = 'Token không hợp lệ') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID);
  }
}

// Authorization errors
export class ForbiddenError extends AppError {
  constructor(message: string = 'Không có quyền truy cập') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string = 'Dữ liệu không hợp lệ') {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Tài nguyên') {
    super(`${resource} không tồn tại`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Tài nguyên đã tồn tại') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }
}

// Business logic errors
export class InsufficientStockError extends AppError {
  constructor(productName: string, availableStock: number) {
    super(
      `Không đủ hàng tồn kho cho sản phẩm "${productName}". Còn lại: ${availableStock}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_STOCK
    );
  }
}

export class InvalidOrderStatusError extends AppError {
  constructor(currentStatus: string, requiredStatus: string) {
    super(
      `Trạng thái đơn hàng không hợp lệ. Hiện tại: ${currentStatus}, Yêu cầu: ${requiredStatus}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_ORDER_STATUS
    );
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Lỗi cơ sở dữ liệu') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR);
  }
}
