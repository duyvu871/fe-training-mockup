/**
 * Category Routes - /api/categories
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategoryController } from '../controllers/category.controller';
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
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID danh mục
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Tên danh mục
 *           example: "Đồ uống"
 *         description:
 *           type: string
 *           description: Mô tả danh mục
 *           example: "Các loại đồ uống nóng và lạnh"
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *           example: true
 *         productCount:
 *           type: integer
 *           description: Số sản phẩm trong danh mục
 *           example: 15
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
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Tên danh mục (duy nhất)
 *           example: "Thực phẩm khô"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Mô tả danh mục
 *           example: "Các loại thực phẩm khô, gia vị"
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *           example: true
 *           default: true
 *           
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Tên danh mục (duy nhất)
 *           example: "Thực phẩm khô - cập nhật"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Mô tả danh mục
 *           example: "Các loại thực phẩm khô, gia vị - đã cập nhật"
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *           example: true
 *           
 *     CategoryStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Tổng số danh mục
 *           example: 8
 *         active:
 *           type: integer
 *           description: Số danh mục đang hoạt động
 *           example: 7
 *         inactive:
 *           type: integer
 *           description: Số danh mục không hoạt động
 *           example: 1
 *         withProducts:
 *           type: integer
 *           description: Số danh mục có sản phẩm
 *           example: 6
 *         withoutProducts:
 *           type: integer
 *           description: Số danh mục không có sản phẩm
 *           example: 2
 *         mostProductsCategory:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Đồ uống"
 *             productCount:
 *               type: integer
 *               example: 25
 *           description: Danh mục có nhiều sản phẩm nhất
 *           
 *     CategoriesListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy danh sách danh mục thành công"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *             
 *     CategoryStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy thống kê danh mục thành công"
 *         data:
 *           type: object
 *           properties:
 *             stats:
 *               $ref: '#/components/schemas/CategoryStats'
 */

export function createCategoryRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const categoryController = new CategoryController(prisma);

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Lấy danh sách danh mục
   *     description: Lấy danh sách tất cả danh mục sản phẩm
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Lọc theo trạng thái hoạt động
   *     responses:
   *       200:
   *         description: Danh sách danh mục
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CategoriesListResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get all categories (protected)
  router.get('/',
    authenticateToken,
    asyncHandler(categoryController.getCategories.bind(categoryController))
  );

  /**
   * @swagger
   * /api/categories/stats:
   *   get:
   *     summary: Lấy thống kê danh mục
   *     description: Lấy thống kê tổng quan về danh mục sản phẩm (chỉ Admin)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê danh mục
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CategoryStatsResponse'
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
  // Get category stats (Admin only)
  router.get('/stats',
    authenticateToken,
    requireAdmin,
    asyncHandler(categoryController.getCategoryStats.bind(categoryController))
  );

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Lấy thông tin danh mục theo ID
   *     description: Lấy thông tin chi tiết của một danh mục dựa trên ID
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của danh mục
   *     responses:
   *       200:
   *         description: Thông tin danh mục
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy danh mục
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get category by ID (protected)
  router.get('/:id',
    authenticateToken,
    asyncHandler(categoryController.getCategoryById.bind(categoryController))
  );

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Tạo danh mục mới
   *     description: Tạo danh mục sản phẩm mới (chỉ Admin)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryRequest'
   *     responses:
   *       201:
   *         description: Tạo danh mục thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
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
   *         description: Tên danh mục đã tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Create new category (Admin only)
  router.post('/',
    authenticateToken,
    requireAdmin,
    ...validationChains.createCategory,
    handleValidationErrors,
    asyncHandler(categoryController.createCategory.bind(categoryController))
  );

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Cập nhật danh mục
   *     description: Cập nhật thông tin danh mục (chỉ Admin)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của danh mục
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCategoryRequest'
   *     responses:
   *       200:
   *         description: Cập nhật danh mục thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
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
   *         description: Không tìm thấy danh mục
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Tên danh mục đã tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Update category (Admin only)
  router.put('/:id',
    authenticateToken,
    requireAdmin,
    ...validationChains.updateCategory,
    handleValidationErrors,
    asyncHandler(categoryController.updateCategory.bind(categoryController))
  );

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Xóa danh mục
   *     description: Xóa danh mục (chỉ Admin). Chỉ xóa được danh mục không có sản phẩm
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của danh mục
   *     responses:
   *       200:
   *         description: Xóa danh mục thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Không thể xóa danh mục có sản phẩm
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
   *         description: Không tìm thấy danh mục
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Delete category (Admin only)
  router.delete('/:id',
    authenticateToken,
    requireAdmin,
    asyncHandler(categoryController.deleteCategory.bind(categoryController))
  );

  return router;
}
