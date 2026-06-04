import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type DateRange = { start: Date; end: Date };

interface TopProductInfo {
  productId: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

interface TopCustomerInfo {
  buyerId: string;
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string;
  isNew: boolean;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve vendor store from userId
   */
  async getVendorStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: userId },
    });
    if (!store) {
      throw new NotFoundException('No store found for this vendor. Please create a store first.');
    }
    return store;
  }

  /**
   * Parse period shorthand (7d, 30d, 90d, 1y) or explicit startDate/endDate
   */
  parseDateRange(period?: string, startDate?: string, endDate?: string): DateRange {
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else if (period) {
      const match = period.match(/^(\d+)(d|w|m|y)$/);
      if (!match) {
        throw new BadRequestException(
          'Invalid period format. Use 7d, 30d, 90d, 1y or provide startDate/endDate.',
        );
      }
      const value = parseInt(match[1], 10);
      const unit = match[2];
      start = new Date(end);
      switch (unit) {
        case 'd':
          start.setDate(start.getDate() - value);
          break;
        case 'w':
          start.setDate(start.getDate() - value * 7);
          break;
        case 'm':
          start.setMonth(start.getMonth() - value);
          break;
        case 'y':
          start.setFullYear(start.getFullYear() - value);
          break;
      }
    } else {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }
    if (start > end) {
      throw new BadRequestException('startDate must be before endDate.');
    }

    return { start, end };
  }

  /**
   * GET /vendor/analytics/overview — Key metrics
   */
  async getOverview(storeId: string, dateRange: DateRange) {
    const { start, end } = dateRange;

    const excludedStatuses = ['DRAFT', 'CANCELLED'];

    const [orders, statusGroups, topProducts] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: start, lte: end }, status: { notIn: excludedStatuses } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { storeId, createdAt: { gte: start, lte: end }, status: { notIn: excludedStatuses } },
        _count: { id: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            createdAt: { gte: start, lte: end },
            status: { notIn: excludedStatuses },
          },
        },
        _sum: { totalPrice: true, quantity: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 1,
      }),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Returning customers: buyers who ordered before this period
    const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
    const uniqueCustomers = buyerIds.length;

    const previousOrders = await this.prisma.order.findMany({
      where: {
        storeId,
        buyerId: { in: buyerIds },
        createdAt: { lt: start },
        status: { notIn: excludedStatuses },
      },
      select: { buyerId: true },
      distinct: ['buyerId'],
    });
    const returningCustomers = previousOrders.length;

    // Conversion rate approximation
    const allStoreBuyers = await this.prisma.order.findMany({
      where: { storeId, status: { notIn: excludedStatuses } },
      select: { buyerId: true },
      distinct: ['buyerId'],
    });
    const conversionRate =
      allStoreBuyers.length > 0
        ? parseFloat(((uniqueCustomers / allStoreBuyers.length) * 100).toFixed(2))
        : 0;

    // Top product
    let topProduct: TopProductInfo | null = null;
    if (topProducts.length > 0) {
      const product = await this.prisma.product.findUnique({
        where: { id: topProducts[0].productId },
        select: { id: true, name: true },
      });
      if (product) {
        topProduct = {
          productId: product.id,
          name: product.name,
          revenue: topProducts[0]._sum.totalPrice || 0,
          unitsSold: topProducts[0]._sum.quantity || 0,
        };
      }
    }

    // Status distribution
    const statusDistribution = statusGroups.map((g) => ({
      status: g.status,
      count: g._count.id,
    }));

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      conversionRate,
      returningCustomers,
      uniqueCustomers,
      topProduct,
      statusDistribution,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }

  /**
   * GET /vendor/analytics/revenue — Revenue over time
   */
  async getRevenue(
    storeId: string,
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const { start, end } = dateRange;

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }

    const results = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        strftime('${dateFormat}', o."createdAt") as period,
        COALESCE(SUM(o."totalAmount"), 0) as revenue,
        COUNT(o.id) as orders
      FROM "Order" o
      WHERE o."storeId" = '${storeId}'
        AND o."createdAt" >= '${start.toISOString()}'
        AND o."createdAt" <= '${end.toISOString()}'
        AND o."status" NOT IN ('DRAFT', 'CANCELLED')
      GROUP BY period
      ORDER BY period ASC
      `,
    );

    const totalRevenue = (results as Array<{ revenue: number }>).reduce(
      (sum, r) => sum + Number(r.revenue),
      0,
    );
    const totalOrders = (results as Array<{ orders: number }>).reduce(
      (sum, r) => sum + Number(r.orders),
      0,
    );

    return {
      data: results,
      meta: { totalRevenue, totalOrders },
      groupBy,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }

  /**
   * GET /vendor/analytics/products — Product performance
   */
  async getProductPerformance(
    storeId: string,
    dateRange: DateRange,
    limit: number = 20,
  ) {
    const { start, end } = dateRange;

    const products = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
      },
      _sum: { totalPrice: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    // Enrich with product details
    const productIds = products.map((p) => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        images: { where: { isMain: true }, take: 1, select: { url: true } },
        category: { select: { name: true } },
      },
    });

    const detailsMap = new Map<string, {
      name: string;
      price: number;
      status: string;
      categoryName: string | null;
      imageUrl: string | null;
    }>(
      productDetails.map((p: any) => [
        p.id,
        {
          name: p.name ?? 'Unknown',
          price: p.price ?? 0,
          status: p.status ?? 'ACTIVE',
          categoryName: p.category?.name ?? null,
          imageUrl: p.images?.[0]?.url ?? null,
        },
      ]),
    );

    // Total order items for the store in range (for conversion rate calc)
    const totalOrderItems = await this.prisma.orderItem.count({
      where: {
        order: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
      },
    });

    return products.map((p) => {
      const detail = detailsMap.get(p.productId);
      const unitsSold = p._sum.quantity || 0;
      const revenue = p._sum.totalPrice || 0;
      const orderCount = p._count.id;

      return {
        productId: p.productId,
        name: detail?.name || 'Unknown Product',
        price: detail?.price ?? 0,
        status: detail?.status ?? 'ACTIVE',
        category: detail?.categoryName ?? null,
        imageUrl: detail?.imageUrl ?? null,
        unitsSold,
        revenue,
        orderCount,
        views: 0, // Product views not tracked in schema
        conversionRate:
          orderCount > 0
            ? parseFloat(((orderCount / totalOrderItems) * 100).toFixed(2))
            : 0,
      };
    });
  }

  /**
   * GET /vendor/analytics/orders — Order analytics
   */
  async getOrderAnalytics(storeId: string, dateRange: DateRange) {
    const { start, end } = dateRange;

    const where = {
      storeId,
      createdAt: { gte: start, lte: end },
    };

    const [statusGroups, orderVolume, totalAgg] = await Promise.all([
      // Status distribution
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      // Order volume over time (daily)
      this.prisma.$queryRawUnsafe(
        `
        SELECT
          strftime('%Y-%m-%d', o."createdAt") as period,
          COUNT(o.id) as orders,
          COALESCE(SUM(o."totalAmount"), 0) as revenue
        FROM "Order" o
        WHERE o."storeId" = '${storeId}'
          AND o."createdAt" >= '${start.toISOString()}'
          AND o."createdAt" <= '${end.toISOString()}'
        GROUP BY period
        ORDER BY period ASC
        `,
      ),
      // Totals
      this.prisma.order.aggregate({
        where,
        _count: { id: true },
        _sum: { totalAmount: true, subtotal: true, shippingFee: true, discount: true },
        _avg: { totalAmount: true },
      }),
    ]);

    // Payment status distribution
    const paymentStatusGroups = await this.prisma.order.groupBy({
      by: ['paymentStatus'],
      where,
      _count: { id: true },
    });

    return {
      statusDistribution: statusGroups.map((g) => ({
        status: g.status,
        count: g._count.id,
        totalAmount: g._sum.totalAmount || 0,
      })),
      paymentStatusDistribution: paymentStatusGroups.map((g) => ({
        paymentStatus: g.paymentStatus,
        count: g._count.id,
      })),
      orderVolume,
      summary: {
        totalOrders: totalAgg._count.id,
        totalRevenue: totalAgg._sum.totalAmount || 0,
        totalSubtotal: totalAgg._sum.subtotal || 0,
        totalShipping: totalAgg._sum.shippingFee || 0,
        totalDiscount: totalAgg._sum.discount || 0,
        avgOrderValue: totalAgg._avg.totalAmount
          ? parseFloat(totalAgg._avg.totalAmount.toFixed(2))
          : 0,
      },
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }

  /**
   * GET /vendor/analytics/customers — Customer analytics
   */
  async getCustomerAnalytics(storeId: string, dateRange: DateRange) {
    const { start, end } = dateRange;

    const excludedStatuses = ['DRAFT', 'CANCELLED'];

    const orders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: start, lte: end }, status: { notIn: excludedStatuses } },
      select: { buyerId: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const buyerIds = [...new Set(orders.map((o) => o.buyerId))];
    const uniqueCustomers = buyerIds.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // New vs returning
    const previousBuyers = await this.prisma.order.findMany({
      where: {
        storeId,
        buyerId: { in: buyerIds },
        createdAt: { lt: start },
        status: { notIn: excludedStatuses },
      },
      select: { buyerId: true },
      distinct: ['buyerId'],
    });
    const returningBuyerIds = new Set(previousBuyers.map((o) => o.buyerId));
    const newCustomers = buyerIds.filter((id) => !returningBuyerIds.has(id)).length;
    const returningCustomers = returningBuyerIds.size;

    // Top customers by order count and value
    const customerStats = new Map<
      string,
      { orderCount: number; totalSpent: number; lastOrderDate: Date }
    >();
    for (const order of orders) {
      const existing = customerStats.get(order.buyerId);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.totalAmount;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
        }
      } else {
        customerStats.set(order.buyerId, {
          orderCount: 1,
          totalSpent: order.totalAmount,
          lastOrderDate: order.createdAt,
        });
      }
    }

    // Sort by totalSpent descending, take top 20
    const topCustomers: TopCustomerInfo[] = [...customerStats.entries()]
      .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
      .slice(0, 20)
      .map(([buyerId, stats]) => ({
        buyerId,
        orderCount: stats.orderCount,
        totalSpent: parseFloat(stats.totalSpent.toFixed(2)),
        avgOrderValue: parseFloat((stats.totalSpent / stats.orderCount).toFixed(2)),
        lastOrderDate: stats.lastOrderDate.toISOString(),
        isNew: !returningBuyerIds.has(buyerId),
      }));

    // Enrich top customers with profile info
    if (topCustomers.length > 0) {
      const topBuyerIds = topCustomers.map((c) => c.buyerId);
      const profiles = await this.prisma.user.findMany({
        where: { id: { in: topBuyerIds } },
        select: {
          id: true,
          email: true,
          phone: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      });
      const profileMap = new Map<string, {
        email: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
      }>(
        profiles.map((p: any) => [
          p.id,
          {
            email: p.email ?? '',
            phone: p.phone ?? null,
            firstName: p.profile?.firstName ?? null,
            lastName: p.profile?.lastName ?? null,
            avatarUrl: p.profile?.avatarUrl ?? null,
          },
        ]),
      );
      for (const customer of topCustomers) {
        const profile = profileMap.get(customer.buyerId);
        if (profile) {
          customer.name =
            [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
            profile.email;
          customer.email = profile.email;
          customer.phone = profile.phone ?? undefined;
          customer.avatarUrl = profile.avatarUrl ?? undefined;
        }
      }
    }

    return {
      uniqueCustomers,
      newCustomers,
      returningCustomers,
      avgOrderValue:
        uniqueCustomers > 0
          ? parseFloat((totalRevenue / uniqueCustomers).toFixed(2))
          : 0,
      topCustomers,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }
}
