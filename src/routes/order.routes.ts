/**
 * Order Routes - /api/orders
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { OrderController } from '../controllers/order.controller';
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
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID đơn hàng
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         orderNumber:
 *           type: string
 *           description: Số đơn hàng (auto-generated)
 *           example: "ORD-20250120-001"
 *         customerName:
 *           type: string
 *           description: Tên khách hàng
 *           example: "Nguyễn Văn A"
 *         customerPhone:
 *           type: string
 *           description: SĐT khách hàng
 *           example: "0987654321"
 *         totalAmount:
 *           type: number
 *           format: decimal
 *           description: Tổng tiền
 *           example: 150000
 *         discountAmount:
 *           type: number
 *           format: decimal
 *           description: Tiền giảm giá
 *           example: 15000
 *         finalAmount:
 *           type: number
 *           format: decimal
 *           description: Tiền thanh toán cuối
 *           example: 135000
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD, TRANSFER]
 *           description: Phương thức thanh toán
 *           example: "CASH"
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED, REFUNDED]
 *           description: Trạng thái đơn hàng
 *           example: "COMPLETED"
 *         notes:
 *           type: string
 *           description: Ghi chú
 *           example: "Khách hàng VIP"
 *         cashierId:
 *           type: string
 *           format: uuid
 *           description: ID thu ngân
 *           example: "456e7890-e89b-12d3-a456-426614174001"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         cashier:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 *           example: "2025-01-20T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật
 *           example: "2025-01-20T14:30:00.000Z"
 *           
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID item đơn hàng
 *           example: "789e1234-e89b-12d3-a456-426614174002"
 *         orderId:
 *           type: string
 *           format: uuid
 *           description: ID đơn hàng
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID sản phẩm
 *           example: "abc12345-e89b-12d3-a456-426614174003"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Số lượng
 *           example: 2
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           description: Đơn giá
 *           example: 50000
 *         totalPrice:
 *           type: number
 *           format: decimal
 *           description: Thành tiền
 *           example: 100000
 *         product:
 *           $ref: '#/components/schemas/Product'
 *           
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *         - paymentMethod
 *       properties:
 *         customerName:
 *           type: string
 *           maxLength: 255
 *           description: Tên khách hàng
 *           example: "Nguyễn Văn A"
 *         customerPhone:
 *           type: string
 *           pattern: '^(\+84|84|0)(3|5|7|8|9)\d{8}$'
 *           description: SĐT khách hàng (optional)
 *           example: "0987654321"
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - unitPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID sản phẩm
 *                 example: "abc12345-e89b-12d3-a456-426614174003"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Số lượng
 *                 example: 2
 *               unitPrice:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Đơn giá
 *                 example: 50000
 *         discountAmount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Tiền giảm giá
 *           example: 15000
 *           default: 0
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD, TRANSFER]
 *           description: Phương thức thanh toán
 *           example: "CASH"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Ghi chú
 *           example: "Khách hàng VIP"
 *           
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED, REFUNDED]
 *           description: Trạng thái mới của đơn hàng
 *           example: "COMPLETED"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Ghi chú khi cập nhật trạng thái
 *           example: "Thanh toán thành công"
 *           
 *     OrderStats:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *           description: Tổng số đơn hàng
 *           example: 150
 *         completedOrders:
 *           type: integer
 *           description: Số đơn đã hoàn thành
 *           example: 140
 *         pendingOrders:
 *           type: integer
 *           description: Số đơn đang chờ
 *           example: 5
 *         cancelledOrders:
 *           type: integer
 *           description: Số đơn đã hủy
 *           example: 5
 *         totalRevenue:
 *           type: number
 *           format: decimal
 *           description: Tổng doanh thu
 *           example: 15000000
 *         todayOrders:
 *           type: integer
 *           description: Đơn hàng hôm nay
 *           example: 25
 *         todayRevenue:
 *           type: number
 *           format: decimal
 *           description: Doanh thu hôm nay
 *           example: 2500000
 *           
 *     OrdersListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy danh sách đơn hàng thành công"
 *         data:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *             total:
 *               type: integer
 *               example: 150
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 20
 *             totalPages:
 *               type: integer
 *               example: 8
 *              
 *     OrderStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Lấy thống kê đơn hàng thành công"
 *         data:
 *           type: object
 *           properties:
 *             stats:
 *               $ref: '#/components/schemas/OrderStats'
 *               
 *     DailySalesReport:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Ngày báo cáo
 *           example: "2025-01-20"
 *         totalOrders:
 *           type: integer
 *           description: Tổng số đơn
 *           example: 25
 *         totalRevenue:
 *           type: number
 *           format: decimal
 *           description: Tổng doanh thu
 *           example: 2500000
 *         averageOrderValue:
 *           type: number
 *           format: decimal
 *           description: Giá trị đơn hàng trung bình
 *           example: 100000
 */

