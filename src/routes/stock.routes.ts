/**
 * Stock Routes
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { StockController } from '../controllers/stock.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { param } from 'express-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     StockMovement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID của stock movement
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID sản phẩm
 *           example: "abc12345-e89b-12d3-a456-426614174003"
 *         type:
 *           type: string
 *           enum: [IN, OUT, ADJUSTMENT]
 *           description: Loại movement
 *           example: "IN"
 *         quantity:
 *           type: integer
 *           description: Số lượng thay đổi
 *           example: 50
 *         beforeQuantity:
 *           type: integer
 *           description: Số lượng trước khi thay đổi
 *           example: 100
 *         afterQuantity:
 *           type: integer
 *           description: Số lượng sau khi thay đổi
 *           example: 150
 *         reason:
 *           type: string
 *           description: Lý do thay đổi
 *           example: "Nhập hàng từ nhà cung cấp"
 *         notes:
 *           type: string
 *           description: Ghi chú
 *           example: "Hàng chất lượng tốt"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID người thực hiện
 *           example: "456e7890-e89b-12d3-a456-426614174001"
 *         orderId:
 *           type: string
 *           format: uuid
 *           description: ID đơn hàng (nếu có)
 *           example: "789e1234-e89b-12d3-a456-426614174002"
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 *           example: "2025-01-20T14:30:00.000Z"
 *           
 *     StockAdjustmentRequest:
 *       type: object
 *       required:
 *         - productId
 *         - newQuantity
 *         - reason
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID sản phẩm
 *           example: "abc12345-e89b-12d3-a456-426614174003"
 *         newQuantity:
 *           type: integer
 *           minimum: 0
 *           description: Số lượng mới
 *           example: 120
 *         reason:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: Lý do điều chỉnh
 *           example: "Kiểm kê định kỳ"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Ghi chú
 *           example: "Phát hiện hàng bị hỏng"
 *           
 *     StockStats:
 *       type: object
 *       properties:
 *         totalProducts:
 *           type: integer
 *           description: Tổng số sản phẩm
 *           example: 150
 *         totalMovements:
 *           type: integer
 *           description: Tổng số movement hôm nay
 *           example: 25
 *         lowStockCount:
 *           type: integer
 *           description: Số sản phẩm sắp hết hàng
 *           example: 8
 *         outOfStockCount:
 *           type: integer
 *           description: Số sản phẩm hết hàng
 *           example: 3
 *         totalStockValue:
 *           type: number
 *           format: decimal
 *           description: Tổng giá trị kho
 *           example: 50000000
 *         movementsToday:
 *           type: integer
 *           description: Số movement hôm nay
 *           example: 12
 *           
 *     DailyStockReport:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Ngày báo cáo
 *           example: "2025-01-20"
 *         totalMovements:
 *           type: integer
 *           description: Tổng số movement
 *           example: 35
 *         inMovements:
 *           type: integer
 *           description: Số movement nhập kho
 *           example: 15
 *         outMovements:
 *           type: integer
 *           description: Số movement xuất kho
 *           example: 18
 *         adjustmentMovements:
 *           type: integer
 *           description: Số movement điều chỉnh
 *           example: 2
 *         topProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Cà phê đen"
 *               movementCount:
 *                 type: integer
 *                 example: 8
 *                 
 *     MostActiveProduct:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID sản phẩm
 *           example: "abc12345-e89b-12d3-a456-426614174003"
 *         productName:
 *           type: string
 *           description: Tên sản phẩm
 *           example: "Cà phê đen"
 *         movementCount:
 *           type: integer
 *           description: Số lượng movement
 *           example: 25
 *         lastMovementAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian movement cuối
 *           example: "2025-01-20T14:30:00.000Z"
 */

export function createStockRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const stockController = new StockController(prisma);

  // All stock routes require authentication
  router.use(authenticateToken);

  // ==========================================
  // STOCK MOVEMENT ROUTES
  // ==========================================

  /**
   * @swagger
   * /api/stock/movements:
   *   get:
   *     summary: Lấy danh sách tất cả movement kho
   *     description: Lấy danh sách movement kho với phân trang và tìm kiếm
   *     tags: [Stock]
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
   *         name: type
   *         schema:
   *           type: string
   *           enum: [IN, OUT, ADJUSTMENT]
   *         description: Lọc theo loại movement
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Lọc theo sản phẩm
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Từ ngày (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Đến ngày (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Danh sách movement kho
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
   *                         movements:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/StockMovement'
   *                         pagination:
   *                           $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/movements', 
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.getStockMovements.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/adjustment:
   *   post:
   *     summary: Tạo stock adjustment
   *     description: Tạo điều chỉnh tồn kho cho sản phẩm
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StockAdjustmentRequest'
   *     responses:
   *       201:
   *         description: Tạo adjustment thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/StockMovement'
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
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy sản phẩm
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/adjustment',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.createStockAdjustment.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/movements/{id}:
   *   get:
   *     summary: Lấy thông tin movement kho theo ID
   *     description: Lấy thông tin chi tiết của một movement kho dựa trên ID
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của movement
   *     responses:
   *       200:
   *         description: Thông tin movement kho
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/StockMovement'
   *       400:
   *         description: ID không hợp lệ
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
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy movement
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/movements/:id',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    param('id').isUUID().withMessage('ID phải là UUID hợp lệ'),
    stockController.getStockMovementById.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/movements/today:
   *   get:
   *     summary: Lấy movement kho hôm nay
   *     description: Lấy danh sách tất cả movement kho trong ngày hôm nay
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách movement hôm nay
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
   *                         $ref: '#/components/schemas/StockMovement'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/movements/today',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.getTodayMovements.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/stats:
   *   get:
   *     summary: Lấy thống kê kho
   *     description: Lấy thống kê tổng quan về tình trạng kho hàng
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê kho hàng
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/StockStats'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/stats',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.getStockStats.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/daily-report:
   *   get:
   *     summary: Lấy báo cáo hàng ngày
   *     description: Lấy báo cáo hoạt động kho hàng trong ngày
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *         description: Ngày báo cáo (YYYY-MM-DD), mặc định là hôm nay
   *     responses:
   *       200:
   *         description: Báo cáo hoạt động kho hàng
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DailyStockReport'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/daily-report',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.getDailyReport.bind(stockController)
  );

  /**
   * @swagger
   * /api/stock/most-active:
   *   get:
   *     summary: Lấy sản phẩm có nhiều hoạt động nhất
   *     description: Lấy danh sách sản phẩm có nhiều movement trong khoảng thời gian
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Số lượng sản phẩm trả về
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 7
   *         description: Số ngày tính từ hôm nay
   *     responses:
   *       200:
   *         description: Danh sách sản phẩm hoạt động nhiều nhất
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
   *                         $ref: '#/components/schemas/MostActiveProduct'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/most-active',
    requireRoles('ADMIN', 'OWNER', 'MANAGER'),
    stockController.getMostActiveProducts.bind(stockController)
  );

  return router;
}
