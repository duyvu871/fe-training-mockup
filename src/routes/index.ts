/**
 * Main API Routes
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './auth.routes';
import { createProductRoutes } from './product.routes';
import { createCategoryRoutes } from './category.routes';
import { createOrderRoutes } from './order.routes';
import { createUserRoutes } from './user.routes';
import { createStockRoutes } from './stock.routes';
import { createHealthRoutes } from './health.routes';
import { createDebugRoutes } from './debug.routes';
import { createDocsRoutes } from './docs.routes';
import { dashboardRoutes } from './dashboard.routes';

export function createApiRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Mount auth routes
  router.use('/auth', createAuthRoutes(prisma));
  
  // Mount product routes
  router.use('/products', createProductRoutes(prisma));

  // Mount category routes
  router.use('/categories', createCategoryRoutes(prisma));

  // Mount order routes
  router.use('/orders', createOrderRoutes(prisma));

  // Mount user routes
  router.use('/users', createUserRoutes(prisma));

  // Mount stock routes
  router.use('/stock', createStockRoutes(prisma));

  // Mount dashboard routes
  router.use('/dashboard', dashboardRoutes);

  return router;
}

// Export health, debug, and docs routes separately
export { createHealthRoutes, createDebugRoutes, createDocsRoutes };
