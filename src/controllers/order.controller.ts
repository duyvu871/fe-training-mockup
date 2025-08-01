/**
 * Order Controller - Handles order-related endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  ValidationError,
  NotFoundError,
  ForbiddenError, 
  ConflictError 
} from '../utils/errors';
import { validatePaginationParams } from '../utils/validation';

export class OrderController {
  private orderService: OrderService;

  constructor(prisma: PrismaClient) {
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const stockMovementRepository = new StockMovementRepository(prisma);
    this.orderService = new OrderService(orderRepository, productRepository, stockMovementRepository);
  }

  /**
   * Get all orders with pagination and filters
   * GET /api/orders
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status, userId, dateFrom, dateTo, sortBy, sortOrder, customerName } = req.query;

      // Validate pagination
      const { validatedPage, validatedLimit } = validatePaginationParams(
        Number(page),
        Number(limit)
      );

      const options: any = {
        page: validatedPage,
        limit: validatedLimit
      };

      if (status) options.status = status as OrderStatus;
      if (userId) options.userId = userId as string;
      if (dateFrom) options.dateFrom = new Date(dateFrom as string);
      if (dateTo) options.dateTo = new Date(dateTo as string);
      if (sortBy) options.sortBy = sortBy as 'createdAt' | 'total' | 'status';
      if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';
      if (customerName) options.customerName = customerName as string;

      const result = await this.orderService.getOrders(options);

      logger.info('Orders retrieved successfully', {
        page: validatedPage,
        limit: validatedLimit,
        total: result.total,
        options
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy danh sách đơn hàng thành công')
      );
    } catch (error) {
      logger.error('Get orders failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      const order = await this.orderService.getOrderById(id);

      logger.info('Order retrieved by ID', { orderId: id });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ order }, 'Lấy thông tin đơn hàng thành công')
      );
    } catch (error) {
      logger.error('Get order by ID failed', {
        error: (error as Error).message,
        orderId: req.params.id
      });
      next(error);
    }
  }

  /**
   * Create new order
   * POST /api/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerName, customerPhone, items, discount, paymentMethod, notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('Không tìm thấy thông tin người dùng');
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Danh sách sản phẩm là bắt buộc');
      }

      if (!paymentMethod) {
        throw new ValidationError('Phương thức thanh toán là bắt buộc');
      }

      // Validate items - must include price
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0 || !item.price) {
          throw new ValidationError('Mỗi sản phẩm phải có productId, số lượng và giá hợp lệ');
        }
      }

      const orderData = {
        createdById: userId,
        items,
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        discount: discount || 0,
        paymentMethod,
        notes: notes?.trim() || undefined
      };

      const orderSummary = await this.orderService.createOrder(orderData);

      logger.info('Order created successfully', {
        orderId: orderSummary.order.id,
        total: orderSummary.summary.total,
        itemsCount: items.length,
        userId,
        customerName
      });

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse(orderSummary, 'Tạo đơn hàng mới thành công')
      );
    } catch (error) {
      logger.error('Create order failed', {
        error: (error as Error).message,
        orderData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update order status
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      if (!status) {
        throw new ValidationError('Trạng thái đơn hàng là bắt buộc');
      }

      // Check permissions for status updates
      const user = req.user;
      const isAdmin = user?.role === 'ADMIN';
      
      // Get current order to check current status
      const currentOrder = await this.orderService.getOrderById(id);
      
      // Non-admin users can only update PENDING orders to COMPLETED
      if (!isAdmin) {
        if (currentOrder.status !== 'PENDING' || status !== 'COMPLETED') {
          throw new ForbiddenError('Bạn chỉ có thể xác nhận thanh toán cho đơn hàng chờ thanh toán');
        }
      }

      const order = await this.orderService.updateOrderStatus(id, status as OrderStatus, notes);

      logger.info('Order status updated successfully', {
        orderId: id,
        previousStatus: currentOrder.status,
        newStatus: status,
        userId: req.user?.userId,
        isAdmin
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ order }, 'Cập nhật trạng thái đơn hàng thành công')
      );
    } catch (error) {
      logger.error('Update order status failed', {
        error: (error as Error).message,
        orderId: req.params.id,
        status: req.body.status,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Cancel order
   * PUT /api/orders/:id/cancel
   */
  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      const order = await this.orderService.cancelOrder(id, reason);

      logger.info('Order cancelled successfully', {
        orderId: id,
        reason,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ order }, 'Hủy đơn hàng thành công')
      );
    } catch (error) {
      logger.error('Cancel order failed', {
        error: (error as Error).message,
        orderId: req.params.id,
        reason: req.body.reason,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get order statistics
   * GET /api/orders/stats
   */
  async getOrderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const dateFrom = startDate ? new Date(startDate as string) : undefined;
      const dateTo = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.orderService.getOrderStats(dateFrom, dateTo);

      logger.info('Order stats retrieved', { startDate, endDate });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ stats }, 'Lấy thống kê đơn hàng thành công')
      );
    } catch (error) {
      logger.error('Get order stats failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get daily sales report
   * GET /api/orders/reports/daily
   */
  async getDailySalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      // Create start and end of day
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      // Get stats for the specific date
      const stats = await this.orderService.getOrderStats(startOfDay, endOfDay);

      const report = {
        date: targetDate,
        ...stats
      };

      logger.info('Daily sales report retrieved', { date: targetDate });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ report }, 'Lấy báo cáo bán hàng hàng ngày thành công')
      );
    } catch (error) {
      logger.error('Get daily sales report failed', {
        error: (error as Error).message,
        date: req.query.date
      });
      next(error);
    }
  }
}
