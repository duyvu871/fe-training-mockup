/**
 * Authentication Routes - /api/auth
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { 
  authenticateToken, 
  handleValidationErrors,
  validationChains, 
  validationRules
} from '../middleware';
import { asyncHandler } from '../middleware/error.middleware';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authController = new AuthController(prisma);

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Đăng nhập người dùng
   *     description: Xác thực người dùng và trả về JWT tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           examples:
   *             admin:
   *               summary: Admin account
   *               value:
   *                 email: "admin@pos.local"
   *                 password: "password123"
   *             cashier:
   *               summary: Cashier account
   *               value:
   *                 email: "cashier@pos.com"
   *                 password: "cashier123"
   *     responses:
   *       200:
   *         description: Đăng nhập thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Lỗi validation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Email hoặc mật khẩu không đúng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Login
  router.post('/login',
    ...validationChains.login,
    handleValidationErrors,
    asyncHandler(authController.login.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Làm mới access token
   *     description: Sử dụng refresh token để lấy access token mới
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenRequest'
   *     responses:
   *       200:
   *         description: Token được làm mới thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Refresh token không hợp lệ
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Refresh token hết hạn
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Refresh token
  router.post('/refresh',
    ...validationChains.refreshToken,
    handleValidationErrors,
    asyncHandler(authController.refresh.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Lấy thông tin người dùng hiện tại
   *     description: Trả về thông tin người dùng đã đăng nhập
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/UserProfile'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get current user profile (protected)
  router.get('/me',
    authenticateToken,
    asyncHandler(authController.getProfile.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     summary: Cập nhật thông tin người dùng
   *     description: Cập nhật thông tin người dùng như họ tên, email, số điện thoại, địa chỉ
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProfileRequest'
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/UserProfile'
   *       400:
   *         description: Lỗi validation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Update profile (protected)
  router.put('/profile',
    authenticateToken,
    ...validationChains.updateProfile,
    handleValidationErrors,
    asyncHandler(authController.updateProfile.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/password:
   *   put:
   *     summary: Đổi mật khẩu
   *     description: Đổi mật khẩu cho tài khoản người dùng
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChangePasswordRequest'
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/UserProfile'
   *       400:
   *         description: Lỗi validation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Mật khẩu hiện tại không đúng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Change password (protected)
  router.put('/password',
    authenticateToken,
    ...validationChains.changePassword,
    handleValidationErrors,
    asyncHandler(authController.changePassword.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Đăng xuất người dùng
   *     description: Đăng xuất và xóa token khỏi danh sách cho phép
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Đăng xuất thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Logout (protected)
  router.post('/logout',
    authenticateToken,
    asyncHandler(authController.logout.bind(authController))
  );

  return router;
}
