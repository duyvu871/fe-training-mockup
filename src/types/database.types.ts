/**
 * Kiểu dữ liệu mở rộng từ Prisma models và database operations
 */

import { 
  User as PrismaUser, 
  Product as PrismaProduct, 
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Category as PrismaCategory,
  StockMovement as PrismaStockMovement,
  RefreshToken as PrismaRefreshToken,
  UserRole,
  OrderStatus,
  PaymentMethod,
  StockMovementType
} from '@prisma/client';

// Extended User types
export interface User extends PrismaUser {}

export interface UserWithoutPassword extends Omit<PrismaUser, 'password'> {}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Extended Product types
export interface Product extends PrismaProduct {
  category?: Category;
  _count?: {
    orderItems: number;
    stockMovements: number;
  };
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  unit?: string;
  barcode?: string;
  image?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  barcode?: string;
  image?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductSearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
}

// Extended Category types
export interface Category extends PrismaCategory {
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Extended Order types
export interface Order extends PrismaOrder {
  items?: OrderItem[];
  createdBy?: UserWithoutPassword;
  _count?: {
    items: number;
  };
}

export interface OrderItem extends PrismaOrderItem {
  product?: Product;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    price?: number; // Override product price if needed
  }>;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  discount?: number;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

export interface OrderSearchFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdById?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

// Extended StockMovement types
export interface StockMovement extends PrismaStockMovement {
  product?: Product;
  createdBy?: UserWithoutPassword;
}

export interface CreateStockMovementRequest {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  cost?: number;
  createdById: string;
}

export interface StockMovementSearchFilters {
  productId?: string;
  type?: StockMovementType;
  dateFrom?: Date;
  dateTo?: Date;
  createdById?: string;
}

// Extended RefreshToken types
export interface RefreshToken extends PrismaRefreshToken {}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rollback?: boolean;
}

// Aggregation and reporting types
export interface SalesReport {
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts: Array<{
      product: Product;
      quantity: number;
      revenue: number;
    }>;
  };
  dailyBreakdown: Array<{
    date: Date;
    orders: number;
    revenue: number;
  }>;
}

export interface StockReport {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  movements: {
    purchases: number;
    sales: number;
    adjustments: number;
  };
  alerts: Array<{
    product: Product;
    currentStock: number;
    minStock: number;
    status: 'low' | 'out';
  }>;
}

export interface DashboardStats {
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  orders: {
    today: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
}

// Export all Prisma enums for easy access
export { UserRole, OrderStatus, PaymentMethod, StockMovementType };
