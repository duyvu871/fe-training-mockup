/**
 * Debug Routes - Development debugging endpoints
 */

import { Router } from 'express';
import { config, getSafeConfigForLogging } from '../config/environment';
import { logger } from '../utils/logger';

export function createDebugRoutes(): Router {
  const router = Router();

  // Configuration endpoint (development only)
  router.get('/config', (req, res): void => {
    if (config.app.env === 'production') {
      res.status(403).json({
        error: 'Endpoint này không khả dụng trong môi trường production',
        message: 'Configuration endpoint chỉ khả dụng trong development mode'
      });
      return;
    }
    
    try {
      const safeConfig = getSafeConfigForLogging();
      
      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        message: 'Configuration hiện tại của ứng dụng',
        config: safeConfig,
        note: 'Các thông tin nhạy cảm đã được che giấu (masked) để bảo mật'
      });
    } catch (error) {
      logger.error('Failed to get configuration', { error });
      
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Không thể lấy thông tin configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Environment variables endpoint (development only)
  router.get('/env', (req, res): void => {
    if (config.app.env === 'production') {
      res.status(403).json({
        error: 'Endpoint này không khả dụng trong môi trường production',
        message: 'Environment variables endpoint chỉ khả dụng trong development mode'
      });
      return;
    }
    
    try {
      // Lấy các environment variables và mask sensitive data
      const sensitiveKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'SMTP_PASS'];
      const envVars: Record<string, any> = {};
      
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('POS_') || key.startsWith('APP_') || key.startsWith('NODE_') || 
            key.startsWith('DATABASE_') || key.startsWith('JWT_') || key.startsWith('CORS_') ||
            key.startsWith('RATE_') || key.startsWith('LOG_') || key.startsWith('MAX_') ||
            key.startsWith('UPLOAD_') || key.startsWith('SMTP_') || key.startsWith('BCRYPT_') ||
            key.startsWith('HEALTH_') || key === 'PORT') {
          
          const value = process.env[key];
          if (value) {
            if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
              envVars[key] = value.length > 8 ? 
                value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4) :
                '*'.repeat(value.length);
            } else {
              envVars[key] = value;
            }
          }
        }
      });
      
      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        message: 'Environment variables hiện tại của ứng dụng',
        count: Object.keys(envVars).length,
        variables: envVars,
        note: 'Các thông tin nhạy cảm đã được che giấu (masked) để bảo mật',
        loadedFrom: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env'
      });
    } catch (error) {
      logger.error('Failed to get environment variables', { error });
      
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Không thể lấy thông tin environment variables',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
