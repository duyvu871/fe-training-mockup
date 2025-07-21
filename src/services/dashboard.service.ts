/**
 * Dashboard Service
 * Aggregates data from multiple services for dashboard stats
 */

import { PrismaClient } from '@prisma/client';
import { DashboardStats } from '../types/database.types';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { UserService } from './user.service';
import { StockMovementService } from './stock-movement.service';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { UserRepository } from '../repositories/user.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class DashboardService {
  private orderService: OrderService;
  private productService: ProductService;
  private userService: UserService;
  private stockMovementService: StockMovementService;

  constructor() {
    // Initialize repositories
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const userRepository = new UserRepository(prisma);
    const stockMovementRepository = new StockMovementRepository(prisma);
    const categoryRepository = new CategoryRepository(prisma);

    // Initialize services with required dependencies
    this.orderService = new OrderService(orderRepository, productRepository, stockMovementRepository);
    this.productService = new ProductService(productRepository, categoryRepository, stockMovementRepository);
    this.userService = new UserService(userRepository);
    this.stockMovementService = new StockMovementService(stockMovementRepository, productRepository);
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.info('Fetching dashboard statistics');

      // Get current date boundaries
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all data in parallel
      const [
        todayOrderStats,
        thisWeekOrderStats,
        thisMonthOrderStats,
        lastMonthOrderStats,
        productStats,
        allUsers,
        lowStockProducts
      ] = await Promise.all([
        this.orderService.getOrderStats(todayStart, todayEnd),
        this.orderService.getOrderStats(weekStart, todayEnd),
        this.orderService.getOrderStats(monthStart, todayEnd),
        this.orderService.getOrderStats(lastMonthStart, lastMonthEnd),
        this.productService.getProductStats(),
        this.userService.getUsers({ limit: 1000 }), // Get users for counting
        this.productService.getLowStockProducts() // Get low stock products
      ]);

      // Calculate growth percentage
      const currentMonthRevenue = thisMonthOrderStats.totalRevenue;
      const lastMonthRevenue = lastMonthOrderStats.totalRevenue;
      const growth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      // Count new users (last 30 days)
      const now30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const newUsersCount = allUsers.users.filter(user => 
        user.createdAt >= now30DaysAgo
      ).length;

      const dashboardStats: DashboardStats = {
        sales: {
          today: todayOrderStats.totalRevenue,
          thisWeek: thisWeekOrderStats.totalRevenue,
          thisMonth: thisMonthOrderStats.totalRevenue,
          growth: Math.round(growth * 100) / 100
        },
        orders: {
          today: todayOrderStats.todayOrders,
          pending: todayOrderStats.byStatus?.PENDING || 0,
          completed: todayOrderStats.byStatus?.COMPLETED || 0,
          cancelled: todayOrderStats.byStatus?.CANCELLED || 0
        },
        products: {
          total: productStats.total,
          lowStock: productStats.lowStock || 0,
          outOfStock: productStats.outOfStock || 0
        },
        customers: {
          total: allUsers.total,
          new: newUsersCount,
          returning: Math.max(0, allUsers.total - newUsersCount)
        }
      };

      logger.info('Dashboard statistics retrieved successfully', {
        salesTotal: dashboardStats.sales.thisMonth,
        ordersToday: dashboardStats.orders.today,
        productsTotal: dashboardStats.products.total
      });

      return dashboardStats;

    } catch (error) {
      logger.error('Failed to get dashboard statistics', { error });
      throw error;
    }
  }

  /**
   * Get top selling products for dashboard
   */
  async getTopSellingProducts(limit: number = 5): Promise<Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>> {
    try {
      // Get orders from this month and aggregate by product
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const orders = await this.orderService.getOrders({
        dateFrom: monthStart,
        dateTo: now,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Aggregate sales by product
      const productSales = new Map<string, {
        productId: string;
        productName: string;
        totalSold: number;
        revenue: number;
      }>();

      for (const order of orders.orders) {
        if (order.orderItems) {
          for (const item of order.orderItems) {
            const existing = productSales.get(item.productId) || {
              productId: item.productId,
              productName: item.product?.name || 'Unknown Product',
              totalSold: 0,
              revenue: 0
            };
            
            existing.totalSold += item.quantity;
            existing.revenue += Number(item.price) * item.quantity;
            productSales.set(item.productId, existing);
          }
        }
      }

      // Sort by revenue and return top products
      return Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get top selling products', { error });
      return [];
    }
  }

  /**
   * Get recent sales activity
   */
  async getRecentActivity(limit: number = 10): Promise<Array<{
    type: 'order' | 'payment' | 'stock';
    description: string;
    amount?: number;
    timestamp: Date;
  }>> {
    try {
      const [recentOrders, recentStockMovements] = await Promise.all([
        this.orderService.getOrders({ 
          limit: Math.ceil(limit / 2), 
          sortBy: 'createdAt', 
          sortOrder: 'desc' 
        }),
        this.stockMovementService.getStockMovements({ 
          limit: Math.ceil(limit / 2), 
          sortBy: 'createdAt', 
          sortOrder: 'desc' 
        })
      ]);

      const activities: Array<{
        type: 'order' | 'payment' | 'stock';
        description: string;
        amount?: number;
        timestamp: Date;
      }> = [];

      // Add order activities
      recentOrders.orders.forEach(order => {
        activities.push({
          type: order.status === 'COMPLETED' ? 'payment' : 'order',
          description: `Đơn hàng #${order.id.slice(-8)} - ${order.customerName || 'Khách lẻ'}`,
          amount: Number(order.total),
          timestamp: order.createdAt
        });
      });

      // Add stock activities
      recentStockMovements.movements.forEach(movement => {
        const typeDescription = movement.type === 'PURCHASE' || movement.type === 'RETURN' ? 'Nhập' : 'Xuất';
        activities.push({
          type: 'stock',
          description: `${typeDescription} kho - ${movement.productId.slice(-8)}`,
          amount: movement.quantity,
          timestamp: movement.createdAt
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get recent activity', { error });
      return [];
    }
  }
}