export function createOrderRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const orderController = new OrderController(prisma);

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Lấy danh sách đơn hàng
   *     description: Lấy danh sách đơn hàng với phân trang và tìm kiếm
   *     tags: [Orders]
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
   *         description: Tìm kiếm theo số đơn hoặc tên KH
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, COMPLETED, CANCELLED, REFUNDED]
   *         description: Lọc theo trạng thái
   *       - in: query
   *         name: paymentMethod
   *         schema:
   *           type: string
   *           enum: [CASH, CARD, TRANSFER]
   *         description: Lọc theo phương thức thanh toán
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
   *         description: Danh sách đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrdersListResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get all orders (protected)
  router.get('/',
    authenticateToken,
    asyncHandler(orderController.getOrders.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders/stats:
   *   get:
   *     summary: Lấy thống kê đơn hàng
   *     description: Lấy thống kê tổng quan về đơn hàng và doanh thu
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderStatsResponse'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get order stats (protected)
  router.get('/stats',
    authenticateToken,
    asyncHandler(orderController.getOrderStats.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders/reports/daily:
   *   get:
   *     summary: Báo cáo doanh thu hàng ngày
   *     description: Lấy báo cáo doanh thu và đơn hàng theo ngày
   *     tags: [Orders]
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
   *         description: Báo cáo doanh thu hàng ngày
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/DailySalesReport'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get daily sales report (protected)
  router.get('/reports/daily',
    authenticateToken,
    asyncHandler(orderController.getDailySalesReport.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Lấy thông tin đơn hàng theo ID
   *     description: Lấy thông tin chi tiết của một đơn hàng dựa trên ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của đơn hàng
   *     responses:
   *       200:
   *         description: Thông tin đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Order'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get order by ID (protected)
  router.get('/:id',
    authenticateToken,
    asyncHandler(orderController.getOrderById.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Tạo đơn hàng mới
   *     description: Tạo đơn hàng mới từ giỏ hàng POS
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       201:
   *         description: Tạo đơn hàng thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Order'
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
   */
  // Create new order (protected)
  router.post('/',
    authenticateToken,
    ...validationChains.createOrder,
    handleValidationErrors,
    asyncHandler(orderController.createOrder.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   post:
   *     summary: Cập nhật trạng thái đơn hàng
   *     description: Cập nhật trạng thái đơn hàng (Admin có thể cập nhật mọi trạng thái, User chỉ có thể chuyển PENDING → COMPLETED)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của đơn hàng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
   *     responses:
   *       200:
   *         description: Cập nhật trạng thái thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Order'
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
   *         description: Không có quyền thực hiện
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Không tìm thấy đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // post order status (Admin for all, User for PENDING->COMPLETED only)
  router.post('/:id/status',
    authenticateToken,
    ...validationChains.updateOrderStatus,
    handleValidationErrors,
    asyncHandler(orderController.updateOrderStatus.bind(orderController))
  );

  /**
   * @swagger
   * /api/orders/{id}/cancel:
   *   post:
   *     summary: Hủy đơn hàng
   *     description: Hủy đơn hàng và hoàn lại tồn kho
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID của đơn hàng
   *     responses:
   *       200:
   *         description: Hủy đơn hàng thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Order'
   *       400:
   *         description: Không thể hủy đơn hàng
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
   *       404:
   *         description: Không tìm thấy đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Cancel order (protected)
  router.post('/:id/cancel',
    authenticateToken,
    asyncHandler(orderController.cancelOrder.bind(orderController))
  );

  return router;
}
