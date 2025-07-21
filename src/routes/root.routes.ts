/**
 * Root Route - Main API information endpoint
 */

import { Router } from 'express';
import { config } from '../config/environment';

export function createRootRoute(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({
      message: '🏪 POS API đang hoạt động!',
      version: config.app.version,
      environment: config.app.env,
      docs: '/api-docs',
      endpoints: {
        health: '/health',
        healthDatabase: '/health/database',
        config: config.app.env === 'development' ? '/config' : '(chỉ khả dụng trong dev mode)',
        env: config.app.env === 'development' ? '/env' : '(chỉ khả dụng trong dev mode)',
        auth: '/api/auth',
        products: '/api/products',
        categories: '/api/categories',
        orders: '/api/orders',
        users: '/api/users',
        stock: '/api/stock',
      },
      note: config.app.env === 'development' ? 
        'Đang chạy trong development mode - các endpoint debug khả dụng' :
        'Đang chạy trong production mode - một số endpoint debug bị tắt'
    });
  });

  return router;
}
