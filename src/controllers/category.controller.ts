/**
 * Category Controller - Handles category-related endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../utils/errors';
import { validatePaginationParams } from '../utils/validation';

export class CategoryController {
  private categoryService: CategoryService;

  constructor(prisma: PrismaClient) {
    const categoryRepository = new CategoryRepository(prisma);
    this.categoryService = new CategoryService(categoryRepository);
  }

  /**
   * Get all categories with pagination and filters
   * GET /api/categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status, sortBy, sortOrder } = req.query;

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
      if (status === 'active') options.isActive = true;
      if (status === 'inactive') options.isActive = false;
      if (sortBy) options.sortBy = sortBy as 'name' | 'createdAt';
      if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.categoryService.getCategories(options);

      logger.info('Categories retrieved successfully', {
        page: validatedPage,
        limit: validatedLimit,
        total: result.total,
        options
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(result, 'Lấy danh sách danh mục thành công')
      );
    } catch (error) {
      logger.error('Get categories failed', {
        error: (error as Error).message,
        query: req.query
      });
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const category = await this.categoryService.getCategoryById(id);

      logger.info('Category retrieved by ID', { categoryId: id });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ category }, 'Lấy thông tin danh mục thành công')
      );
    } catch (error) {
      logger.error('Get category by ID failed', {
        error: (error as Error).message,
        categoryId: req.params.id
      });
      next(error);
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        throw new ValidationError('Tên danh mục là bắt buộc');
      }

      const categoryData: any = {
        name: name.trim()
      };

      if (description) {
        categoryData.description = description.trim();
      }

      const category = await this.categoryService.createCategory(categoryData);

      logger.info('Category created successfully', {
        categoryId: category.id,
        name: category.name,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse({ category }, 'Tạo danh mục mới thành công')
      );
    } catch (error) {
      logger.error('Create category failed', {
        error: (error as Error).message,
        categoryData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('Cần ít nhất một trường để cập nhật');
      }

      const category = await this.categoryService.updateCategory(id, updateData);

      logger.info('Category updated successfully', {
        categoryId: id,
        updatedFields: Object.keys(updateData),
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ category }, 'Cập nhật danh mục thành công')
      );
    } catch (error) {
      logger.error('Update category failed', {
        error: (error as Error).message,
        categoryId: req.params.id,
        updateData: req.body,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('ID danh mục là bắt buộc');
      }

      await this.categoryService.deleteCategory(id);

      logger.info('Category deleted successfully', {
        categoryId: id,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(null, 'Xóa danh mục thành công')
      );
    } catch (error) {
      logger.error('Delete category failed', {
        error: (error as Error).message,
        categoryId: req.params.id,
        userId: req.user?.userId
      });
      next(error);
    }
  }

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  async getCategoryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.categoryService.getCategoryStats();

      logger.info('Category stats retrieved');

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse({ stats }, 'Lấy thống kê danh mục thành công')
      );
    } catch (error) {
      logger.error('Get category stats failed', {
        error: (error as Error).message
      });
      next(error);
    }
  }
}
