/**
 * Validation utilities and helpers
 */

import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { BUSINESS_RULES, ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from './constants';
import { createErrorResponse } from './helpers';

/**
 * Handle validation errors middleware
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      code: ERROR_CODES.VALIDATION_ERROR,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    res.status(HTTP_STATUS.BAD_REQUEST).json(
      createErrorResponse(
        ERROR_MESSAGES.VALIDATION_ERROR,
        ERROR_CODES.VALIDATION_ERROR,
        { errors: validationErrors }
      )
    );
    return;
  }
  
  next();
}

/**
 * Common validation rules
 */
export const validationRules = {
  // User validation
  username: () => body('username')
    .isLength({ min: BUSINESS_RULES.USERNAME_MIN_LENGTH, max: BUSINESS_RULES.USERNAME_MAX_LENGTH })
    .withMessage(`Tên đăng nhập phải từ ${BUSINESS_RULES.USERNAME_MIN_LENGTH} đến ${BUSINESS_RULES.USERNAME_MAX_LENGTH} ký tự`)
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),

  email: () => body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  password: () => body('password')
    .isLength({ min: BUSINESS_RULES.PASSWORD_MIN_LENGTH, max: BUSINESS_RULES.PASSWORD_MAX_LENGTH })
    .withMessage(`Mật khẩu phải từ ${BUSINESS_RULES.PASSWORD_MIN_LENGTH} đến ${BUSINESS_RULES.PASSWORD_MAX_LENGTH} ký tự`),

  confirmPassword: () => body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),

  firstName: () => body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên phải từ 1 đến 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),

  lastName: () => body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Họ phải từ 1 đến 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Họ chỉ được chứa chữ cái và khoảng trắng'),

  phone: () => body('phone')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values
      }
      const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        throw new Error('Số điện thoại không hợp lệ (định dạng Việt Nam)');
      }
      return true;
    }),

  role: () => body('role')
    .isIn(['ADMIN', 'CASHIER'])
    .withMessage('Vai trò không hợp lệ'),

  // Product validation
  productName: () => body('name')
    .isLength({ min: 1, max: BUSINESS_RULES.PRODUCT_NAME_MAX_LENGTH })
    .withMessage(`Tên sản phẩm phải từ 1 đến ${BUSINESS_RULES.PRODUCT_NAME_MAX_LENGTH} ký tự`)
    .trim(),

  sku: () => body('sku')
    .isLength({ min: 1, max: BUSINESS_RULES.SKU_MAX_LENGTH })
    .withMessage(`SKU phải từ 1 đến ${BUSINESS_RULES.SKU_MAX_LENGTH} ký tự`)
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU chỉ được chứa chữ cái in hoa, số và dấu gạch ngang'),

  price: () => body('price')
    .isFloat({ min: 0 })
    .withMessage('Giá phải là số dương')
    .toFloat(),

  cost: () => body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá vốn phải là số dương')
    .toFloat(),

  stock: () => body('stock')
    .isInt({ min: 0 })
    .withMessage('Tồn kho phải là số nguyên không âm')
    .toInt(),

  minStock: () => body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tồn kho tối thiểu phải là số nguyên không âm')
    .toInt(),

  barcode: () => body('barcode')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('Mã vạch phải từ 8 đến 20 ký tự')
    .matches(/^[0-9]+$/)
    .withMessage('Mã vạch chỉ được chứa số'),

  // Order validation
  orderItems: () => body('items')
    .isArray({ min: 1 })
    .withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),

  orderItemProductId: () => body('items.*.productId')
    .isUUID()
    .withMessage('ID sản phẩm không hợp lệ'),

  orderItemQuantity: () => body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương')
    .toInt(),

  paymentMethod: () => body('paymentMethod')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'E_WALLET'])
    .withMessage('Phương thức thanh toán không hợp lệ'),

  discount: () => body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giảm giá phải là số không âm')
    .toFloat(),

  // Stock validation
  stockMovementType: () => body('type')
    .isIn(['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN'])
    .withMessage('Loại biến động kho không hợp lệ'),

  stockQuantity: () => body('quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương')
    .toInt(),

  // Common validation
  uuid: (field: string = 'id') => param(field)
    .isUUID()
    .withMessage(`${field} không hợp lệ`),

  optionalUuid: (field: string) => body(field)
    .optional()
    .isUUID()
    .withMessage(`${field} không hợp lệ`),

  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Giới hạn phải từ 1 đến 100')
      .toInt(),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Trường sắp xếp phải là chuỗi'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Thứ tự sắp xếp phải là asc hoặc desc')
  ],

  search: () => query('search')
    .optional()
    .isString()
    .withMessage('Từ khóa tìm kiếm phải là chuỗi')
    .isLength({ max: 100 })
    .withMessage('Từ khóa tìm kiếm không được vượt quá 100 ký tự'),

  dateRange: () => [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Ngày bắt đầu không hợp lệ')
      .toDate(),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Ngày kết thúc không hợp lệ')
      .toDate()
      .custom((value, { req }) => {
        if (req?.query?.dateFrom && new Date(value) < new Date(req.query.dateFrom as string)) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
        return true;
      })
  ]
};

