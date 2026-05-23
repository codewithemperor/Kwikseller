import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      activeOrders,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] } } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      activeOrders,
      pendingOrders,
    };
  }

  async getRecentOrders(limit = 10) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
        },
        store: {
          select: { id: true, name: true },
        },
        _count: { select: { items: true } },
      },
    });

    return { data: orders };
  }

  async getTopProducts(limit = 10) {
    const products = await this.prisma.product.findMany({
      take: limit,
      orderBy: { totalSales: 'desc' },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    });

    return { data: products };
  }

  async getRevenueChart(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startDate },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueMap = new Map<string, number>();
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const current = revenueMap.get(dateKey) ?? 0;
      revenueMap.set(dateKey, current + order.totalAmount);
    }

    // Fill in missing dates
    const chartData: { date: string; revenue: number; orders: number }[] = [];
    const ordersByDate = new Map<string, number>();

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      ordersByDate.set(dateKey, (ordersByDate.get(dateKey) ?? 0) + 1);
    }

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];

      chartData.push({
        date: dateKey,
        revenue: revenueMap.get(dateKey) ?? 0,
        orders: ordersByDate.get(dateKey) ?? 0,
      });
    }

    return {
      data: chartData,
      meta: {
        days,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: orders.length,
      },
    };
  }
}
