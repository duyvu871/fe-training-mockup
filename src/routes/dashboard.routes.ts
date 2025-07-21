/**
 * Dashboard routes
 * Routes for dashboard statistics and analytics
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { 
  authenticateToken,
  asyncHandler
} from '../middleware';

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Lấy thống kê dashboard thành công
 *         data:
 *           type: object
 *           properties:
 *             stats:
 *               $ref: '#/components/schemas/DashboardStats'
 *       
 *     TopProductsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Lấy sản phẩm bán chạy thành công
 *         data:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopSellingProduct'
 *                 
 *     RecentActivityResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Lấy hoạt động gần đây thành công
 *         data:
 *           type: object
 *           properties:
 *             activities:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentActivity'
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Lấy thống kê dashboard tổng quan
 *     description: |
 *       API này cung cấp các thống kê tổng quan cho dashboard bao gồm:
 *       - Doanh thu (hôm nay, tuần này, tháng này, tăng trưởng)
 *       - Đơn hàng (hôm nay, đang chờ, hoàn thành, đã hủy)
 *       - Sản phẩm (tổng số, sắp hết, hết hàng)
 *       - Khách hàng (tổng số, mới, quay lại)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStatsResponse'
 *             examples:
 *               success:
 *                 summary: Thành công
 *                 value:
 *                   success: true
 *                   message: "Lấy thống kê dashboard thành công"
 *                   data:
 *                     stats:
 *                       sales:
 *                         today: 15750000
 *                         thisWeek: 87500000
 *                         thisMonth: 245000000
 *                         growth: 12.5
 *                       orders:
 *                         today: 45
 *                         pending: 8
 *                         completed: 37
 *                         cancelled: 2
 *                       products:
 *                         total: 156
 *                         lowStock: 8
 *                         outOfStock: 3
 *                       customers:
 *                         total: 12
 *                         new: 4
 *                         returning: 8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats',
  asyncHandler(dashboardController.getDashboardStats.bind(dashboardController))
);

/**
 * @swagger
 * /api/dashboard/top-products:
 *   get:
 *     summary: Lấy danh sách sản phẩm bán chạy nhất
 *     description: |
 *       API này trả về danh sách các sản phẩm bán chạy nhất dựa trên doanh thu.
 *       Dữ liệu được tính toán từ các đơn hàng trong tháng hiện tại.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Số lượng sản phẩm bán chạy cần lấy (tối đa 20)
 *         example: 5
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm bán chạy thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopProductsResponse'
 *             examples:
 *               success:
 *                 summary: Thành công
 *                 value:
 *                   success: true
 *                   message: "Lấy sản phẩm bán chạy thành công"
 *                   data:
 *                     products:
 *                       - productId: "123e4567-e89b-12d3-a456-426614174000"
 *                         productName: "Cà phê sữa đá"
 *                         totalSold: 125
 *                         revenue: 3750000
 *                       - productId: "123e4567-e89b-12d3-a456-426614174001" 
 *                         productName: "Trà sữa trân châu"
 *                         totalSold: 98
 *                         revenue: 2940000
 *       400:
 *         description: Tham số không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_limit:
 *                 summary: Limit không hợp lệ
 *                 value:
 *                   success: false
 *                   message: "Limit phải từ 1 đến 20"
 *                   error: "VALIDATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/top-products',
  asyncHandler(dashboardController.getTopSellingProducts.bind(dashboardController))
);

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Lấy danh sách hoạt động gần đây
 *     description: |
 *       API này trả về danh sách các hoạt động gần đây bao gồm:
 *       - Đơn hàng mới được tạo
 *       - Thanh toán được xác nhận  
 *       - Hoạt động xuất nhập kho
 *       
 *       Dữ liệu được sắp xếp theo thời gian từ mới nhất đến cũ nhất.
 *     tags: [Dashboard]
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
 *         description: Số lượng hoạt động cần lấy (tối đa 50)
 *         example: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách hoạt động thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecentActivityResponse'
 *             examples:
 *               success:
 *                 summary: Thành công
 *                 value:
 *                   success: true
 *                   message: "Lấy hoạt động gần đây thành công"
 *                   data:
 *                     activities:
 *                       - type: "payment"
 *                         description: "Đơn hàng #12345678 - Nguyễn Văn A"
 *                         amount: 150000
 *                         timestamp: "2025-01-20T14:30:00.000Z"
 *                       - type: "stock"
 *                         description: "Nhập kho - Cà phê sữa đá"
 *                         amount: 50
 *                         timestamp: "2025-01-20T13:15:00.000Z"
 *                       - type: "order"
 *                         description: "Đơn hàng #12345677 - Trần Thị B"
 *                         amount: 85000
 *                         timestamp: "2025-01-20T12:45:00.000Z"
 *       400:
 *         description: Tham số không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_limit:
 *                 summary: Limit không hợp lệ
 *                 value:
 *                   success: false
 *                   message: "Limit phải từ 1 đến 50"
 *                   error: "VALIDATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/recent-activity',
  asyncHandler(dashboardController.getRecentActivity.bind(dashboardController))
);

export { router as dashboardRoutes };