/**
 * Validation chains for specific endpoints
 */
export const validationChains = {
  // Auth validation chains
  login: [
    validationRules.email(),
    validationRules.password()
  ],

  register: [
    validationRules.email(),
    validationRules.password(),
    validationRules.username(),
    body('firstName')
      .notEmpty()
      .withMessage('Tên là bắt buộc')
      .isLength({ min: 2, max: 50 })
      .withMessage('Tên phải từ 2 đến 50 ký tự')
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
    validationRules.lastName(),
    validationRules.phone(),
    body('role')
      .optional()
      .isIn(['ADMIN', 'CASHIER'])
      .withMessage('Vai trò không hợp lệ')
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
      .isLength({ min: BUSINESS_RULES.PASSWORD_MIN_LENGTH, max: BUSINESS_RULES.PASSWORD_MAX_LENGTH })
      .withMessage(`Mật khẩu mới phải từ ${BUSINESS_RULES.PASSWORD_MIN_LENGTH} đến ${BUSINESS_RULES.PASSWORD_MAX_LENGTH} ký tự`)
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
        }
        return true;
      })
  ],

  updateProfile: [
    validationRules.firstName(),
    validationRules.lastName(),
    validationRules.phone(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail()
  ],

  // Product validation chains
  createProduct: [
    validationRules.productName(),
    validationRules.sku(),
    validationRules.price(),
    validationRules.cost(),
    validationRules.stock(),
    validationRules.minStock(),
    validationRules.barcode(),
    validationRules.optionalUuid('categoryId')
  ],

  updateProduct: [
    validationRules.uuid(),
    body('name').optional().isLength({ min: 1, max: BUSINESS_RULES.PRODUCT_NAME_MAX_LENGTH }),
    body('sku').optional().isLength({ min: 1, max: BUSINESS_RULES.SKU_MAX_LENGTH }),
    body('price').optional().isFloat({ min: 0 }).toFloat(),
    body('cost').optional().isFloat({ min: 0 }).toFloat(),
    body('stock').optional().isInt({ min: 0 }).toInt(),
    body('minStock').optional().isInt({ min: 0 }).toInt(),
    validationRules.optionalUuid('categoryId')
  ],

  // Order validation chains
  createOrder: [
    validationRules.orderItems(),
    validationRules.orderItemProductId(),
    validationRules.orderItemQuantity(),
    validationRules.paymentMethod(),
    validationRules.discount(),
    body('customerName')
      .optional({ nullable: true })
      .isLength({ max: 100 })
      .withMessage('Tên khách hàng không được vượt quá 100 ký tự'),
    body('customerPhone')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // Allow null/empty values
        }
        const phoneRegex = /^(\+84|0)[3-9]\d{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          throw new Error('Số điện thoại không hợp lệ (định dạng Việt Nam)');
        }
        return true;
      }),
    body('customerEmail')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // Allow null/empty values
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          throw new Error('Email không hợp lệ');
        }
        return true;
      }),
    body('notes')
      .optional({ nullable: true })
      .isLength({ max: 500 })
      .withMessage('Ghi chú không được vượt quá 500 ký tự')
  ],

  updateOrderStatus: [
    validationRules.uuid(),
    body('status').isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
      .withMessage('Trạng thái đơn hàng không hợp lệ')
  ],

  // Stock validation chains
  createStockMovement: [
    validationRules.uuid('productId'),
    validationRules.stockMovementType(),
    validationRules.stockQuantity(),
    body('reason').optional().isLength({ max: 200 }),
    body('reference').optional().isLength({ max: 100 }),
    body('cost').optional().isFloat({ min: 0 }).toFloat()
  ],

  // Category validation chains
  createCategory: [
    body('name')
      .notEmpty()
      .withMessage('Tên danh mục là bắt buộc')
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên danh mục phải từ 1 đến 100 ký tự'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Mô tả không được vượt quá 500 ký tự')
  ],

  updateCategory: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên danh mục phải từ 1 đến 100 ký tự'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Mô tả không được vượt quá 500 ký tự'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái phải là boolean')
  ],

  // Common validation chains
  getById: [validationRules.uuid()],
  
  pagination: validationRules.pagination(),
  
  search: [
    ...validationRules.pagination(),
    validationRules.search()
  ],

  dateRange: [
    ...validationRules.pagination(),
    ...validationRules.dateRange()
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token là bắt buộc')
      .isString()
      .withMessage('Refresh token phải là chuỗi')
  ],

  resetPassword: [
    param('id')
      .isUUID()
      .withMessage('ID người dùng phải là UUID hợp lệ'),
    body('newPassword')
      .isLength({ min: BUSINESS_RULES.PASSWORD_MIN_LENGTH, max: BUSINESS_RULES.PASSWORD_MAX_LENGTH })
      .withMessage(`Mật khẩu mới phải từ ${BUSINESS_RULES.PASSWORD_MIN_LENGTH} đến ${BUSINESS_RULES.PASSWORD_MAX_LENGTH} ký tự`),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Xác nhận mật khẩu không khớp');
        }
        return true;
      })
  ],
};

