import { PrismaClient, Order, OrderItem, Prisma, OrderStatus, Product, PaymentMethod } from '@prisma/client';
import { logger } from '../utils/logger';
import { ORDER_STATUS, PAYMENT_METHODS } from '../utils/constants';
import { generateOrderNumber } from '../utils/helpers';

export class OrderRepository {
    constructor(private prisma: PrismaClient) { }

    /**
     * Tạo đơn hàng mới với các items
     */
    async create(data: {
        createdById: string;
        items: Array<{
            productId: string;
            quantity: number;
            price: number;
        }>;
        paymentMethod: PaymentMethod;
        notes?: string;
        discount?: number;
        customerName?: string;
        customerPhone?: string;
    }): Promise<Order & { orderItems: (OrderItem & { product: Product })[] }> {
        try {
            // Calculate totals
            const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discount = data.discount || 0;
            const tax = (subtotal - discount) * 0.1; // 10% tax after discount
            const total = subtotal - discount + tax;

            // Generate order number
            const orderNumber = generateOrderNumber();

            const order = await this.prisma.order.create({
                data: {
                    orderNumber,
                    createdById: data.createdById,
                    subtotal,
                    tax,
                    discount,
                    total,
                    customerName: data.customerName || null,
                    customerPhone: data.customerPhone || null,
                    paymentMethod: data.paymentMethod,
                    status: ORDER_STATUS.PENDING,
                    notes: data.notes || null,
                    orderItems: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                        })),
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: true,
                },
            });

            logger.info('Order created successfully', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                createdById: order.createdById,
                total: order.total,
                itemsCount: data.items.length
            });

            return order;
        } catch (error) {
            logger.error('Failed to create order', {
                error,
                data: {
                    createdById: data.createdById,
                    itemsCount: data.items.length,
                    total: data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                }
            });
            throw error;
        }
    }

    /**
     * Tìm đơn hàng theo ID
     */
    async findById(id: string, includeItems: boolean = true): Promise<(Order & { orderItems?: OrderItem[] }) | null> {
        try {
            const itemsInclude = includeItems ? {
                orderItems: {
                    include: {
                        product: true,
                    },
                }
            } : {};
            return await this.prisma.order.findUnique({
                where: { id },
                include: {
                    ...(itemsInclude || {}),
                    createdBy: true
                },
            });
        } catch (error: any) {
            logger.error('Failed to find order by ID', { error, id });
            throw error;
        }
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    async updateStatus(id: string, status: OrderStatus, updatedBy?: string): Promise<Order> {
        try {
            const order = await this.prisma.order.update({
                where: { id },
                data: {
                    status: status,
                    updatedAt: new Date(),
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: true,
                },
            });

            logger.info('Order status updated', {
                orderId: id,
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
     * Cập nhật payment method
     */
    async updatePaymentMethod(id: string, paymentMethod: PaymentMethod): Promise<Order> {
        try {
            const order = await this.prisma.order.update({
                where: { id },
                data: {
                    paymentMethod: paymentMethod,
                    updatedAt: new Date(),
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: true,
                },
            });

            logger.info('Order payment method updated', {
                orderId: id,
                paymentMethod
            });

            return order;
        } catch (error) {
            logger.error('Failed to update order payment method', { error, id, paymentMethod });
            throw error;
        }
    }

    /**
     * Cập nhật đơn hàng
     */
    async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order | null> {
        try {
            const order = await this.prisma.order.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            logger.info('Order updated successfully', {
                orderId: id,
                updatedFields: Object.keys(data)
            });

            return order;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                logger.warn('Order not found for update', { id });
                return null;
            }
            logger.error('Failed to update order', { error, id, data });
            throw error;
        }
    }

    /**
     * Lấy danh sách đơn hàng với phân trang
     */
    async findMany(options: {
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
            const {
                page = 1,
                limit = 20,
                userId,
                status,
                paymentMethod,
                customerName,
                dateFrom,
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc',
            } = options;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: Prisma.OrderWhereInput = {};

            if (userId) {
                where.createdById = userId;
            }

            if (status) {
                where.status = status;
            }

            if (paymentMethod) {
                where.paymentMethod = paymentMethod;
            }

            if (customerName) {
                where.customerName = {
                    contains: customerName,
                    mode: 'insensitive',
                };
            }

            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom) where.createdAt.gte = dateFrom;
                if (dateTo) where.createdAt.lte = dateTo;
            }

            // Build order by
            const orderBy: Prisma.OrderOrderByWithRelationInput = {};
            orderBy[sortBy] = sortOrder;

            const [orders, total] = await Promise.all([
                this.prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        orderItems: {
                            include: {
                                product: true,
                            },
                        },
                        createdBy: true,
                    },
                }),
                this.prisma.order.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            logger.info('Orders retrieved successfully', {
                total,
                page,
                limit,
                totalPages,
                filters: { userId, status, paymentMethod, customerName, dateFrom, dateTo }
            });

            return {
                orders,
                total,
                page,
                limit,
                totalPages,
            };
        } catch (error) {
            logger.error('Failed to retrieve orders', { error, options });
            throw error;
        }
    }

    /**
     * Lấy đơn hàng theo user
     */
    async findByUserId(userId: string, options: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
    } = {}): Promise<{
        orders: (Order & { orderItems: OrderItem[] })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return this.findMany({
            ...options,
            userId,
        });
    }

    /**
     * Lấy đơn hàng hôm nay
     */
    async getTodayOrders(): Promise<(Order & { orderItems: OrderItem[] })[]> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const orders = await this.prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: true,
                },
                orderBy: { createdAt: 'desc' },
            });

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
    async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
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
            const whereClause: Prisma.OrderWhereInput = {};

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
                statusStats,
                paymentStats,
                aggregates,
                todayStats,
                recentOrders,
            ] = await Promise.all([
                this.prisma.order.count({ where: whereClause }),
                this.prisma.order.groupBy({
                    by: ['status'],
                    _count: { status: true },
                    where: whereClause,
                }),
                this.prisma.order.groupBy({
                    by: ['paymentMethod'],
                    _count: { paymentMethod: true },
                    where: whereClause,
                }),
                this.prisma.order.aggregate({
                    _sum: { total: true },
                    _avg: { total: true },
                    where: whereClause,
                }),
                this.prisma.order.aggregate({
                    _sum: { total: true },
                    _count: true,
                    where: {
                        createdAt: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                }),
                this.prisma.order.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                        },
                    },
                }),
            ]);

            const byStatus: Record<string, number> = {};
            statusStats.forEach(stat => {
                if (stat._count) {
                    byStatus[stat.status] = stat._count.status;
                }
            });

            const byPaymentMethod: Record<string, number> = {};
            paymentStats.forEach(stat => {
                if (stat._count) {
                    byPaymentMethod[stat.paymentMethod] = stat._count.paymentMethod;
                }
            });

            const totalRevenue = Number(aggregates._sum.total || 0);
            const averageOrderValue = Number(aggregates._avg.total || 0);
            const todayRevenue = Number(todayStats._sum.total || 0);
            const todayOrders = todayStats._count || 0;

            return {
                total,
                totalRevenue,
                averageOrderValue,
                byStatus,
                byPaymentMethod,
                recentOrders,
                todayRevenue,
                todayOrders,
            };
        } catch (error) {
            logger.error('Failed to get order stats', { error });
            throw error;
        }
    }

    /**
     * Hủy đơn hàng
     */
    async cancel(id: string, cancelReason?: string): Promise<Order> {
        try {
            const order = await this.prisma.order.update({
                where: { id },
                data: {
                    status: ORDER_STATUS.CANCELLED,
                    notes: cancelReason ? `Hủy đơn: ${cancelReason}` : 'Đơn hàng đã bị hủy',
                    updatedAt: new Date(),
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    createdBy: true,
                },
            });

            logger.info('Order cancelled', {
                orderId: id,
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
    async complete(id: string): Promise<Order> {
        return this.updateStatus(id, ORDER_STATUS.COMPLETED);
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
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const dailyStats = await this.prisma.order.groupBy({
                by: ['createdAt'],
                _sum: { total: true },
                _count: true,
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: { in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PROCESSING] },
                },
            });

            const result = dailyStats.map(stat => ({
                date: stat.createdAt.toISOString().split('T')[0] || 'N/A',
                revenue: Number(stat._sum.total || 0),
                orderCount: stat._count,
            }));

            logger.info('Daily revenue retrieved', { days, recordCount: result.length });
            return result;
        } catch (error) {
            logger.error('Failed to get daily revenue', { error, days });
            throw error;
        }
    }
}
