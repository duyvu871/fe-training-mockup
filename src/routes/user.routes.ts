/**
 * User Routes - /api/users (Admin only)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserController } from '../controllers/user.controller';
import { 
  authenticateToken,
  requireAdmin,
  handleValidationErrors,
  validationChains 
} from '../middleware';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID người dùng
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         username:
 *           type: string
 *           description: Tên đăng nhập
 *           example: "admin"
 *         email:
 *           type: string
 *           format: email
 *           description: Email người dùng
 *           example: "admin@example.com"
 *         firstName:
 *           type: string
 *           description: Họ
 *           example: "Nguyễn"
 *         lastName:
 *           type: string
 *           description: Tên
 *           example: "Văn A"
 *         phone:
 *           type: string
 *           description: Số điện thoại
 *           example: "0987654321"
 *         role:
 *           type: string
 *           enum: [ADMIN, CASHIER]
 *           description: Vai trò người dùng
 *           example: "ADMIN"
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *           example: true
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: Lần đăng nhập cuối
 *           example: "2025-01-20T14:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 *           example: "2025-01-15T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật
 *           example: "2025-01-20T14:30:00.000Z"
 *           
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Tên đăng nhập (duy nhất)
 *           example: "cashier01"
 *         email:
 *           type: string
 *           format: email
 *           description: Email (duy nhất)
 *           example: "cashier01@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Mật khẩu
 *           example: "123456"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: Họ
 *           example: "Trần"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: Tên
 *           example: "Thị B"
 *         phone:
 *           type: string
 *           pattern: '^(\+84|84|0)(3|5|7|8|9)\d{8}$'
 *           description: Số điện thoại Việt Nam
 *           example: "0987654321"
 *         role:
 *           type: string
 *           enum: [ADMIN, CASHIER]
 *           description: Vai trò người dùng
 *           example: "CASHIER"
 *           
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Tên đăng nhập (duy nhất)
 *           example: "cashier01_updated"
 *         email:
 *           type: string
 *           format: email
 *           description: Email (duy nhất)
 *           example: "cashier01_updated@example.com"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: Họ
 *           example: "Trần"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: Tên
 *           example: "Thị B"
 *         phone:
 *           type: string
 *           pattern: '^(\+84|84|0)(3|5|7|8|9)\d{8}$'
 *           description: Số điện thoại Việt Nam
 *           example: "0987654321"
 *         role:
 *           type: string
 *           enum: [ADMIN, CASHIER]
 *           description: Vai trò người dùng
 *           example: "CASHIER"
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *           example: true
 *           
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Mật khẩu mới
 *           example: "new_password_123"
 *           
 *     UserStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Tổng số người dùng
 *           example: 25
 *         active:
 *           type: integer
 *           description: Số người dùng đang hoạt động
 *           example: 22
 *         inactive:
 *           type: integer
 *           description: Số người dùng không hoạt động
 *           example: 3
 *         admins:
 *           type: integer
 *           description: Số quản trị viên
 *           example: 2
 *         cashiers:
 *           type: integer
 *           description: Số thu ngân
 *           example: 23
 *         newThisMonth:
 *           type: integer
 *           description: Số người dùng mới tháng này
 *           example: 3
 *           
 *     UsersListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy danh sách người dùng thành công"
 *         data:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             total:
 *               type: integer
 *               example: 25
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 20
 *             totalPages:
 *               type: integer
 *               example: 2
 *               
 *     UserStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy thống kê người dùng thành công"
 *         data:
 *           type: object
 *           properties:
 *             stats:
 *               $ref: '#/components/schemas/UserStats'
 */

export function createUserRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const userController = new UserController(prisma);

  // All user management routes require admin access
  router.use(authenticateToken);
  router.use(requireAdmin);

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Lấy danh sách người dùng
   *     description: Lấy danh sách người dùng với phân trang và tìm kiếm (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Số trang
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Số lượng items mỗi trang
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo username, email, họ tên
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [ADMIN, CASHIER]
   *         description: Lọc theo vai trò
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Lọc theo trạng thái hoạt động
   *     responses:
   *       200:
   *         description: Danh sách người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UsersListResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get all users
  router.get('/',
    asyncHandler(userController.getUsers.bind(userController))
  );

  /**
   * @swagger
   * /api/users/stats:
   *   get:
   *     summary: Lấy thống kê người dùng
   *     description: Lấy thống kê tổng quan về người dùng (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserStatsResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get user stats
  router.get('/stats',
    asyncHandler(userController.getUserStats.bind(userController))
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Lấy thông tin người dùng theo ID
   *     description: Lấy thông tin chi tiết của một người dùng dựa trên ID (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của người dùng
   *     responses:
   *       200:
   *         description: Thông tin người dùng
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get user by ID
  router.get('/:id',
    asyncHandler(userController.getUserById.bind(userController))
  );

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Tạo người dùng mới
   *     description: Tạo tài khoản người dùng mới (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       201:
   *         description: Tạo người dùng thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Dữ liệu không hợp lệ
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
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Username hoặc email đã tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Create new user
  router.post('/',
    ...validationChains.register,
    handleValidationErrors,
    asyncHandler(userController.createUser.bind(userController))
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Cập nhật thông tin người dùng
   *     description: Cập nhật thông tin người dùng (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của người dùng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserRequest'
   *     responses:
   *       200:
   *         description: Cập nhật người dùng thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Dữ liệu không hợp lệ
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
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Username hoặc email đã tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Update user
  router.put('/:id',
    ...validationChains.updateProfile,
    handleValidationErrors,
    asyncHandler(userController.updateUser.bind(userController))
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Xóa người dùng
   *     description: Xóa người dùng (chỉ Admin). Không thể xóa chính mình
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của người dùng
   *     responses:
   *       200:
   *         description: Xóa người dùng thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Không thể xóa chính mình
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
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Delete user
  router.delete('/:id',
    asyncHandler(userController.deleteUser.bind(userController))
  );

  /**
   * @swagger
   * /api/users/{id}/reset-password:
   *   put:
   *     summary: Reset mật khẩu người dùng
   *     description: Reset mật khẩu của người dùng (chỉ Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của người dùng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResetPasswordRequest'
   *     responses:
   *       200:
   *         description: Reset mật khẩu thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Dữ liệu không hợp lệ
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
   *         description: Không có quyền truy cập (chỉ Admin)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy người dùng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Reset user password
  router.put('/:id/reset-password',
    ...validationChains.resetPassword,
    handleValidationErrors,
    asyncHandler(userController.resetPassword.bind(userController))
  );

  return router;
}
