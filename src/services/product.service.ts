/**
 * Product service - Business logic for product operations
 */

import { Product, StockMovementType } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { logger } from '../utils/logger';
import { 
  ValidationError,
  ConflictError,
  NotFoundError,
  InsufficientStockError
} from '../utils/errors';

export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  barcode?: string;
  image?: string;
  categoryId: string;
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

export interface StockAdjustmentRequest {
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  reference?: string;
  userId: string;
}

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private categoryRepository: CategoryRepository,
    private stockMovementRepository: StockMovementRepository
  ) {}

  /**
   * Tạo sản phẩm mới
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      // Validate input
      await this.validateProductData(data);

      // Check if category exists
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new NotFoundError('Danh mục');
      }

      if (!category.isActive) {
        throw new ValidationError('Không thể tạo sản phẩm trong danh mục đã bị vô hiệu hóa');
      }

      // Check if SKU already exists
      const existingProduct = await this.productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new ConflictError('Mã sản phẩm (SKU) đã tồn tại');
      }

      // Check if barcode already exists (if provided)
      if (data.barcode) {
        const existingByBarcode = await this.productRepository.findByBarcode(data.barcode);
        if (existingByBarcode) {
          throw new ConflictError('Mã vạch đã tồn tại');
        }
      }

      const productData = {
        name: data.name.trim(),
        sku: data.sku.trim(),
        ...(data.description && { description: data.description.trim() }),
        price: data.price,
        ...(data.cost !== undefined && { cost: data.cost }),
        stock: data.stock || 0,
        minStock: data.minStock || 0,
        unit: data.unit?.trim() || 'cái',
        ...(data.barcode && { barcode: data.barcode.trim() }),
        ...(data.image && { image: data.image.trim() }),
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
      };

      const product = await this.productRepository.create(productData);

      // Create stock movement if initial stock > 0
      if (product.stock > 0) {
        await this.stockMovementRepository.create({
          productId: product.id,
          type: 'PURCHASE',
          quantity: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: 'Khởi tạo sản phẩm với tồn kho ban đầu',
          createdById: 'system', // You might want to pass actual user ID
        });
      }

      logger.info('Product created successfully', {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId
      });

      return product;
    } catch (error) {
      logger.error('Failed to create product', { error, data });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm theo ID
   */
  async getProductById(id: string, includeCategory: boolean = true): Promise<Product> {
    try {
      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      const product = await this.productRepository.findById(id, includeCategory);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by ID', { error, id });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm theo SKU
   */
  async getProductBySku(sku: string): Promise<Product> {
    try {
      if (!sku) {
        throw new ValidationError('SKU sản phẩm là bắt buộc');
      }

      const product = await this.productRepository.findBySku(sku);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by SKU', { error, sku });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm theo mã vạch
   */
  async getProductByBarcode(barcode: string): Promise<Product> {
    try {
      if (!barcode) {
        throw new ValidationError('Mã vạch sản phẩm là bắt buộc');
      }

      const product = await this.productRepository.findByBarcode(barcode);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by barcode', { error, barcode });
      throw error;
    }
  }

  /**
   * Cập nhật sản phẩm
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    try {
      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      // Validate input if provided
      if (data.price !== undefined && data.price <= 0) {
        throw new ValidationError('Giá sản phẩm phải lớn hơn 0');
      }

      if (data.cost !== undefined && data.cost < 0) {
        throw new ValidationError('Giá vốn không được âm');
      }

      if (data.stock !== undefined && data.stock < 0) {
        throw new ValidationError('Tồn kho không được âm');
      }

      if (data.minStock !== undefined && data.minStock < 0) {
        throw new ValidationError('Tồn kho tối thiểu không được âm');
      }

      // Check if category exists and is active
      if (data.categoryId) {
        const category = await this.categoryRepository.findById(data.categoryId);
        if (!category) {
          throw new NotFoundError('Danh mục');
        }
        if (!category.isActive) {
          throw new ValidationError('Không thể chuyển sản phẩm vào danh mục đã bị vô hiệu hóa');
        }
      }

      // Check if SKU already exists (excluding current product)
      if (data.sku) {
        const existingProduct = await this.productRepository.findBySku(data.sku);
        if (existingProduct && existingProduct.id !== id) {
          throw new ConflictError('Mã sản phẩm (SKU) đã tồn tại');
        }
      }

      // Check if barcode already exists (excluding current product)
      if (data.barcode) {
        const existingByBarcode = await this.productRepository.findByBarcode(data.barcode);
        if (existingByBarcode && existingByBarcode.id !== id) {
          throw new ConflictError('Mã vạch đã tồn tại');
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.sku !== undefined) updateData.sku = data.sku.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim();
      if (data.price !== undefined) updateData.price = data.price;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.minStock !== undefined) updateData.minStock = data.minStock;
      if (data.unit !== undefined) updateData.unit = data.unit.trim();
      if (data.barcode !== undefined) updateData.barcode = data.barcode?.trim();
      if (data.image !== undefined) updateData.image = data.image?.trim();
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const product = await this.productRepository.update(id, updateData);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      logger.info('Product updated successfully', { 
        productId: id, 
        updatedFields: Object.keys(updateData) 
      });

      return product;
    } catch (error) {
      logger.error('Failed to update product', { error, id, data });
      throw error;
    }
  }

  /**
   * Xóa sản phẩm
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      const success = await this.productRepository.delete(id);
      if (!success) {
        throw new NotFoundError('Sản phẩm');
      }

      logger.info('Product deleted successfully', { productId: id });
    } catch (error) {
      logger.error('Failed to delete product', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm với phân trang và tìm kiếm
   */
  async getProducts(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    inStock?: boolean;
    lowStock?: boolean;
    search?: string;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Validate pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));

      const result = await this.productRepository.findMany({
        ...options,
        page,
        limit,
      });

      logger.info('Products retrieved successfully', {
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: options
      });

      return result;
    } catch (error) {
      logger.error('Failed to get products', { error, options });
      throw error;
    }
  }

  /**
   * Điều chỉnh tồn kho
   */
  async adjustStock(data: StockAdjustmentRequest): Promise<Product> {
    try {
      const { productId, quantity, type, reason, reference, userId } = data;

      if (!productId || !userId) {
        throw new ValidationError('Product ID và User ID là bắt buộc');
      }

      if (quantity === 0) {
        throw new ValidationError('Số lượng điều chỉnh phải khác 0');
      }

      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new NotFoundError('Sản phẩm');
      }

      const previousStock = product.stock;
      let newStock: number;

      // Calculate new stock based on movement type
      switch (type) {
        case 'PURCHASE':
        case 'RETURN':
        case 'ADJUSTMENT':
          newStock = previousStock + Math.abs(quantity);
          break;
        case 'SALE':
        case 'DAMAGED':
          if (previousStock < Math.abs(quantity)) {
            throw new InsufficientStockError(product.name, previousStock);
          }
          newStock = previousStock - Math.abs(quantity);
          break;
        default:
          throw new ValidationError('Loại chuyển động kho không hợp lệ');
      }

      // Update product stock
      const updatedProduct = await this.productRepository.updateStock(productId, newStock);
      if (!updatedProduct) {
        throw new NotFoundError('Sản phẩm');
      }

      // Create stock movement record
      const stockMovementData = {
        productId,
        type,
        quantity: Math.abs(quantity),
        previousStock,
        newStock,
        createdById: userId,
        ...(reason && { reason }),
        ...(reference && { reference }),
      };

      await this.stockMovementRepository.create(stockMovementData);

      logger.info('Stock adjusted successfully', {
        productId,
        previousStock,
        newStock,
        quantity,
        type,
        userId
      });

      return updatedProduct;
    } catch (error) {
      logger.error('Failed to adjust stock', { error, data });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm tồn kho thấp
   */
  async getLowStockProducts(): Promise<Product[]> {
    try {
      const products = await this.productRepository.getLowStockProducts();

      logger.info('Low stock products retrieved', { count: products.length });

      return products;
    } catch (error) {
      logger.error('Failed to get low stock products', { error });
      throw error;
    }
  }

  /**
   * Tìm kiếm sản phẩm
   */
  async searchProducts(query: string, options: {
    categoryId?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Product[]> {
    try {
      if (!query || query.trim().length < 2) {
        throw new ValidationError('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
      }

      const searchOptions: any = {
        search: query.trim(),
        limit: options.limit || 20,
        page: 1,
      };

      if (options.categoryId) {
        searchOptions.categoryId = options.categoryId;
      }

      if (options.isActive !== undefined) {
        searchOptions.isActive = options.isActive;
      }

      const result = await this.productRepository.findMany(searchOptions);

      logger.info('Product search completed', {
        query: query.trim(),
        resultCount: result.products.length
      });

      return result.products;
    } catch (error) {
      logger.error('Failed to search products', { error, query, options });
      throw error;
    }
  }

  /**
   * Lấy thống kê sản phẩm
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  }> {
    try {
      const stats = await this.productRepository.getStats();

      // Add inStock calculation (total - outOfStock)
      const result = {
        ...stats,
        inStock: stats.total - stats.outOfStock,
      };

      logger.info('Product stats retrieved', result);

      return result;
    } catch (error) {
      logger.error('Failed to get product stats', { error });
      throw error;
    }
  }

  /**
   * Validate product data
   */
  private async validateProductData(data: CreateProductRequest | UpdateProductRequest): Promise<void> {
    if ('name' in data && (!data.name || data.name.trim().length < 2)) {
      throw new ValidationError('Tên sản phẩm phải có ít nhất 2 ký tự');
    }

    if ('name' in data && data.name.trim().length > 200) {
      throw new ValidationError('Tên sản phẩm không được quá 200 ký tự');
    }

    if ('sku' in data && (!data.sku || data.sku.trim().length < 2)) {
      throw new ValidationError('Mã sản phẩm (SKU) phải có ít nhất 2 ký tự');
    }

    if ('sku' in data && data.sku.trim().length > 50) {
      throw new ValidationError('Mã sản phẩm (SKU) không được quá 50 ký tự');
    }

    if ('price' in data && (data.price === undefined || data.price <= 0)) {
      throw new ValidationError('Giá sản phẩm phải lớn hơn 0');
    }

    if ('cost' in data && data.cost !== undefined && data.cost < 0) {
      throw new ValidationError('Giá vốn không được âm');
    }

    if ('stock' in data && data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('Tồn kho không được âm');
    }

    if ('minStock' in data && data.minStock !== undefined && data.minStock < 0) {
      throw new ValidationError('Tồn kho tối thiểu không được âm');
    }
  }
}