/**
 * Custom validation utilities
 */
export const customValidators = {
  /**
   * Check if value exists in database
   */
  existsInDB: (model: any, field: string = 'id') => {
    return async (value: string) => {
      const record = await model.findUnique({
        where: { [field]: value }
      });
      if (!record) {
        throw new Error(`${field} không tồn tại`);
      }
      return true;
    };
  },

  /**
   * Check if value is unique in database
   */
  isUniqueInDB: (model: any, field: string, excludeId?: string) => {
    return async (value: string) => {
      const where: any = { [field]: value };
      if (excludeId) {
        where.id = { not: excludeId };
      }
      
      const record = await model.findUnique({ where });
      if (record) {
        throw new Error(`${field} đã tồn tại`);
      }
      return true;
    };
  },

  /**
   * Validate file upload
   */
  validateFileUpload: (allowedTypes: string[], maxSize: number) => {
    return (value: any, { req }: any) => {
      if (!req.file) return true; // Optional file
      
      const file = req.file;
      
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`);
      }
      
      if (file.size > maxSize) {
        throw new Error(`File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB`);
      }
      
      return true;
    };
  }
};

/**
 * Simple validation helper functions
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // At least 8 characters, contains uppercase, lowercase, and number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Vietnamese phone number format
  const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // 3-50 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, limit: number): {
  validatedPage: number;
  validatedLimit: number;
} {
  const validatedPage = Math.max(1, isNaN(page) ? 1 : page);
  const validatedLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));
  
  return { validatedPage, validatedLimit };
}
