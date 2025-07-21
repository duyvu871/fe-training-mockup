import { PrismaClient, Category, Prisma, Product } from '@prisma/client';
import { logger } from '../utils/logger';

export class CategoryRepository {
    constructor(private prisma: PrismaClient) { }

    /**
     * Tạo danh mục mới
     */
    async create(data: {
        name: string;
        description?: string;
        isActive?: boolean;
    }): Promise<Category> {
        try {
            const category = await this.prisma.category.create({
                data: {
                    name: data.name,
                    description: data.description || null,
                    isActive: data.isActive ?? true,
                },
            });

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
     * Tìm danh mục theo ID
     */
    async findById(id: string, includeProducts: boolean = false): Promise<Category & {
        products: Product[];
        _count: {
            products: number;
        };
    } | null> {
        try {
            return await this.prisma.category.findUnique({
                where: { id },
                include: {
                    products: includeProducts ? {
                        where: { isActive: true },
                        orderBy: { name: 'asc' },

                    } : false,
                    ...this.includeProductCount(includeProducts)
                },
            });
        } catch (error) {
            logger.error('Failed to find category by ID', { error, id });
            throw error;
        }
    }

    /**
     * Tìm danh mục theo tên
     */
    async findByName(name: string): Promise<Category | null> {
        try {
            return await this.prisma.category.findUnique({
                where: { name: name.trim() },
            });
        } catch (error) {
            logger.error('Failed to find category by name', { error, name });
            throw error;
        }
    }

    /**
     * Cập nhật danh mục
     */
    async update(id: string, data: {
        name?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<Category | null> {
        try {
            const category = await this.prisma.category.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                    updatedAt: new Date(),
                },
            });

            logger.info('Category updated successfully', {
                categoryId: id,
                updatedFields: Object.keys(data)
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
    async delete(id: string): Promise<boolean> {
        try {
            // Kiểm tra xem danh mục có sản phẩm không
            const productCount = await this.prisma.product.count({
                where: { categoryId: id }
            });

            if (productCount > 0) {
                throw new Error(`Không thể xóa danh mục vì còn ${productCount} sản phẩm`);
            }

            await this.prisma.category.delete({
                where: { id },
            });

            logger.info('Category deleted successfully', { categoryId: id });
            return true;
        } catch (error) {
            logger.error('Failed to delete category', { error, id });
            throw error;
        }
    }

    /**
     * Lấy danh sách danh mục với phân trang
     */
    async findMany(options: {
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
            const {
                page = 1,
                limit = 20,
                isActive,
                search,
                includeProducts = false,
                sortBy = 'name',
                sortOrder = 'asc',
            } = options;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: Prisma.CategoryWhereInput = {};

            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            if (search) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ];
            }

            // Build order by
            const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
            orderBy[sortBy] = sortOrder;

            const [categories, total] = await Promise.all([
                this.prisma.category.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        products: includeProducts ? {
                            where: { isActive: true },
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                stock: true,
                                isActive: true,
                            },
                            orderBy: { name: 'asc' }
                        } : false,
                        _count: {
                            select: {
                                products: {
                                    where: { isActive: true }
                                }
                            }
                        }
                    },
                }),
                this.prisma.category.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            logger.info('Categories retrieved successfully', {
                total,
                page,
                limit,
                totalPages,
                filters: { isActive, search, includeProducts }
            });

            return {
                categories,
                total,
                page,
                limit,
                totalPages,
            };
        } catch (error) {
            logger.error('Failed to retrieve categories', { error, options });
            throw error;
        }
    }

    /**
     * Lấy tất cả danh mục đang hoạt động
     */
    async findAllActive(): Promise<Category[]> {
        try {
            const categories = await this.prisma.category.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: {
                            products: {
                                where: { isActive: true }
                            }
                        }
                    }
                }
            });

            logger.info('Active categories retrieved', { count: categories.length });
            return categories;
        } catch (error) {
            logger.error('Failed to get active categories', { error });
            throw error;
        }
    }

    /**
     * Kiểm tra xem tên danh mục đã tồn tại chưa
     */
    async existsByName(name: string, excludeId?: string): Promise<boolean> {
        try {
            const where: Prisma.CategoryWhereInput = {
                name: name.trim(),
            };

            if (excludeId) {
                where.id = { not: excludeId };
            }

            const count = await this.prisma.category.count({ where });
            return count > 0;
        } catch (error) {
            logger.error('Failed to check category name exists', { error, name, excludeId });
            throw error;
        }
    }

    /**
     * Lấy thống kê danh mục
     */
    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withProducts: number;
        withoutProducts: number;
        totalProducts: number;
    }> {
        try {
            const [
                total,
                active,
                inactive,
                categoriesWithProductCount,
                totalProducts
            ] = await Promise.all([
                this.prisma.category.count(),
                this.prisma.category.count({ where: { isActive: true } }),
                this.prisma.category.count({ where: { isActive: false } }),
                this.prisma.category.findMany({
                    select: {
                        id: true,
                        _count: {
                            select: {
                                products: {
                                    where: { isActive: true }
                                }
                            }
                        }
                    }
                }),
                this.prisma.product.count({ where: { isActive: true } })
            ]);

            const withProducts = categoriesWithProductCount.filter(cat => cat._count.products > 0).length;
            const withoutProducts = categoriesWithProductCount.filter(cat => cat._count.products === 0).length;

            return {
                total,
                active,
                inactive,
                withProducts,
                withoutProducts,
                totalProducts,
            };
        } catch (error) {
            logger.error('Failed to get category stats', { error });
            throw error;
        }
    }

    /**
     * Chuyển đổi trạng thái danh mục (active/inactive)
     */
    async toggleStatus(id: string): Promise<Category> {
        try {
            // Lấy trạng thái hiện tại
            const currentCategory = await this.findById(id);
            if (!currentCategory) {
                throw new Error('Category not found');
            }

            // Chuyển đổi trạng thái
            const category = await this.update(id, {
                isActive: !currentCategory.isActive
            });

            if (!category) {
                throw new Error('Failed to toggle category status');
            }

            logger.info('Category status toggled', {
                categoryId: id,
                previousStatus: currentCategory.isActive,
                newStatus: category.isActive
            });

            return category;
        } catch (error) {
            logger.error('Failed to toggle category status', { error, id });
            throw error;
        }
    }

    /**
     * Trả về cấu hình để đếm số lượng sản phẩm trong danh mục
     */
    includeProductCount(include: boolean): Prisma.CategoryInclude {
        return include ? {
            _count: {
                select: {
                    products: {
                        where: { isActive: true }
                    }
                }
            }
        } : {};
    }
}
