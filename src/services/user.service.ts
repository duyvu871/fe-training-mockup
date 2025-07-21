/**
 * User service - Business logic for user operations
 */

import { User, UserRole } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { 
  AuthenticationError,
  InvalidCredentialsError,
  ValidationError,
  ConflictError,
  NotFoundError,
  TokenInvalidError
} from '../utils/errors';
import { USER_ROLES } from '../utils/constants';
import { validateEmail, validatePassword, validateUsername, validatePhone } from '../utils/validation';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Đăng nhập người dùng
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!validateEmail(data.email)) {
        throw new ValidationError('Email không hợp lệ');
      }

      if (!data.password) {
        throw new ValidationError('Mật khẩu không được để trống');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(data.email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Tài khoản đã bị vô hiệu hóa');
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError();
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      // Generate refresh token with tokenId
      const tokenId = `${user.id}_${Date.now()}`;
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed', { error, email: data.email });
      throw error;
    }
  }

  /**
   * Đăng ký người dùng mới
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!validateEmail(data.email)) {
        throw new ValidationError('Email không hợp lệ');
      }

      if (!validatePassword(data.password)) {
        throw new ValidationError('Mật khẩu phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường và số');
      }

      if (!validateUsername(data.username)) {
        throw new ValidationError('Tên đăng nhập phải từ 3-50 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới');
      }

      if (!data.firstName || data.firstName.trim().length < 2) {
        throw new ValidationError('Tên phải có ít nhất 2 ký tự');
      }

      if (data.phone && !validatePhone(data.phone)) {
        throw new ValidationError('Số điện thoại không hợp lệ');
      }

      // Check if user already exists by email or username
      const [existingUserByEmail, existingUserByUsername] = await Promise.all([
        this.userRepository.findByEmail(data.email),
        this.userRepository.findByUsername(data.username)
      ]);

      if (existingUserByEmail) {
        throw new ConflictError('Email đã được sử dụng');
      }

      if (existingUserByUsername) {
        throw new ConflictError('Tên đăng nhập đã được sử dụng');
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const userData = {
        username: data.username.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: data.firstName.trim(),
        ...(data.lastName && { lastName: data.lastName.trim() }),
        ...(data.phone && { phone: data.phone.trim() }),
        role: data.role || USER_ROLES.CASHIER,
      };

      const user = await this.userRepository.create(userData);

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role, // Cast to match auth types
      };

      // Generate refresh token with tokenId (you might want to store this in DB)
      const tokenId = `${user.id}_${Date.now()}`;
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration failed', { error, email: data.email });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token là bắt buộc');
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await this.userRepository.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new TokenInvalidError('User không tồn tại hoặc đã bị vô hiệu hóa');
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      // Generate refresh token with tokenId
      const tokenId = `${user.id}_${Date.now()}`;
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken({ userId: user.id, tokenId });

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Lấy thông tin profile của user
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('Người dùng');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to get user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<Omit<User, 'password'>> {
    try {
      // Validate input
      if (data.email && !validateEmail(data.email)) {
        throw new ValidationError('Email không hợp lệ');
      }

      if (data.username && !validateUsername(data.username)) {
        throw new ValidationError('Tên đăng nhập không hợp lệ');
      }

      if (data.firstName && data.firstName.trim().length < 2) {
        throw new ValidationError('Tên phải có ít nhất 2 ký tự');
      }

      if (data.phone && !validatePhone(data.phone)) {
        throw new ValidationError('Số điện thoại không hợp lệ');
      }

      // Check if email is already used by another user
      if (data.email) {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictError('Email đã được sử dụng bởi người dùng khác');
        }
      }

      // Check if username is already used by another user
      if (data.username) {
        const existingUser = await this.userRepository.findByUsername(data.username);
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictError('Tên đăng nhập đã được sử dụng bởi người dùng khác');
        }
      }

      // Update user
      const updateData: any = {};
      if (data.email) updateData.email = data.email.toLowerCase().trim();
      if (data.username) updateData.username = data.username.trim();
      if (data.firstName) updateData.firstName = data.firstName.trim();
      if (data.lastName !== undefined) updateData.lastName = data.lastName?.trim();
      if (data.phone !== undefined) updateData.phone = data.phone?.trim();

      const user = await this.userRepository.update(userId, updateData);
      if (!user) {
        throw new NotFoundError('Người dùng');
      }

      const { password, ...userWithoutPassword } = user;

      logger.info('User profile updated successfully', { userId, updatedFields: Object.keys(updateData) });

      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to update user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    try {
      // Validate input
      if (!data.currentPassword) {
        throw new ValidationError('Mật khẩu hiện tại không được để trống');
      }

      if (!validatePassword(data.newPassword)) {
        throw new ValidationError('Mật khẩu mới phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường và số');
      }

      if (data.currentPassword === data.newPassword) {
        throw new ValidationError('Mật khẩu mới phải khác với mật khẩu hiện tại');
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('Người dùng');
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Mật khẩu hiện tại không đúng');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(data.newPassword);

      // Update password
      await this.userRepository.update(userId, { password: hashedNewPassword });

      logger.info('User password changed successfully', { userId });
    } catch (error) {
      logger.error('Failed to change password', { error, userId });
      throw error;
    }
  }

  /**
   * Lấy danh sách người dùng (admin only)
   */
  async getUsers(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const result = await this.userRepository.findMany(options);

      // Remove passwords from all users
      const usersWithoutPassword = result.users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return {
        ...result,
        users: usersWithoutPassword,
      };
    } catch (error) {
      logger.error('Failed to get users list', { error, options });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái người dùng (admin only)
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.userRepository.update(userId, { isActive });
      if (!user) {
        throw new NotFoundError('Người dùng');
      }

      const { password, ...userWithoutPassword } = user;

      logger.info('User status updated', { userId, isActive });

      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to update user status', { error, userId, isActive });
      throw error;
    }
  }

  /**
   * Cập nhật role người dùng (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.userRepository.update(userId, { role });
      if (!user) {
        throw new NotFoundError('Người dùng');
      }

      const { password, ...userWithoutPassword } = user;

      logger.info('User role updated', { userId, role });

      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to update user role', { error, userId, role });
      throw error;
    }
  }

  /**
   * Xóa người dùng (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const success = await this.userRepository.delete(userId);
      if (!success) {
        throw new NotFoundError('Người dùng');
      }

      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete user', { error, userId });
      throw error;
    }
  }
}
