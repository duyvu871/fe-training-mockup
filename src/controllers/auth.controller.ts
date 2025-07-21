/**
 * Authentication Controller - Handles auth-related endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { PrismaClient } from '@prisma/client';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  AuthenticationError, 
  ValidationError, 
  TokenInvalidError,
  NotFoundError 
} from '../utils/errors';

export class AuthController {
  private userService: UserService;

  constructor(prisma: PrismaClient) {
    const userRepository = new UserRepository(prisma);
    this.userService = new UserService(userRepository);
  }

  /**
   * User login
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email và mật khẩu là bắt buộc');
      }

      // Authenticate user
      const authResponse = await this.userService.login({ email, password });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: authResponse.user.id,
        username: authResponse.user.username,
        role: authResponse.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Return response
      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(authResponse, 'Đăng nhập thành công')
      );
    } catch (error) {
      logger.error('Login failed', {
        error: (error as Error).message,
        email: req.body?.email,
        ip: req.ip
      });
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token là bắt buộc');
      }

      // Use service method
      const refreshResponse = await this.userService.refreshToken(refreshToken);

      logger.info('Token refreshed successfully');

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(refreshResponse, 'Làm mới token thành công')
      );
    } catch (error) {
      logger.error('Token refresh failed', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthenticationError('Không tìm thấy thông tin người dùng');
      }

      const user = await this.userService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ user }, 'Lấy thông tin người dùng thành công')
      );
    } catch (error) {
      logger.error('Get profile failed', {
        error: (error as Error).message,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { firstName, lastName, phone, email } = req.body;

      if (!userId) {
        throw new AuthenticationError('Không tìm thấy thông tin người dùng');
      }

      const updatedUser = await this.userService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
        email
      });

      logger.info('Profile updated successfully', {
        userId,
        updatedFields: Object.keys(req.body)
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ user: updatedUser }, 'Cập nhật thông tin thành công')
      );
    } catch (error) {
      logger.error('Update profile failed', {
        error: (error as Error).message,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/auth/password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        throw new AuthenticationError('Không tìm thấy thông tin người dùng');
      }

      if (!currentPassword || !newPassword) {
        throw new ValidationError('Mật khẩu hiện tại và mật khẩu mới là bắt buộc');
      }

      if (currentPassword === newPassword) {
        throw new ValidationError('Mật khẩu mới phải khác mật khẩu hiện tại');
      }

      // Use service method
      await this.userService.changePassword(userId, {
        currentPassword,
        newPassword
      });

      logger.info('Password changed successfully', { userId });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(null, 'Đổi mật khẩu thành công')
      );
    } catch (error) {
      logger.error('Change password failed', {
        error: (error as Error).message,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (userId) {
        logger.info('User logged out', {
          userId,
          ip: req.ip
        });
      }

      // Note: In a production app, you might want to:
      // 1. Blacklist the current token
      // 2. Store refresh tokens in database and remove them
      // 3. Clear any server-side sessions

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse('Đăng xuất thành công')
      );
    } catch (error) {
      logger.error('Logout failed', {
        error: (error as Error).message,
        userId: req.user?.userId
      });
      next(error);
    }
  }
}
