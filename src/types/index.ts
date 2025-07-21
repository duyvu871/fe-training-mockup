/**
 * Barrel exports cho tất cả TypeScript types
 */

// Auth types
export * from './auth.types';

// API types
export * from './api.types';

// Database types
export * from './database.types';

// Re-export common Prisma types and enums
export type { 
  User, 
  Product, 
  Order, 
  OrderItem, 
  Category, 
  StockMovement, 
  RefreshToken 
} from '@prisma/client';

export { 
  UserRole, 
  OrderStatus, 
  PaymentMethod, 
  StockMovementType 
} from '@prisma/client';
