/**
 * User Repository - Database operations for users
 */

import { PrismaClient, User, Prisma, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { USER_ROLES } from '../utils/constants';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Tạo user mới
   */
  async create(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    try {
      const hashedPassword = await hashPassword(data.password);
      
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          phone: data.phone || null,
          role: (data.role) || USER_ROLES.CASHIER,
          isActive: true,
        },
      });

      logger.info('User created successfully', { userId: user.id, username: user.username });
      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, data: { username: data.username, email: data.email } });
      throw error;
    }
  }

  /**
   * Tìm user theo ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find user by ID', { error, id });
      throw error;
    }
  }

  /**
   * Tìm user theo username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      logger.error('Failed to find user by username', { error, username });
      throw error;
    }
  }

  /**
   * Tìm user theo email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  /**
   * Cập nhật user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });

      logger.info('User updated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, id });
      throw error;
    }
  }

  /**
   * Cập nhật mật khẩu
   */
  async updatePassword(id: string, newPassword: string): Promise<User> {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const user = await this.prisma.user.update({
        where: { id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      logger.info('User password updated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to update user password', { error, id });
      throw error;
    }
  }

  /**
   * Cập nhật last login
   */
  async updateLastLogin(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { 
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('User last login updated', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to update user last login', { error, id });
      throw error;
    }
  }

  /**
   * Kích hoạt/vô hiệu hóa user
   */
  async toggleActive(id: string, isActive: boolean): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { 
          isActive,
          updatedAt: new Date(),
        },
      });

      logger.info('User status toggled', { userId: id, isActive });
      return user;
    } catch (error) {
      logger.error('Failed to toggle user status', { error, id, isActive });
      throw error;
    }
  }

  /**
   * Xóa user (soft delete)
   */
  async delete(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });

      logger.info('User soft deleted', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to delete user', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách users với phân trang
   */
  async findMany(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        isActive,
        search,
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.UserWhereInput = {};

      if (role) {
        where.role = role;
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Users retrieved successfully', { 
        total, 
        page, 
        limit, 
        totalPages,
        filters: { role, isActive, search } 
      });

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to retrieve users', { error, options });
      throw error;
    }
  }

  /**
   * Kiểm tra username có tồn tại không
   */
  async existsByUsername(username: string, excludeId?: string): Promise<boolean> {
    try {
      const where: Prisma.UserWhereInput = { username };
      
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await this.prisma.user.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check username existence', { error, username });
      throw error;
    }
  }

  /**
   * Kiểm tra email có tồn tại không
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      const where: Prisma.UserWhereInput = { email };
      
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await this.prisma.user.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check email existence', { error, email });
      throw error;
    }
  }

  /**
   * Lấy thống kê users
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    recentlyCreated: number;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        roleStats,
        recentlyCreated,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      const byRole: Record<string, number> = {};
      roleStats.forEach(stat => {
        byRole[stat.role] = stat._count.role;
      });

      return {
        total,
        active,
        inactive,
        byRole,
        recentlyCreated,
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error });
      throw error;
    }
  }
}
