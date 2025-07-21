/**
 * Category service - Business logic for category operations
 */

import { Category } from '@prisma/client';
import { CategoryRepository } from '../repositories/category.repository';
import { logger } from '../utils/logger';
import { 
  ValidationError,
  ConflictError,
  NotFoundError
} from '../utils/errors';

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

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Tạo danh mục mới
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      // Validate input
      if (!data.name || data.name.trim().length < 2) {
        throw new ValidationError('Tên danh mục phải có ít nhất 2 ký tự');
      }

      if (data.name.trim().length > 100) {
        throw new ValidationError('Tên danh mục không được quá 100 ký tự');
      }

      // Check if category name already exists
      const existingCategory = await this.categoryRepository.findByName(data.name.trim());
      if (existingCategory) {
        throw new ConflictError('Tên danh mục đã tồn tại');
      }

      const categoryData = {
        name: data.name.trim(),
        ...(data.description && { description: data.description.trim() }),
        isActive: data.isActive ?? true,
      };

      const category = await this.categoryRepository.create(categoryData);

      logger.info('Category created successfully', {
        categoryId: category.id,
        name: category.name
      });

      return category;
    } catch (error) {
      logger.error('Failed to create category', { error, data });
      throw error;
    }
  }

  /**
   * Lấy danh mục theo ID
   */
  async getCategoryById(id: string, includeProducts: boolean = false): Promise<Category> {
    try {
      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const category = await this.categoryRepository.findById(id, includeProducts);
      if (!category) {
        throw new NotFoundError('Danh mục');
      }

      return category;
    } catch (error) {
      logger.error('Failed to get category by ID', { error, id });
      throw error;
    }
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      // Validate input
      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length < 2) {
          throw new ValidationError('Tên danh mục phải có ít nhất 2 ký tự');
        }

        if (data.name.trim().length > 100) {
          throw new ValidationError('Tên danh mục không được quá 100 ký tự');
        }

        // Check if new name already exists (excluding current category)
        const existingCategory = await this.categoryRepository.existsByName(data.name.trim(), id);
        if (existingCategory) {
          throw new ConflictError('Tên danh mục đã tồn tại');
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const category = await this.categoryRepository.update(id, updateData);
      if (!category) {
        throw new NotFoundError('Danh mục');
      }

      logger.info('Category updated successfully', { 
        categoryId: id, 
        updatedFields: Object.keys(updateData) 
      });

      return category;
    } catch (error) {
      logger.error('Failed to update category', { error, id, data });
      throw error;
    }
  }

  /**
   * Xóa danh mục
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const success = await this.categoryRepository.delete(id);
      if (!success) {
        throw new NotFoundError('Danh mục');
      }

      logger.info('Category deleted successfully', { categoryId: id });
    } catch (error) {
      logger.error('Failed to delete category', { error, id });
      throw error;
    }
  }

  /**
   * Lấy danh sách danh mục với phân trang và tìm kiếm
   */
  async getCategories(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    includeProducts?: boolean;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    categories: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Validate pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20)); // Max 100 items per page

      const result = await this.categoryRepository.findMany({
        ...options,
        page,
        limit,
      });

      logger.info('Categories retrieved successfully', {
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: {
          isActive: options.isActive,
          search: options.search,
          includeProducts: options.includeProducts
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to get categories', { error, options });
      throw error;
    }
  }

  /**
   * Lấy tất cả danh mục đang hoạt động
   */
  async getActiveCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.findAllActive();

      logger.info('Active categories retrieved', { count: categories.length });

      return categories;
    } catch (error) {
      logger.error('Failed to get active categories', { error });
      throw error;
    }
  }

  /**
   * Chuyển đổi trạng thái danh mục
   */
  async toggleCategoryStatus(id: string): Promise<Category> {
    try {
      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const category = await this.categoryRepository.toggleStatus(id);

      logger.info('Category status toggled successfully', {
        categoryId: id,
        newStatus: category.isActive
      });

      return category;
    } catch (error) {
      logger.error('Failed to toggle category status', { error, id });
      throw error;
    }
  }

  /**
   * Lấy thống kê danh mục
   */
  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
    withoutProducts: number;
    totalProducts: number;
  }> {
    try {
      const stats = await this.categoryRepository.getStats();

      logger.info('Category stats retrieved', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to get category stats', { error });
      throw error;
    }
  }

  /**
   * Tìm kiếm danh mục theo tên
   */
  async searchCategories(query: string, options: {
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Category[]> {
    try {
      if (!query || query.trim().length < 2) {
        throw new ValidationError('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
      }

      const searchOptions: any = {
        search: query.trim(),
        limit: options.limit || 20,
        page: 1,
      };

      if (options.isActive !== undefined) {
        searchOptions.isActive = options.isActive;
      }

      const result = await this.categoryRepository.findMany(searchOptions);

      logger.info('Category search completed', {
        query: query.trim(),
        resultCount: result.categories.length
      });

      return result.categories;
    } catch (error) {
      logger.error('Failed to search categories', { error, query, options });
      throw error;
    }
  }

  /**
   * Kiểm tra danh mục có thể xóa được không
   */
  async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const category = await this.categoryRepository.findById(id, true);
      if (!category) {
        throw new NotFoundError('Danh mục');
      }

      // Check if category has products
      const productCount = (category._count?.products || 0);

      if (productCount > 0) {
        return {
          canDelete: false,
          reason: `Danh mục này có ${productCount} sản phẩm, không thể xóa`
        };
      }

      return { canDelete: true };
    } catch (error) {
      logger.error('Failed to check if category can be deleted', { error, id });
      throw error;
    }
  }
}
