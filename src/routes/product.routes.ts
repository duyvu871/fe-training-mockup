/**
 * Product Routes - /api/products
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProductController } from '../controllers/product.controller';
import { 
  authenticateToken,
  requireAdmin,
  handleValidationErrors,
  validationChains, 
  requireRoles
} from '../middleware';
import { asyncHandler } from '../middleware/error.middleware';

export function createProductRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const productController = new ProductController(prisma);

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Lấy danh sách sản phẩm
   *     description: Lấy danh sách sản phẩm với phân trang và tìm kiếm
   *     tags: [Products]
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
   *         description: Tìm kiếm theo tên hoặc SKU
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Lọc theo danh mục
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Lọc theo trạng thái active
   *     responses:
   *       200:
   *         description: Danh sách sản phẩm
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         products:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/Product'
   *                         pagination:
   *                           $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get all products (protected)
  router.get('/',
    authenticateToken,
    asyncHandler(productController.getProducts.bind(productController))
  );

  /**
   * @swagger
   * /api/products/low-stock:
   *   get:
   *     summary: Lấy sản phẩm sắp hết hàng
   *     description: Lấy danh sách sản phẩm có tồn kho <= minStock
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách sản phẩm sắp hết
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get low stock products (protected)
  router.get('/low-stock',
    authenticateToken,
    asyncHandler(productController.getLowStockProducts.bind(productController))
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Lấy thông tin sản phẩm theo ID
   *     description: Lấy thông tin chi tiết của một sản phẩm dựa trên ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của sản phẩm
   *     responses:
   *       200:
   *         description: Thông tin sản phẩm
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Sản phẩm không tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get product by ID (protected)
  router.get('/:id',
    authenticateToken,
    asyncHandler(productController.getProductById.bind(productController))
  );

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Tạo sản phẩm mới
   *     description: Thêm một sản phẩm mới vào hệ thống
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProductCreate'
   *     responses:
   *       201:
   *         description: Sản phẩm được tạo thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       400:
   *         description: Dữ liệu đầu vào không hợp lệ
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
   *         description: Không đủ quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Create new product (Admin only)
  router.post('/',
    authenticateToken,
    requireAdmin,
    ...validationChains.createProduct,
    handleValidationErrors,
    asyncHandler(productController.createProduct.bind(productController))
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: Cập nhật thông tin sản phẩm
   *     description: Cập nhật thông tin của một sản phẩm dựa trên ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của sản phẩm
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProductUpdate'
   *     responses:
   *       200:
   *         description: Sản phẩm được cập nhật thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       400:
   *         description: Dữ liệu đầu vào không hợp lệ
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
   *         description: Không đủ quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Sản phẩm không tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Update product (Admin only)
  router.put('/:id',
    authenticateToken,
    requireAdmin,
    ...validationChains.updateProduct,
    handleValidationErrors,
    asyncHandler(productController.updateProduct.bind(productController))
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Xóa sản phẩm
   *     description: Xóa một sản phẩm khỏi hệ thống
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của sản phẩm
   *     responses:
   *       204:
   *         description: Sản phẩm được xóa thành công
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không đủ quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Sản phẩm không tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Delete product (Admin only)
  router.delete('/:id',
    authenticateToken,
    requireAdmin,
    asyncHandler(productController.deleteProduct.bind(productController))
  );

  /**
   * @swagger
   * /api/products/{id}/stock:
   *   put:
   *     summary: Cập nhật tồn kho sản phẩm
   *     description: Cập nhật số lượng tồn kho của một sản phẩm dựa trên ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của sản phẩm
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *             required:
   *               - stock
   *     responses:
   *       200:
   *         description: Tồn kho sản phẩm được cập nhật thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       400:
   *         description: Dữ liệu đầu vào không hợp lệ
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
   *         description: Không đủ quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Sản phẩm không tồn tại
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Update product stock (Admin only)
  router.put('/:id/stock',
    authenticateToken,
    requireAdmin,
    asyncHandler(productController.updateStock.bind(productController))
  );

  return router;
}
