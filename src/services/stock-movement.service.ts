import { StockMovement, StockMovementType } from '@prisma/client';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { ProductRepository } from '../repositories/product.repository';
import { logger } from '../utils/logger';
import { 
  ValidationError,
  NotFoundError
} from '../utils/errors';

export interface CreateStockMovementRequest {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  createdById: string;
}

export class StockMovementService {
  constructor(
    private stockMovementRepository: StockMovementRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * Tạo giao dịch xuất nhập kho
   */
  async createStockMovement(data: CreateStockMovementRequest): Promise<StockMovement> {
    try {
      // Validate input
      await this.validateStockMovementData(data);

      // Get current product info
      const product = await this.productRepository.findById(data.productId);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      const previousStock = product.stock;
      let newStock: number;

      // Calculate new stock based on movement type
      switch (data.type) {
        case 'PURCHASE':
        case 'RETURN':
        case 'ADJUSTMENT':
          newStock = previousStock + data.quantity;
          break;
        case 'SALE':
        case 'DAMAGED':
          newStock = previousStock - data.quantity;
          if (newStock < 0) {
            throw new ValidationError(`Không đủ tồn kho. Hiện tại: ${previousStock}, Yêu cầu: ${data.quantity}`);
          }
          break;
        default:
          throw new ValidationError('Loại chuyển động kho không hợp lệ');
      }

      // Create stock movement
      const createData: {
        productId: string;
        type: StockMovementType;
        quantity: number;
        previousStock: number;
        newStock: number;
        reason?: string;
        reference?: string;
        createdById: string;
      } = {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock,
        createdById: data.createdById,
      };

      if (data.reason) {
        createData.reason = data.reason;
      }
      if (data.reference) {
        createData.reference = data.reference;
      }

      const stockMovement = await this.stockMovementRepository.create(createData);

      // Update product stock
      await this.productRepository.updateStock(data.productId, newStock);

      logger.info('Stock movement created successfully', {
        stockMovementId: stockMovement.id,
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock,
        createdById: data.createdById
      });

      return stockMovement;
    } catch (error) {
      logger.error('Failed to create stock movement', { error, data });
      throw error;
    }
  }

  /**
   * Lấy giao dịch theo ID
   */
  async getStockMovementById(id: string): Promise<StockMovement> {
    try {
      if (!id) {
        throw new ValidationError('ID giao dịch là bắt buộc');
      }

      const stockMovement = await this.stockMovementRepository.findById(id);
      if (!stockMovement) {
        throw new NotFoundError('Giao dịch xuất nhập kho');
      }

      return stockMovement;
    } catch (error) {
      logger.error('Failed to get stock movement by ID', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách giao dịch với phân trang
   */
  async getStockMovements(options: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: StockMovementType;
    createdById?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'createdAt' | 'quantity' | 'type';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Validate pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));

      const result = await this.stockMovementRepository.findMany({
        ...options,
        page,
        limit,
      });

      logger.info('Stock movements retrieved successfully', {
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Failed to get stock movements', { error, options });
      throw error;
    }
  }

  /**
   * Lấy lịch sử xuất nhập kho của sản phẩm
   */
  async getProductStockHistory(productId: string, options: {
    page?: number;
    limit?: number;
    type?: StockMovementType;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!productId) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      // Check if product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      const result = await this.stockMovementRepository.findByProductId(productId, options);

      logger.info('Product stock history retrieved successfully', {
        productId,
        total: result.total,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Failed to get product stock history', { error, productId, options });
      throw error;
    }
  }

  /**
   * Lấy giao dịch theo loại
   */
  async getMovementsByType(type: StockMovementType, options: {
    page?: number;
    limit?: number;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const result = await this.stockMovementRepository.findByType(type, options);

      logger.info('Movements by type retrieved successfully', {
        type,
        total: result.total,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Failed to get movements by type', { error, type, options });
      throw error;
    }
  }

  /**
   * Lấy giao dịch hôm nay
   */
  async getTodayMovements(): Promise<StockMovement[]> {
    try {
      const movements = await this.stockMovementRepository.getTodayMovements();

      logger.info('Today movements retrieved', { count: movements.length });

      return movements;
    } catch (error) {
      logger.error('Failed to get today movements', { error });
      throw error;
    }
  }

  /**
   * Lấy thống kê xuất nhập kho
   */
  async getStockMovementStats(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    byType: Record<string, number>;
    totalQuantityIn: number;
    totalQuantityOut: number;
    recentMovements: number;
    todayMovements: number;
  }> {
    try {
      const stats = await this.stockMovementRepository.getStats(dateFrom, dateTo);

      logger.info('Stock movement stats retrieved', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to get stock movement stats', { error });
      throw error;
    }
  }

  /**
   * Lấy báo cáo xuất nhập kho theo ngày
   */
  async getDailyReport(days: number = 30): Promise<Array<{
    date: string;
    totalMovements: number;
    quantityIn: number;
    quantityOut: number;
    byType: Record<string, number>;
  }>> {
    try {
      if (days <= 0 || days > 365) {
        throw new ValidationError('Số ngày phải từ 1 đến 365');
      }

      const report = await this.stockMovementRepository.getDailyReport(days);

      logger.info('Daily stock movement report retrieved', { 
        days, 
        recordCount: report.length 
      });

      return report;
    } catch (error) {
      logger.error('Failed to get daily report', { error, days });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm có nhiều giao dịch nhất
   */
  async getMostActiveProducts(limit: number = 10): Promise<Array<{
    productId: string;
    productName: string;
    productSku: string;
    totalMovements: number;
    totalQuantity: number;
  }>> {
    try {
      if (limit <= 0 || limit > 100) {
        throw new ValidationError('Limit phải từ 1 đến 100');
      }

      const products = await this.stockMovementRepository.getMostActiveProducts(limit);

      logger.info('Most active products retrieved', { 
        limit, 
        count: products.length 
      });

      return products;
    } catch (error) {
      logger.error('Failed to get most active products', { error, limit });
      throw error;
    }
  }

  /**
   * Điều chỉnh tồn kho sản phẩm
   */
  async adjustProductStock(data: {
    productId: string;
    adjustment: number;
    reason?: string;
    reference?: string;
    createdById: string;
  }): Promise<StockMovement> {
    try {
      if (!data.productId || !data.createdById) {
        throw new ValidationError('Product ID và User ID là bắt buộc');
      }

      if (data.adjustment === 0) {
        throw new ValidationError('Số lượng điều chỉnh phải khác 0');
      }

      const type: StockMovementType = data.adjustment > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT';
      const quantity = Math.abs(data.adjustment);

      const adjustmentData: CreateStockMovementRequest = {
        productId: data.productId,
        type,
        quantity,
        reason: data.reason || 'Điều chỉnh tồn kho',
        createdById: data.createdById,
      };

      if (data.reference) {
        adjustmentData.reference = data.reference;
      }

      return await this.createStockMovement(adjustmentData);
    } catch (error) {
      logger.error('Failed to adjust product stock', { error, data });
      throw error;
    }
  }

  /**
   * Validate stock movement data
   */
  private async validateStockMovementData(data: CreateStockMovementRequest): Promise<void> {
    if (!data.productId) {
      throw new ValidationError('ID sản phẩm là bắt buộc');
    }

    if (!data.createdById) {
      throw new ValidationError('ID người tạo là bắt buộc');
    }

    if (!data.quantity || data.quantity <= 0) {
      throw new ValidationError('Số lượng phải lớn hơn 0');
    }

    if (data.quantity > 1000000) {
      throw new ValidationError('Số lượng không được quá 1,000,000');
    }

    if (!Object.values(['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGED'] as StockMovementType[]).includes(data.type)) {
      throw new ValidationError('Loại chuyển động kho không hợp lệ');
    }

    if (data.reason && data.reason.length > 255) {
      throw new ValidationError('Lý do không được quá 255 ký tự');
    }

    if (data.reference && data.reference.length > 100) {
      throw new ValidationError('Tham chiếu không được quá 100 ký tự');
    }
  }
}
