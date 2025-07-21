import { PrismaClient, StockMovement, StockMovementType, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class StockMovementRepository {
    constructor(private prisma: PrismaClient) { }

    /**
     * Tạo giao dịch xuất nhập kho
     */
    async create(data: {
        productId: string;
        type: StockMovementType;
        quantity: number;
        previousStock: number;
        newStock: number;
        reason?: string;
        reference?: string;
        createdById: string;
    }): Promise<StockMovement> {
        try {
            const stockMovement = await this.prisma.stockMovement.create({
                data: {
                    productId: data.productId,
                    type: data.type,
                    quantity: data.quantity,
                    previousStock: data.previousStock,
                    newStock: data.newStock,
                    reason: data.reason || null,
                    reference: data.reference || null,
                    createdById: data.createdById,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            unit: true,
                        }
                    },
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                },
            });

            logger.info('Stock movement created successfully', {
                stockMovementId: stockMovement.id,
                productId: data.productId,
                type: data.type,
                quantity: data.quantity,
                previousStock: data.previousStock,
                newStock: data.newStock,
                createdById: data.createdById
            });

            return stockMovement;
        } catch (error) {
            logger.error('Failed to create stock movement', { error, data });
            throw error;
        }
    }

    /**
     * Tìm giao dịch theo ID
     */
    async findById(id: string): Promise<StockMovement | null> {
        try {
            return await this.prisma.stockMovement.findUnique({
                where: { id },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            unit: true,
                        }
                    },
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                },
            });
        } catch (error) {
            logger.error('Failed to find stock movement by ID', { error, id });
            throw error;
        }
    }

    /**
     * Lấy danh sách giao dịch với phân trang
     */
    async findMany(options: {
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
            const {
                page = 1,
                limit = 20,
                productId,
                type,
                createdById,
                dateFrom,
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc',
            } = options;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: Prisma.StockMovementWhereInput = {};

            if (productId) {
                where.productId = productId;
            }

            if (type) {
                where.type = type;
            }

            if (createdById) {
                where.createdById = createdById;
            }

            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom) where.createdAt.gte = dateFrom;
                if (dateTo) where.createdAt.lte = dateTo;
            }

            // Build order by
            const orderBy: Prisma.StockMovementOrderByWithRelationInput = {};
            orderBy[sortBy] = sortOrder;

            const [movements, total] = await Promise.all([
                this.prisma.stockMovement.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                            }
                        },
                        createdBy: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                }),
                this.prisma.stockMovement.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            logger.info('Stock movements retrieved successfully', {
                total,
                page,
                limit,
                totalPages,
                filters: { productId, type, createdById, dateFrom, dateTo }
            });

            return {
                movements,
                total,
                page,
                limit,
                totalPages,
            };
        } catch (error) {
            logger.error('Failed to retrieve stock movements', { error, options });
            throw error;
        }
    }

    /**
     * Lấy lịch sử xuất nhập kho của sản phẩm
     */
    async findByProductId(productId: string, options: {
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
        return this.findMany({
            ...options,
            productId,
        });
    }

    /**
     * Lấy giao dịch theo loại
     */
    async findByType(type: StockMovementType, options: {
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
        return this.findMany({
            ...options,
            type,
        });
    }

    /**
     * Lấy giao dịch hôm nay
     */
    async getTodayMovements(): Promise<StockMovement[]> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const movements = await this.prisma.stockMovement.findMany({
                where: {
                    createdAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            unit: true,
                        }
                    },
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            logger.info('Today stock movements retrieved', { count: movements.length });
            return movements;
        } catch (error) {
            logger.error('Failed to get today stock movements', { error });
            throw error;
        }
    }

    /**
     * Lấy thống kê xuất nhập kho
     */
    async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
        total: number;
        byType: Record<string, number>;
        totalQuantityIn: number;
        totalQuantityOut: number;
        recentMovements: number;
        todayMovements: number;
    }> {
        try {
            const whereClause: Prisma.StockMovementWhereInput = {};

            if (dateFrom || dateTo) {
                whereClause.createdAt = {};
                if (dateFrom) whereClause.createdAt.gte = dateFrom;
                if (dateTo) whereClause.createdAt.lte = dateTo;
            }

            // Today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
                total,
                typeStats,
                quantityStats,
                recentMovements,
                todayMovements,
            ] = await Promise.all([
                this.prisma.stockMovement.count({ where: whereClause }),
                this.prisma.stockMovement.groupBy({
                    by: ['type'],
                    _count: { type: true },
                    where: whereClause,
                }),
                this.prisma.stockMovement.findMany({
                    where: whereClause,
                    select: {
                        type: true,
                        quantity: true,
                    }
                }),
                this.prisma.stockMovement.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                        },
                    },
                }),
                this.prisma.stockMovement.count({
                    where: {
                        createdAt: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                }),
            ]);

            const byType: Record<string, number> = {};
            typeStats.forEach(stat => {
                if (stat._count) {
                    byType[stat.type] = stat._count.type;
                }
            });

            // Calculate total quantity in and out
            let totalQuantityIn = 0;
            let totalQuantityOut = 0;

            quantityStats.forEach(stat => {
                if (['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(stat.type)) {
                    totalQuantityIn += stat.quantity;
                } else if (['SALE', 'DAMAGED'].includes(stat.type)) {
                    totalQuantityOut += stat.quantity;
                }
            });

            return {
                total,
                byType,
                totalQuantityIn,
                totalQuantityOut,
                recentMovements,
                todayMovements,
            };
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
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const movements = await this.prisma.stockMovement.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    type: true,
                    quantity: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
            });

            // Group by date
            const dailyData: Record<string, {
                date: string;
                totalMovements: number;
                quantityIn: number;
                quantityOut: number;
                byType: Record<string, number>;
            }> = {};

            movements.forEach(movement => {
                const date = movement.createdAt.toISOString().split('T')[0];
                
                if (!date) return; // Skip if date is invalid
                
                if (!dailyData[date]) {
                    dailyData[date] = {
                        date,
                        totalMovements: 0,
                        quantityIn: 0,
                        quantityOut: 0,
                        byType: {},
                    };
                }

                dailyData[date].totalMovements++;
                dailyData[date].byType[movement.type] = (dailyData[date].byType[movement.type] || 0) + 1;

                if (['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(movement.type)) {
                    dailyData[date].quantityIn += movement.quantity;
                } else if (['SALE', 'DAMAGED'].includes(movement.type)) {
                    dailyData[date].quantityOut += movement.quantity;
                }
            });

            const result = Object.values(dailyData);

            logger.info('Daily stock movement report retrieved', { days, recordCount: result.length });
            return result;
        } catch (error) {
            logger.error('Failed to get daily stock movement report', { error, days });
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
            const result = await this.prisma.stockMovement.groupBy({
                by: ['productId'],
                _count: { productId: true },
                _sum: { quantity: true },
                orderBy: {
                    _count: {
                        productId: 'desc'
                    }
                },
                take: limit,
            });

            const productIds = result.map(item => item.productId);
            const products = await this.prisma.product.findMany({
                where: {
                    id: { in: productIds }
                },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                }
            });

            const productMap = new Map(products.map(p => [p.id, p]));

            const mostActiveProducts = result.map(item => {
                const product = productMap.get(item.productId);
                return {
                    productId: item.productId,
                    productName: product?.name || 'Unknown',
                    productSku: product?.sku || 'Unknown',
                    totalMovements: item._count.productId,
                    totalQuantity: item._sum.quantity || 0,
                };
            });

            logger.info('Most active products retrieved', { limit, count: mostActiveProducts.length });
            return mostActiveProducts;
        } catch (error) {
            logger.error('Failed to get most active products', { error, limit });
            throw error;
        }
    }
}
