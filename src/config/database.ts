import { PrismaClient } from '@prisma/client';
import { config } from './environment';

// Tạo Prisma client instance
export const prisma = new PrismaClient({
  log: config.app.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Middleware để log slow queries
if (config.app.env === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    const duration = after - before;
    if (duration > 100) { // Log queries longer than 100ms
      console.log(`⚠️ Slow Query: ${params.model}.${params.action} took ${duration}ms`);
    }
    
    return result;
  });
}
