// Application constants
export const APP_CONSTANTS = {
  // Default pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Cache TTL
  CACHE_TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  },
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_ALREADY_COMPLETED: 'ORDER_ALREADY_COMPLETED',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
} as const;

// Product status
export const PRODUCT_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  E_WALLET: 'E_WALLET',
} as const;

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

// Stock movement types
export const STOCK_MOVEMENT_TYPES = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN',
  DAMAGED: 'DAMAGED',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  STOCK: '/api/stock',
  ADMIN: '/api/admin',
  USERS: '/api/users',
} as const;

// Date formats
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATE_TIME: 'DD/MM/YYYY HH:mm',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  TOKEN_REFRESHED: 'Token đã được làm mới',
  PASSWORD_CHANGED: 'Mật khẩu đã được thay đổi',
  PROFILE_UPDATED: 'Thông tin cá nhân đã được cập nhật',

  // Generic CRUD
  CREATED: 'Tạo mới thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',
  RETRIEVED: 'Lấy dữ liệu thành công',

  // Products
  PRODUCT_CREATED: 'Sản phẩm đã được tạo',
  PRODUCT_UPDATED: 'Sản phẩm đã được cập nhật',
  PRODUCT_DELETED: 'Sản phẩm đã được xóa',
  PRODUCT_STOCK_UPDATED: 'Tồn kho đã được cập nhật',

  // Orders
  ORDER_CREATED: 'Đơn hàng đã được tạo',
  ORDER_UPDATED: 'Đơn hàng đã được cập nhật',
  ORDER_CANCELLED: 'Đơn hàng đã được hủy',
  ORDER_COMPLETED: 'Đơn hàng đã hoàn thành',

  // Users
  USER_CREATED: 'Người dùng đã được tạo',
  USER_UPDATED: 'Người dùng đã được cập nhật',
  USER_DELETED: 'Người dùng đã được xóa',
  USER_ACTIVATED: 'Tài khoản đã được kích hoạt',
  USER_DEACTIVATED: 'Tài khoản đã được vô hiệu hóa',

  // Categories
  CATEGORY_CREATED: 'Danh mục đã được tạo',
  CATEGORY_UPDATED: 'Danh mục đã được cập nhật',
  CATEGORY_DELETED: 'Danh mục đã được xóa',

  // Stock
  STOCK_ADJUSTED: 'Tồn kho đã được điều chỉnh',
  STOCK_MOVEMENT_RECORDED: 'Biến động kho đã được ghi nhận'
} as const;

// Error messages in Vietnamese
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không chính xác',
  TOKEN_EXPIRED: 'Token đã hết hạn, vui lòng đăng nhập lại',
  TOKEN_INVALID: 'Token không hợp lệ',
  TOKEN_REQUIRED: 'Yêu cầu token xác thực',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  INSUFFICIENT_PERMISSIONS: 'Bạn không có quyền truy cập tài nguyên này',
  
  // Validation
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  MISSING_REQUIRED_FIELD: 'Thiếu trường bắt buộc',
  INVALID_FORMAT: 'Định dạng không hợp lệ',
  
  // Resources
  RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu',
  RESOURCE_ALREADY_EXISTS: 'Dữ liệu đã tồn tại',
  RESOURCE_CONFLICT: 'Xung đột dữ liệu',
  
  // Business logic
  INSUFFICIENT_STOCK: 'Không đủ tồn kho',
  ORDER_ALREADY_COMPLETED: 'Đơn hàng đã hoàn thành',
  INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ',
  
  // System
  INTERNAL_ERROR: 'Đã xảy ra lỗi hệ thống',
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
  EXTERNAL_SERVICE_ERROR: 'Lỗi dịch vụ bên ngoài'
} as const;

// Business rules
export const BUSINESS_RULES = {
  MIN_STOCK_DEFAULT: 10,
  TAX_RATE: 0.1, // 10%
  MAX_DISCOUNT_PERCENT: 50,
  ORDER_NUMBER_PREFIX: 'ORD',
  RECEIPT_NUMBER_PREFIX: 'RCP',
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  SKU_MAX_LENGTH: 50,
  PRODUCT_NAME_MAX_LENGTH: 200
} as const;

// JWT constants
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRE: '15m',
  REFRESH_TOKEN_EXPIRE: '7d',
  ALGORITHM: 'HS256'
} as const;

// Rate limiting
export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_ATTEMPTS: 5
} as const;
