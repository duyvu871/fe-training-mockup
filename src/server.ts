import { app } from './app';
import { config, getSafeConfigForLogging } from './config/environment';
import { logger } from './utils/logger';
import { prisma } from './config/database';

async function startServer() {
  try {
    // Kiểm tra kết nối database
    await prisma.$connect();
    logger.info('✅ Kết nối database thành công');

    // Khởi động server
    const server = app.listen(config.app.port, () => {
      logger.info(`🚀 Server đang chạy tại: http://localhost:${config.app.port}`);
      logger.info(`📚 API Documentation: http://localhost:${config.app.port}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${config.app.port}/health`);
      logger.info(`🌍 Environment: ${config.app.env}`);
      
      // Log configuration details trong development mode
      if (config.app.env === 'development') {
        logger.info(`🔧 Config endpoint: http://localhost:${config.app.port}/config`);
        logger.info(`🌐 Environment variables: http://localhost:${config.app.port}/env`);
        logger.info(`📋 Database health: http://localhost:${config.app.port}/health/database`);
        
        // Log configuration summary
        const safeConfig = getSafeConfigForLogging();
        logger.info('📊 Configuration summary:', {
          database: safeConfig.database.url,
          cors: safeConfig.cors.origin,
          rateLimit: `${safeConfig.rateLimit.maxRequests} requests per ${safeConfig.rateLimit.windowMs}ms`,
          logLevel: safeConfig.logging.level,
          uploadPath: safeConfig.upload.path,
        });
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} nhận được, đang tắt server...`);
      
      server.close(async () => {
        logger.info('Server đã dừng nhận request mới');
        
        try {
          await prisma.$disconnect();
          logger.info('✅ Database đã ngắt kết nối');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Lỗi khi ngắt kết nối database:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️ Ép buộc tắt server');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startServer();
