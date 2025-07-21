/**
 * User Controller - Handles user management endpoints (Admin only)
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { PrismaClient, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../utils/errors';
import { validatePaginationParams } from '../utils/validation';

export class UserController {
  private userService: UserService;

  constructor(prisma: PrismaClient) {
    const userRepository = new UserRepository(prisma);
    this.userService = new UserService(userRepository);
  }

  /**
   * Get all users with pagination and filters (Admin only)
   * GET /api/users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, role, status, sortBy, sortOrder } = req.query;

      // Validate pagination
      const { validatedPage, validatedLimit } = validatePaginationParams(
        Number(page),
        Number(limit)
      );

      const options: any = {
        page: validatedPage,
        limit: validatedLimit
      };

      if (search) options.search = search as string;
      if (role) options.role = role as UserRole;
      if (status === 'active') options.isActive = true;
      if (status === 'inactive') options.isActive = false;
      if (sortBy) options.sortBy = sortBy as 'username' | 'email' | 'createdAt';
      if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.userService.getUsers(options);

      logger.info('Users retrieved successfully', {
        page: validatedPage,
        limit: validatedLimit,
        total: result.total,
        requestedBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy danh sách người dùng thành công')
      );
    } catch (error) {
      logger.error('Get users failed', {
        error: (error as Error).message,
        query: req.query,
        requestedBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID người dùng là bắt buộc');
      }

      const user = await this.userService.getProfile(id);

      logger.info('User retrieved by ID', { 
        userId: id,
        requestedBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ user }, 'Lấy thông tin người dùng thành công')
      );
    } catch (error) {
      logger.error('Get user by ID failed', {
        error: (error as Error).message,
        userId: req.params.id,
        requestedBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Create new user (Admin only) 
   * POST /api/users
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, firstName, lastName, phone } = req.body;

      if (!username || !email || !password) {
        throw new ValidationError('Tên đăng nhập, email và mật khẩu là bắt buộc');
      }

      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName ? firstName.trim() : undefined,
        lastName: lastName ? lastName.trim() : undefined,
        phone: phone ? phone.trim() : undefined
      };

      const user = await this.userService.register(userData);

      logger.info('User created successfully', {
        userId: user.user.id,
        username: user.user.username,
        createdBy: req.user?.userId
      });

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse({ user: user.user }, 'Tạo người dùng mới thành công')
      );
    } catch (error) {
      logger.error('Create user failed', {
        error: (error as Error).message,
        userData: { ...req.body, password: '[REDACTED]' },
        createdBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update user (Admin only)
   * PUT /api/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, email } = req.body;

      if (!id) {
        throw new ValidationError('ID người dùng là bắt buộc');
      }

      const updateData: any = {};
      
      if (firstName !== undefined) updateData.firstName = firstName ? firstName.trim() : undefined;
      if (lastName !== undefined) updateData.lastName = lastName ? lastName.trim() : undefined;
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : undefined;
      if (email !== undefined) updateData.email = email.trim().toLowerCase();

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('Cần ít nhất một trường để cập nhật');
      }

      const user = await this.userService.updateProfile(id, updateData);

      logger.info('User updated successfully', {
        userId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ user }, 'Cập nhật người dùng thành công')
      );
    } catch (error) {
      logger.error('Update user failed', {
        error: (error as Error).message,
        userId: req.params.id,
        updateData: req.body,
        updatedBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID người dùng là bắt buộc');
      }

      // Prevent self-deletion
      if (id === req.user?.userId) {
        throw new ValidationError('Không thể xóa tài khoản của chính mình');
      }

      await this.userService.deleteUser(id);

      logger.info('User deleted successfully', {
        userId: id,
        deletedBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(null, 'Xóa người dùng thành công')
      );
    } catch (error) {
      logger.error('Delete user failed', {
        error: (error as Error).message,
        userId: req.params.id,
        deletedBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Reset user password (Admin only)
   * PUT /api/users/:id/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!id) {
        throw new ValidationError('ID người dùng là bắt buộc');
      }

      if (!newPassword) {
        throw new ValidationError('Mật khẩu mới là bắt buộc');
      }

      // Use change password with admin override
      await this.userService.changePassword(id, {
        currentPassword: '', // Admin override
        newPassword
      });

      logger.info('User password reset successfully', {
        userId: id,
        resetBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(null, 'Đặt lại mật khẩu thành công')
      );
    } catch (error) {
      logger.error('Reset password failed', {
        error: (error as Error).message,
        userId: req.params.id,
        resetBy: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get user statistics (Admin only)
   * GET /api/users/stats
   */
  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get basic stats by getting all users and counting
      const allUsers = await this.userService.getUsers({ limit: 1000 });
      
      const stats = {
        total: allUsers.total,
        active: allUsers.users.filter(u => u.isActive).length,
        inactive: allUsers.users.filter(u => !u.isActive).length,
        byRole: allUsers.users.reduce((acc: any, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {})
      };

      logger.info('User stats retrieved', {
        requestedBy: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ stats }, 'Lấy thống kê người dùng thành công')
      );
    } catch (error) {
      logger.error('Get user stats failed', {
        error: (error as Error).message,
        requestedBy: req.user?.userId
      });
      next(error);
    }
  }
}
