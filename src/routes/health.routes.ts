/**
 * Health Routes - Health check endpoints
 */

import { Router } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { checkDatabaseHealth, checkDatabaseTables } from '../utils/database-health';

export function createHealthRoutes(): Router {
  const router = Router();

  // Main health check endpoint
  router.get('/', async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Kiểm tra database health
      const dbHealth = await checkDatabaseHealth();
      
      // Kiểm tra tables (chỉ khi database healthy)
      let tableInfo = null;
      if (dbHealth.status === 'healthy') {
        tableInfo = await checkDatabaseTables();
      }
      
      const totalResponseTime = Date.now() - startTime;
      const overallStatus = dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED';
      
      const healthData = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: config.app.env,
        version: config.app.version,
        responseTime: `${totalResponseTime}ms`,
        services: {
          api: {
            status: 'healthy',
            message: 'API server đang hoạt động bình thường',
          },
          database: {
            status: dbHealth.status,
            message: dbHealth.message,
            responseTime: dbHealth.responseTime ? `${dbHealth.responseTime}ms` : undefined,
            details: dbHealth.details,
            tables: tableInfo ? {
              accessible: tableInfo.tablesCount,
              data: tableInfo.details,
            } : undefined,
          },
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          },
          pid: process.pid,
        },
      };
      
      // Trả về status code phù hợp
      const statusCode = overallStatus === 'OK' ? 200 : 503;
      res.status(statusCode).json(healthData);
      
    } catch (error) {
      logger.error('Health check failed', { error });
      
      res.status(503).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: config.app.env,
        version: config.app.version,
        error: 'Health check thất bại',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Database health check endpoint (development only)
  router.get('/database', async (req, res): Promise<void> => {
    if (config.app.env === 'production') {
      res.status(403).json({
        error: 'Endpoint này không khả dụng trong môi trường production',
      });
      return;
    }
    
    try {
      const dbHealth = await checkDatabaseHealth();
      const tableInfo = await checkDatabaseTables();
      
      res.json({
        status: dbHealth.status,
        timestamp: new Date().toISOString(),
        database: {
          connection: {
            status: dbHealth.status,
            message: dbHealth.message,
            responseTime: dbHealth.responseTime ? `${dbHealth.responseTime}ms` : undefined,
            details: dbHealth.details,
          },
          tables: {
            accessible: tableInfo.tablesCount,
            data: tableInfo.details,
          },
          environment: {
            databaseUrl: config.database.url ? 'Configured' : 'Not configured',
            nodeEnv: config.app.env,
          },
        },
      });
    } catch (error) {
      logger.error('Database health check failed', { error });
      
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Không thể kiểm tra database health',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
