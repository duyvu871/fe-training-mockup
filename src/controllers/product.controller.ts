/**
 * Product Controller - Handles product-related endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { PrismaClient, StockMovementType } from '@prisma/client';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../utils/errors';
import { validatePaginationParams } from '../utils/validation';

export class ProductController {
  private productService: ProductService;

  constructor(prisma: PrismaClient) {
    const productRepository = new ProductRepository(prisma);
    const categoryRepository = new CategoryRepository(prisma);
    const stockMovementRepository = new StockMovementRepository(prisma);
    this.productService = new ProductService(productRepository, categoryRepository, stockMovementRepository);
  }

  /**
   * Get all products with pagination and filters
   * GET /api/products
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, categoryId, status, sortBy, sortOrder } = req.query;

      // Validate pagination
      const { validatedPage, validatedLimit } = validatePaginationParams(
        Number(page),
        Number(limit)
      );

      const options: any = {
        page: validatedPage,
        limit: validatedLimit
      };

      if (search) options.search = search as string;
      if (categoryId) options.categoryId = categoryId as string;
      if (status === 'active') options.isActive = true;
      if (status === 'inactive') options.isActive = false;
      if (sortBy) options.sortBy = sortBy as 'name' | 'price' | 'stock' | 'createdAt';
      if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.productService.getProducts(options);

      logger.info('Products retrieved successfully', {
        page: validatedPage,
        limit: validatedLimit,
        total: result.total,
        options
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy danh sách sản phẩm thành công')
      );
    } catch (error) {
      logger.error('Get products failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      const product = await this.productService.getProductById(id);

      logger.info('Product retrieved by ID', { productId: id });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ product }, 'Lấy thông tin sản phẩm thành công')
      );
    } catch (error) {
      logger.error('Get product by ID failed', {
        error: (error as Error).message,
        productId: req.params.id
      });
      next(error);
    }
  }

  /**
   * Create new product
   * POST /api/products
   */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, sku, description, price, costPrice, barcode, categoryId, stockQuantity, minimumStock, unit, image } = req.body;

      if (!name || !sku || !price || !categoryId || !unit) {
        throw new ValidationError('Tên, SKU, giá, danh mục và đơn vị là bắt buộc');
      }

      const productData: any = {
        name,
        sku,
        price: Number(price),
        categoryId,
        unit,
        stock: stockQuantity ? Number(stockQuantity) : 0,
        minStock: minimumStock ? Number(minimumStock) : 0
      };

      if (description) productData.description = description;
      if (costPrice !== undefined) productData.cost = Number(costPrice);
      if (barcode) productData.barcode = barcode;
      if (image) productData.image = image;

      const product = await this.productService.createProduct(productData);

      logger.info('Product created successfully', {
        productId: product.id,
        name: product.name,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse({ product }, 'Tạo sản phẩm mới thành công')
      );
    } catch (error) {
      logger.error('Create product failed', {
        error: (error as Error).message,
        productData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        sku,
        description, 
        price, 
        cost, 
        barcode, 
        categoryId, 
        stock, 
        minStock, 
        unit, 
        image, 
        isActive 
      } = req.body;

      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (sku !== undefined) updateData.sku = sku;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (cost !== undefined) updateData.cost = Number(cost);
      if (barcode !== undefined) updateData.barcode = barcode;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (stock !== undefined) updateData.stock = Number(stock);
      if (minStock !== undefined) updateData.minStock = Number(minStock);
      if (unit !== undefined) updateData.unit = unit;
      if (image !== undefined) updateData.image = image;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('Cần ít nhất một trường để cập nhật');
      }

      console.log('Update product data:', updateData);

      const product = await this.productService.updateProduct(id, updateData);

      logger.info('Product updated successfully', {
        productId: id,
        updatedFields: Object.keys(updateData),
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ product }, 'Cập nhật sản phẩm thành công')
      );
    } catch (error) {
      logger.error('Update product failed', {
        error: (error as Error).message,
        productId: req.params.id,
        updateData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      await this.productService.deleteProduct(id);

      logger.info('Product deleted successfully', {
        productId: id,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(null, 'Xóa sản phẩm thành công')
      );
    } catch (error) {
      logger.error('Delete product failed', {
        error: (error as Error).message,
        productId: req.params.id,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update product stock
   * PUT /api/products/:id/stock
   */
  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, reason, type } = req.body;

      if (!id) {
        throw new ValidationError('ID sản phẩm là bắt buộc');
      }

      if (quantity === undefined || !reason || !type) {
        throw new ValidationError('Số lượng, lý do và loại thao tác là bắt buộc');
      }

      const result = await this.productService.adjustStock({
        productId: id,
        quantity: Number(quantity),
        reason,
        type: type as StockMovementType,
        userId: req.user?.userId || ''
      });

      logger.info('Product stock updated successfully', {
        productId: id,
        quantity: Number(quantity),
        type,
        reason,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ product: result }, 'Cập nhật tồn kho thành công')
      );
    } catch (error) {
      logger.error('Update product stock failed', {
        error: (error as Error).message,
        productId: req.params.id,
        stockData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get low stock products
   * GET /api/products/low-stock
   */
  async getLowStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await this.productService.getLowStockProducts();

      logger.info('Low stock products retrieved', {
        count: products.length
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ products }, 'Lấy danh sách sản phẩm sắp hết hàng thành công')
      );
    } catch (error) {
      logger.error('Get low stock products failed', {
        error: (error as Error).message
      });
      next(error);
    }
  }
}
