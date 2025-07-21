/**
 * Authentication middleware - JWT token verification and user context
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { JWTPayload, AuthenticatedRequest } from '../types/auth.types';
import { USER_ROLES } from '../utils/constants';
import { logger } from '../utils/logger';
import { 
  AuthenticationError, 
  TokenInvalidError, 
  ForbiddenError 
} from '../utils/errors';

/**
 * Authenticate JWT token middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    next(new AuthenticationError('Token yêu cầu để truy cập endpoint này'));
    return;
  }

  try {
    const decoded = verifyAccessToken(token) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      token: token.substring(0, 20) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    next(new TokenInvalidError());
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAccessToken(token) as JWTPayload;
    req.user = decoded;
  } catch (error) {
    logger.warn('Optional authentication failed', { 
      token: token.substring(0, 20) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't fail - just continue without user context
  }

  next();
}

/**
 * Require specific roles middleware
 */
export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Token yêu cầu để truy cập endpoint này'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles
      });

      next(new ForbiddenError(`Không có quyền truy cập. Yêu cầu một trong các role: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRoles(USER_ROLES.ADMIN);

/**
 * Require cashier or admin role
 */
export const requireCashier = requireRoles(USER_ROLES.ADMIN, USER_ROLES.CASHIER);

/**
 * Check if user owns resource or has admin rights
 */
export function requireOwnershipOrAdmin(userIdField: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Token yêu cầu để truy cập endpoint này'));
      return;
    }

    // Admin can access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      next();
      return;
    }

    // Check ownership
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    if (req.user.userId !== resourceUserId) {
      logger.warn('Authorization failed - resource ownership check', {
        userId: req.user.userId,
        resourceUserId,
        userRole: req.user.role
      });

      next(new ForbiddenError('Bạn chỉ có thể truy cập tài nguyên của chính mình'));
      return;
    }

    next();
  };
}
