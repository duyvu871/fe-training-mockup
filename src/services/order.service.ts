/**
 * Order service - Business logic for order operations
 */

import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Prisma, Product } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { logger } from '../utils/logger';
import { 
  ValidationError,
  NotFoundError,
  InsufficientStockError,
  InvalidOrderStatusError
} from '../utils/errors';

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  discount?: number;
  createdById: string;
}

export interface UpdateOrderRequest {
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  discount?: number;
}

export interface OrderSummary {
  order: Order & { orderItems: (OrderItem & { product: any })[] };
  summary: {
    itemCount: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
    private stockMovementRepository: StockMovementRepository
  ) {}

  /**
   * Tạo đơn hàng mới
   */
  async createOrder(data: CreateOrderRequest): Promise<OrderSummary> {
    try {
      // Validate input
      await this.validateOrderData(data);

      // Validate and check stock for all items
      const validatedItems = await this.validateOrderItems(data.items);

      // Create order
      const orderData = {
        createdById: data.createdById,
        items: validatedItems,
        paymentMethod: data.paymentMethod,
        discount: data.discount || 0,
        customerName: data.customerName?.trim() || 'Khách lẻ',
        customerPhone: data.customerPhone?.trim() || null,
        ...(data.notes && { notes: data.notes }),
      };

      const order = await this.orderRepository.create(orderData);

      // Update product stock immediately when order is created
      // This ensures stock is reduced right away to prevent overselling
      await this.updateProductStockForOrder(order, 'SALE');

      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        itemCount: validatedItems.length,
        total: order.total,
        createdById: data.createdById
      });

