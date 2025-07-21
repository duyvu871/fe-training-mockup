/**
 * Product Repository - Database operations for products
 */

import { PrismaClient, Product, Category, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { PRODUCT_STATUS } from '../utils/constants';

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Tạo sản phẩm mới
   */
  async create(data: {
    name: string;
    description?: string;
    price: number;
    cost?: number;
    sku: string;
    barcode?: string;
    categoryId: string;
    stock?: number;
    minStock?: number;
    unit?: string;
    image?: string;
    isActive?: boolean;
  }): Promise<Product> {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          description: data.description || null,
          price: data.price,
          cost: data.cost || null,
          sku: data.sku,
          barcode: data.barcode || null,
          categoryId: data.categoryId,
          stock: data.stock || 0,
          minStock: data.minStock || 0,
          unit: data.unit || 'cái',
          image: data.image || null,
          isActive: data.isActive !== false,
        },
        include: {
          category: true,
        },
      });

      logger.info('Product created successfully', { 
        productId: product.id, 
        name: product.name, 
        sku: product.sku 
      });
      return product;
    } catch (error) {
      logger.error('Failed to create product', { error, data: { name: data.name, sku: data.sku } });
      throw error;
    }
  }

  /**
   * Tìm sản phẩm theo ID
   */
  async findById(id: string, includeCategory: boolean = true): Promise<Product | null> {
    try {
      return await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: includeCategory,
        },
      });
    } catch (error) {
      logger.error('Failed to find product by ID', { error, id });
      throw error;
    }
  }

  /**
   * Tìm sản phẩm theo SKU
   */
  async findBySku(sku: string, includeCategory: boolean = true): Promise<Product | null> {
    try {
      return await this.prisma.product.findUnique({
        where: { sku },
        include: {
          category: includeCategory,
        },
      });
    } catch (error) {
      logger.error('Failed to find product by SKU', { error, sku });
      throw error;
    }
  }

  /**
   * Tìm sản phẩm theo barcode
   */
  async findByBarcode(barcode: string, includeCategory: boolean = true): Promise<Product | null> {
    try {
      return await this.prisma.product.findUnique({
        where: { barcode },
        include: {
          category: includeCategory,
        },
      });
    } catch (error) {
      logger.error('Failed to find product by barcode', { error, barcode });
      throw error;
    }
  }

  /**
   * Cập nhật sản phẩm
   */
  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      logger.info('Product updated successfully', { productId: id });
      return product;
    } catch (error) {
      logger.error('Failed to update product', { error, id });
      throw error;
    }
  }

  /**
   * Cập nhật stock sản phẩm
   */
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set' = 'set'): Promise<Product> {
    try {
      let updateData: Prisma.ProductUpdateInput;

      switch (operation) {
        case 'add':
          updateData = {
            stock: { increment: quantity },
            updatedAt: new Date(),
          };
          break;
        case 'subtract':
          updateData = {
            stock: { decrement: quantity },
            updatedAt: new Date(),
          };
          break;
        case 'set':
        default:
          updateData = {
            stock: quantity,
            updatedAt: new Date(),
          };
          break;
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      logger.info('Product stock updated', { 
        productId: id, 
        operation, 
        quantity, 
        newStock: product.stock 
      });
      return product;
    } catch (error) {
      logger.error('Failed to update product stock', { error, id, quantity, operation });
      throw error;
    }
  }

  /**
   * Xóa sản phẩm (soft delete)
   */
  async delete(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      logger.info('Product soft deleted', { productId: id });
      return product;
    } catch (error) {
      logger.error('Failed to delete product', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm với phân trang và filter
   */
  async findMany(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    lowStock?: boolean;
    outOfStock?: boolean;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        isActive,
        search,
        minPrice,
        maxPrice,
        lowStock,
        outOfStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProductWhereInput = {};

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (lowStock) {
        where.AND = [
          { 
            stock: { 
              lte: this.prisma.product.fields.minStock 
            } 
          },
          { stock: { gt: 0 } },
        ];
      }

      if (outOfStock) {
        where.stock = { lte: 0 };
      }

      // Build order by
      const orderBy: Prisma.ProductOrderByWithRelationInput = {};
      orderBy[sortBy] = sortOrder;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Products retrieved successfully', { 
        total, 
        page, 
        limit, 
        totalPages,
        filters: { categoryId, isActive, search, minPrice, maxPrice, lowStock, outOfStock } 
      });

      return {
        products,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to retrieve products', { error, options });
      throw error;
    }
  }

  /**
   * Kiểm tra SKU có tồn tại không
   */
  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    try {
      const where: Prisma.ProductWhereInput = { sku };
      
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await this.prisma.product.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check SKU existence', { error, sku });
      throw error;
    }
  }

  /**
   * Kiểm tra barcode có tồn tại không
   */
  async existsByBarcode(barcode: string, excludeId?: string): Promise<boolean> {
    try {
      const where: Prisma.ProductWhereInput = { barcode };
      
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await this.prisma.product.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check barcode existence', { error, barcode });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm sắp hết hàng
   */
  async getLowStockProducts(limit: number = 50): Promise<Product[]> {
    try {
      // We need to do this in raw SQL or use a more complex query
      // For now, let's use a simpler approach
      const products = await this.prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
          ],
        },
        take: limit,
        orderBy: { stock: 'asc' },
        include: {
          category: true,
        },
      });

      // Filter in memory for products where stock <= minStock
      const lowStockProducts = products.filter(product => 
        product.stock <= product.minStock && product.stock > 0
      );

      logger.info('Low stock products retrieved', { count: lowStockProducts.length });
      return lowStockProducts;
    } catch (error) {
      logger.error('Failed to get low stock products', { error });
      throw error;
    }
  }

  /**
   * Lấy sản phẩm hết hàng
   */
  async getOutOfStockProducts(limit: number = 50): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          AND: [
            { stock: { lte: 0 } },
            { isActive: true },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
        },
      });

      logger.info('Out of stock products retrieved', { count: products.length });
      return products;
    } catch (error) {
      logger.error('Failed to get out of stock products', { error });
      throw error;
    }
  }

  /**
   * Lấy thống kê sản phẩm
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    byCategory: Record<string, number>;
    averagePrice: number;
    totalValue: number;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        outOfStockCount,
        categoryStats,
        aggregates,
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({ where: { isActive: false } }),
        this.prisma.product.count({ where: { stock: { lte: 0 } } }),
        this.prisma.product.groupBy({
          by: ['categoryId'],
          _count: { categoryId: true },
        }),
        this.prisma.product.aggregate({
          _avg: { price: true },
          _sum: { 
            stock: true,
          },
        }),
      ]);

      // Get low stock count separately
      const allProducts = await this.prisma.product.findMany({
        select: { stock: true, minStock: true },
        where: { isActive: true },
      });
      const lowStockCount = allProducts.filter(p => p.stock <= p.minStock && p.stock > 0).length;

      const byCategory: Record<string, number> = {};
      categoryStats.forEach(stat => {
        if (stat.categoryId && stat._count) {
          byCategory[stat.categoryId] = stat._count.categoryId;
        }
      });

      const averagePrice = Number(aggregates._avg.price || 0);
      const totalStock = Number(aggregates._sum.stock || 0);
      const totalValue = averagePrice * totalStock;

      return {
        total,
        active,
        inactive,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        byCategory,
        averagePrice,
        totalValue,
      };
    } catch (error) {
      logger.error('Failed to get product stats', { error });
      throw error;
    }
  }
}
