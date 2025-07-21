/**
 * Dashboard Controller
 * Handles dashboard-related HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { createSuccessResponse } from '../utils/helpers';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.dashboardService.getDashboardStats();

      logger.info('Dashboard stats retrieved successfully');

      res.status(200).json(
        createSuccessResponse({ stats }, 'Lấy thống kê dashboard thành công')
      );
    } catch (error) {
      logger.error('Get dashboard stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }

  /**
   * GET /api/dashboard/top-products
   * Get top selling products
   */
  async getTopSellingProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (limit < 1 || limit > 20) {
        throw new ValidationError('Limit phải từ 1 đến 20');
      }

      const topProducts = await this.dashboardService.getTopSellingProducts(limit);

      logger.info('Top selling products retrieved successfully', { limit, count: topProducts.length });

      res.status(200).json(
        createSuccessResponse({ products: topProducts }, 'Lấy sản phẩm bán chạy thành công')
      );
    } catch (error) {
      logger.error('Get top selling products failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }

  /**
   * GET /api/dashboard/recent-activity
   * Get recent sales and stock activity
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (limit < 1 || limit > 50) {
        throw new ValidationError('Limit phải từ 1 đến 50');
      }

      const activities = await this.dashboardService.getRecentActivity(limit);

      logger.info('Recent activity retrieved successfully', { limit, count: activities.length });

      res.status(200).json(
        createSuccessResponse({ activities }, 'Lấy hoạt động gần đây thành công')
      );
    } catch (error) {
      logger.error('Get recent activity failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }
}
