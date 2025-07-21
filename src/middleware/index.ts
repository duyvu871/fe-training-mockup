/**
 * Middleware exports
 */

// Authentication & Authorization
export {
  authenticateToken,
  optionalAuth,
  requireRoles,
  requireAdmin,
  requireCashier,
  requireOwnershipOrAdmin
} from './auth.middleware';

// Error handling
export {
  globalErrorHandler,
  notFoundHandler,
  createAppError,
  asyncHandler
} from './error.middleware';

// Security
export {
  securityHeaders,
  corsConfig,
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  requestLogger,
  validateContentType,
  requestSizeLimit
} from './security.middleware';

// Validation (from utils)
export {
  handleValidationErrors,
  validationRules,
  validationChains,
  customValidators,
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername
} from '../utils/validation';
