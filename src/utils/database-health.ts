import { prisma } from '../config/database';
import { logger } from './logger';

/**
 * Kiểm tra tình trạng kết nối database
 * @returns Promise<{ status: string, message: string, responseTime?: number }>
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}> {
  const startTime = Date.now();
  
  try {
    // Thực hiện một query đơn giản để test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const responseTime = Date.now() - startTime;
    
    logger.info('Database health check passed', { responseTime });
    
    return {
      status: 'healthy',
      message: 'Database kết nối thành công',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Database health check failed', { 
      error: error instanceof Error ? error.message : error,
      responseTime 
    });
    
    return {
      status: 'unhealthy',
      message: 'Không thể kết nối database',
      responseTime,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Kiểm tra tình trạng các bảng chính trong database
 * @returns Promise<{ tablesCount: number, details: any }>
 */
export async function checkDatabaseTables(): Promise<{
  tablesCount: number;
  details: any;
}> {
  try {
    // Đếm số lượng records trong các bảng chính
    const [userCount, productCount, orderCount] = await Promise.allSettled([
      prisma.user.count().catch(() => 0),
      prisma.product.count().catch(() => 0),
      prisma.order.count().catch(() => 0),
    ]);
    
    const details = {
      users: userCount.status === 'fulfilled' ? userCount.value : 'N/A',
      products: productCount.status === 'fulfilled' ? productCount.value : 'N/A',
      orders: orderCount.status === 'fulfilled' ? orderCount.value : 'N/A',
    };
    
    const tablesCount = Object.values(details).filter(count => count !== 'N/A').length;
    
    return {
      tablesCount,
      details,
    };
  } catch (error) {
    logger.error('Database tables check failed', { error });
    
    return {
      tablesCount: 0,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Đóng kết nối database khi shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting database', { error });
  }
}
