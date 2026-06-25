import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ventas de hoy
    const todaySales = await this.prisma.sale.aggregate({
      where: {
        createdAt: { gte: today },
        status: 'COMPLETADA'
      },
      _sum: { total: true },
      _count: { id: true }
    });

    // Ventas del mes
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await this.prisma.sale.aggregate({
      where: {
        createdAt: { gte: firstDayOfMonth },
        status: 'COMPLETADA'
      },
      _sum: { total: true },
      _count: { id: true }
    });

    // Productos bajos en stock
    const lowStockProducts = await this.prisma.product.count({
      where: {
        currentStock: { lte: this.prisma.product.fields.minStock }
      }
    });

    // Compras del mes (Cuentas por pagar)
    const pendingPayables = await this.prisma.accountsPayable.aggregate({
      where: { isPaid: false },
      _sum: { pendingAmount: true },
      _count: { id: true }
    });

    // Gráfico: Ventas últimos 7 días
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const salesList = await this.prisma.sale.findMany({
      where: { createdAt: { gte: last7Days }, status: 'COMPLETADA' },
      select: { createdAt: true, total: true }
    });

    const salesByDay = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(last7Days);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        total: 0
      };
    });

    salesList.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().slice(0, 10);
      const day = salesByDay.find(d => d.date === dateStr);
      if (day) day.total += Number(sale.total);
    });

    // Top 5 productos más vendidos del mes
    const topProductsRaw = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { createdAt: { gte: firstDayOfMonth }, status: 'COMPLETADA' } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async p => {
      const product = await this.prisma.product.findUnique({ where: { id: p.productId }, select: { commercialName: true } });
      return {
        name: product?.commercialName,
        quantity: p._sum.quantity,
        revenue: p._sum.subtotal
      };
    }));

    return {
      todayRevenue: Number(todaySales._sum.total || 0),
      todaySalesCount: todaySales._count.id,
      monthRevenue: Number(monthSales._sum.total || 0),
      monthSalesCount: monthSales._count.id,
      lowStockProducts,
      pendingPayablesAmount: Number(pendingPayables._sum.pendingAmount || 0),
      pendingPayablesCount: pendingPayables._count.id,
      salesByDay,
      topProducts
    };
  }
}