      return this.formatOrderSummary(order);
    } catch (error) {
      logger.error('Failed to create order', { error, data });
      throw error;
    }
  }

  /**
   * Lấy đơn hàng theo ID
   */
  async getOrderById(id: string, includeItems: boolean = true): Promise<Order & { orderItems?: OrderItem[] }> {
    try {
      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      const order = await this.orderRepository.findById(id, includeItems);
      if (!order) {
        throw new NotFoundError('Đơn hàng');
      }

      return order;
    } catch (error) {
      logger.error('Failed to get order by ID', { error, id });
      throw error;
    }
  }

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    try {
      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      // Get current order
      const currentOrder = await this.getOrderById(id);
      
      // Check if order can be updated
      if (['COMPLETED', 'CANCELLED'].includes(currentOrder.status)) {
        throw new InvalidOrderStatusError(currentOrder.status, 'PENDING hoặc PROCESSING');
      }

      const updateData: Prisma.OrderUpdateInput = {};
      if (data.customerName !== undefined) updateData.customerName = data.customerName?.trim();
      if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone?.trim();
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.notes !== undefined) updateData.notes = data.notes?.trim();
      if (data.discount !== undefined) {
        updateData.discount = data.discount;
        // Recalculate totals if discount changes
        const subtotal = Number(currentOrder.subtotal);
        const discount = Number(data.discount);
        const tax = (subtotal - discount) * 0.1;
        updateData.tax = tax;
        updateData.total = subtotal - discount + tax;
      }

      const order = await this.orderRepository.update(id, updateData);
      if (!order) {
        throw new NotFoundError('Đơn hàng');
      }

      logger.info('Order updated successfully', { 
        orderId: id, 
        updatedFields: Object.keys(updateData) 
      });

      return order;
    } catch (error) {
      logger.error('Failed to update order', { error, id, data });
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(id: string, status: OrderStatus, updatedBy?: string): Promise<Order> {
    try {
      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      const currentOrder = await this.getOrderById(id, true);
      
      // Validate status transition
      await this.validateStatusTransition(currentOrder.status, status);

      const order = await this.orderRepository.updateStatus(id, status, updatedBy);

      // Handle stock movements based on status change
      if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
        // Return stock when order is cancelled (regardless of previous status)
        await this.updateProductStockForOrder(currentOrder, 'RETURN');
      }

      logger.info('Order status updated successfully', {
        orderId: id,
        previousStatus: currentOrder.status,
        newStatus: status,
        updatedBy
      });

      return order;
    } catch (error) {
      logger.error('Failed to update order status', { error, id, status });
      throw error;
    }
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(id: string, cancelReason?: string): Promise<Order> {
    try {
      if (!id) {
        throw new ValidationError('ID đơn hàng là bắt buộc');
      }

      const currentOrder = await this.getOrderById(id, true);
      
      if (currentOrder.status === 'CANCELLED') {
        throw new InvalidOrderStatusError(currentOrder.status, 'Không thể hủy đơn hàng đã bị hủy');
      }

      const order = await this.orderRepository.cancel(id, cancelReason);

      // Return stock when order is cancelled (stock was reduced when order was created)
      await this.updateProductStockForOrder(currentOrder, 'RETURN');

      logger.info('Order cancelled successfully', {
        orderId: id,
        previousStatus: currentOrder.status,
        cancelReason
      });

      return order;
    } catch (error) {
      logger.error('Failed to cancel order', { error, id, cancelReason });
      throw error;
    }
  }

  /**
   * Hoàn thành đơn hàng
   */
  async completeOrder(id: string): Promise<Order> {
    try {
      return await this.updateOrderStatus(id, 'COMPLETED');
    } catch (error) {
      logger.error('Failed to complete order', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn hàng với phân trang
   */
  async getOrders(options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: OrderStatus;
    paymentMethod?: PaymentMethod;
    customerName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'createdAt' | 'updatedAt' | 'total';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    orders: (Order & { orderItems: (OrderItem & { product: Product })[] })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Validate pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));

      const result = await this.orderRepository.findMany({
        ...options,
        page,
        limit,
      });

      logger.info('Orders retrieved successfully', {
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Failed to get orders', { error, options });
      throw error;
    }
  }

  /**
   * Lấy đơn hàng hôm nay
   */
  async getTodayOrders(): Promise<(Order & { orderItems: OrderItem[] })[]> {
    try {
      const orders = await this.orderRepository.getTodayOrders();

      logger.info('Today orders retrieved', { count: orders.length });

      return orders;
    } catch (error) {
      logger.error('Failed to get today orders', { error });
      throw error;
    }
  }

  /**
   * Lấy thống kê đơn hàng
   */
  async getOrderStats(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    totalRevenue: number;
    averageOrderValue: number;
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, number>;
    recentOrders: number;
    todayRevenue: number;
    todayOrders: number;
  }> {
    try {
      const stats = await this.orderRepository.getStats(dateFrom, dateTo);

      logger.info('Order stats retrieved', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to get order stats', { error });
      throw error;
    }
  }

  /**
   * Lấy revenue theo ngày
   */
  async getDailyRevenue(days: number = 30): Promise<Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>> {
    try {
      const dailyRevenue = await this.orderRepository.getDailyRevenue(days);

      logger.info('Daily revenue retrieved', { days, recordCount: dailyRevenue.length });

      return dailyRevenue;
    } catch (error) {
      logger.error('Failed to get daily revenue', { error, days });
      throw error;
    }
  }

  /**
   * Validate order data
   */
  private async validateOrderData(data: CreateOrderRequest): Promise<void> {
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    if (data.items.length > 100) {
      throw new ValidationError('Đơn hàng không được quá 100 sản phẩm');
    }

    if (!data.createdById) {
      throw new ValidationError('ID người tạo đơn hàng là bắt buộc');
    }

    if (data.discount && (data.discount < 0 || data.discount > 1000000)) {
      throw new ValidationError('Giảm giá phải từ 0 đến 1,000,000');
    }

    // Validate customer info if provided
    if (data.customerPhone && !/^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(data.customerPhone.replace(/\s/g, ''))) {
      throw new ValidationError('Số điện thoại khách hàng không hợp lệ');
    }
  }

  /**
   * Validate and process order items
   */
  private async validateOrderItems(items: CreateOrderRequest['items']): Promise<CreateOrderRequest['items']> {
    const validatedItems: CreateOrderRequest['items'] = [];

    for (const item of items) {
      if (!item.productId) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new ValidationError('Số lượng sản phẩm phải lớn hơn 0');
      }

      if (!item.price || item.price <= 0) {
        throw new ValidationError('Giá sản phẩm phải lớn hơn 0');
      }

      // Check if product exists and is active
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Sản phẩm với ID ${item.productId}`);
      }

      if (!product.isActive) {
        throw new ValidationError(`Sản phẩm "${product.name}" đã bị vô hiệu hóa`);
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        throw new InsufficientStockError(product.name, product.stock);
      }

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    return validatedItems;
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['PROCESSING', 'COMPLETED', 'CANCELLED'], // Allow direct completion for POS
      'PROCESSING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': ['CANCELLED'], // Allow cancel for returns
      'CANCELLED': [], // Cannot change from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new InvalidOrderStatusError(currentStatus, validTransitions[currentStatus].join(', '));
    }
  }

  /**
   * Update product stock for order
   */
  private async updateProductStockForOrder(order: Order & { orderItems?: any[] }, movementType: 'SALE' | 'RETURN'): Promise<void> {
    if (!order.orderItems || order.orderItems.length === 0) {
      logger.warn('No order items found for stock update', { orderId: order.id });
      return;
    }

    for (const item of order.orderItems) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) continue;

      const quantity = movementType === 'SALE' ? -item.quantity : item.quantity;
      const newStock = product.stock + quantity;

      if (newStock < 0) {
        logger.warn('Negative stock detected', {
          productId: item.productId,
          currentStock: product.stock,
          adjustment: quantity
        });
        continue;
      }

      // Update product stock
      await this.productRepository.updateStock(item.productId, newStock);

      // Create stock movement
      await this.stockMovementRepository.create({
        productId: item.productId,
        type: movementType,
        quantity: item.quantity,
        previousStock: product.stock,
        newStock: newStock,
        reason: `Đơn hàng ${order.orderNumber}`,
        reference: order.orderNumber,
        createdById: order.createdById,
      });
    }
  }

  /**
   * Format order summary
   */
  private formatOrderSummary(order: Order & { orderItems: any[] }): OrderSummary {
    return {
      order,
      summary: {
        itemCount: order.orderItems.length,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
      },
    };
  }
}
