/**
 * Stock Controller - Handles stock movement endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { StockMovementService } from '../services/stock-movement.service';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { ProductRepository } from '../repositories/product.repository';
import { PrismaClient, StockMovementType } from '@prisma/client';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../utils/errors';
import { validatePaginationParams } from '../utils/validation';

export class StockController {
  private stockMovementService: StockMovementService;

  constructor(prisma: PrismaClient) {
    const stockMovementRepository = new StockMovementRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    this.stockMovementService = new StockMovementService(stockMovementRepository, productRepository);
  }

  /**
   * Get all stock movements with pagination and filters
   * GET /api/stock/movements
   */
  async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, productId, type, startDate, endDate, sortBy, sortOrder } = req.query;

      // Validate pagination
      const { validatedPage, validatedLimit } = validatePaginationParams(
        Number(page),
        Number(limit)
      );

      const options: any = {
        page: validatedPage,
        limit: validatedLimit
      };

      if (productId) options.productId = productId as string;
      if (type) options.type = type as StockMovementType;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (sortBy) options.sortBy = sortBy as 'createdAt' | 'quantity' | 'type';
      if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.stockMovementService.getStockMovements(options);

      logger.info('Stock movements retrieved successfully', {
        page: validatedPage,
        limit: validatedLimit,
        total: result.total,
        options
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy danh sách biến động kho thành công')
      );
    } catch (error) {
      logger.error('Get stock movements failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get stock movement by ID
   * GET /api/stock/movements/:id
   */
  async getStockMovementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID biến động kho là bắt buộc');
      }

      const movement = await this.stockMovementService.getStockMovementById(id);

      logger.info('Stock movement retrieved by ID', { movementId: id });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ movement }, 'Lấy thông tin biến động kho thành công')
      );
    } catch (error) {
      logger.error('Get stock movement by ID failed', {
        error: (error as Error).message,
        movementId: req.params.id
      });
      next(error);
    }
  }

  /**
   * Create stock adjustment
   * POST /api/stock/adjustments
   */
  async createStockAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity, type, reason, reference } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('Không tìm thấy thông tin người dùng');
      }

      if (!productId || quantity === undefined || !type || !reason) {
        throw new ValidationError('Mã sản phẩm, số lượng, loại và lý do là bắt buộc');
      }

      if (quantity === 0) {
        throw new ValidationError('Số lượng phải khác 0');
      }

      const adjustmentData = {
        productId,
        quantity: Number(quantity),
        type: type as StockMovementType,
        reason: reason.trim(),
        reference: reference ? reference.trim() : undefined,
        createdById: userId
      };

      const movement = await this.stockMovementService.createStockMovement(adjustmentData);

      logger.info('Stock adjustment created successfully', {
        movementId: movement.id,
        productId,
        quantity: Number(quantity),
        type,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse({ movement }, 'Tạo điều chỉnh kho thành công')
      );
    } catch (error) {
      logger.error('Create stock adjustment failed', {
        error: (error as Error).message,
        adjustmentData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get stock movements by product
   * GET /api/stock/products/:productId/movements
   */
  async getMovementsByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, type, startDate, endDate } = req.query;

      if (!productId) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      // Validate pagination
      const { validatedPage, validatedLimit } = validatePaginationParams(
        Number(page),
        Number(limit)
      );

      const options: any = {
        page: validatedPage,
        limit: validatedLimit,
        productId
      };

      if (type) options.type = type as StockMovementType;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await this.stockMovementService.getStockMovements(options);

      logger.info('Product stock movements retrieved', {
        productId,
        total: result.total
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy lịch sử biến động kho sản phẩm thành công')
      );
    } catch (error) {
      logger.error('Get movements by product failed', {
        error: (error as Error).message,
        productId: req.params.productId,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get today's stock movements
   * GET /api/stock/movements/today
   */
  async getTodayMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await this.stockMovementService.getTodayMovements();

      logger.info('Today stock movements retrieved', {
        count: movements.length
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ movements }, 'Lấy biến động kho hôm nay thành công')
      );
    } catch (error) {
      logger.error('Get today movements failed', {
        error: (error as Error).message
      });
      next(error);
    }
  }

  /**
   * Get stock movement statistics
   * GET /api/stock/stats
   */
  async getStockStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const stats = await this.stockMovementService.getStockMovementStats(options.startDate, options.endDate);

      logger.info('Stock stats retrieved', { options });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ stats }, 'Lấy thống kê biến động kho thành công')
      );
    } catch (error) {
      logger.error('Get stock stats failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get daily stock report
   * GET /api/stock/reports/daily
   */
  async getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      const report = await this.stockMovementService.getDailyReport(30);

      logger.info('Daily stock report retrieved', { date: targetDate });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ report }, 'Lấy báo cáo kho hàng ngày thành công')
      );
    } catch (error) {
      logger.error('Get daily report failed', {
        error: (error as Error).message,
        date: req.query.date
      });
      next(error);
    }
  }

  /**
   * Get most active products (products with most movements)
   * GET /api/stock/products/most-active
   */
  async getMostActiveProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, startDate, endDate } = req.query;

      const options: any = {
        limit: Number(limit)
      };

      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const products = await this.stockMovementService.getMostActiveProducts(Number(limit));

      logger.info('Most active products retrieved', {
        count: products.length,
        options
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ products }, 'Lấy sản phẩm hoạt động nhiều nhất thành công')
      );
    } catch (error) {
      logger.error('Get most active products failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }
}
