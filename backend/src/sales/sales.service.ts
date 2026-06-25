import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SaleItemDto {
  productId: number;
  lotId?: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface CreateSaleDto {
  customerId?: number;
  userId: number;
  items: SaleItemDto[];
  paymentMethod: string; // EFECTIVO | QR | TARJETA | MIXTO
  amountPaid: number;
  priceLevel?: number;
  discount?: number;
  notes?: string;
}

import { FinanceService } from '../finance/finance.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private finance: FinanceService
  ) {}

  // Generar número de venta correlativo
  private async generateSaleNumber(): Promise<string> {
    const count = await this.prisma.sale.count();
    const num = String(count + 1).padStart(6, '0');
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `VTA-${yyyy}${mm}-${num}`;
  }

  async create(dto: CreateSaleDto) {
    // Validar stock disponible antes de crear la venta
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      if ((product.currentStock as number) < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.commercialName}". Disponible: ${product.currentStock}`,
        );
      }
    }

    const saleNumber = await this.generateSaleNumber();
    const itemsWithSubtotal = dto.items.map((item) => ({
      ...item,
      discount: item.discount ?? 0,
      subtotal: item.quantity * item.unitPrice - (item.discount ?? 0),
    }));

    const subtotal = itemsWithSubtotal.reduce((s, i) => s + i.subtotal, 0);
    const discount = dto.discount ?? 0;
    const total = subtotal - discount;
    const change = dto.amountPaid - total;

    // Crear venta en transacción
    const sale = await this.prisma.$transaction(async (tx) => {
      // 1. Crear la venta
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: dto.customerId ?? null,
          userId: dto.userId,
          subtotal,
          discount,
          total,
          paymentMethod: dto.paymentMethod,
          amountPaid: dto.amountPaid,
          change,
          priceLevel: dto.priceLevel ?? 1,
          notes: dto.notes ?? null,
          status: 'COMPLETADA',
          items: {
            create: itemsWithSubtotal.map((item) => ({
              productId: item.productId,
              lotId: item.lotId ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          user: true,
        },
      });

      // 2. Descontar stock y registrar Kárdex
      for (const item of itemsWithSubtotal) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const prevStock = product!.currentStock as number;
        const newStock = prevStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            movementType: 'SALIDA_VENTA',
            quantity: item.quantity,
            previousStock: prevStock,
            currentStock: newStock,
            unitPrice: item.unitPrice,
            referenceId: String(newSale.id),
            referenceType: 'sale',
          },
        });

        // Descontar del lote específico si se indicó
        if (item.lotId) {
          await tx.productLot.update({
            where: { id: item.lotId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      return newSale;
    });

    // Registrar en caja si es necesario
    if (dto.paymentMethod === 'EFECTIVO' || dto.paymentMethod === 'MIXTO') {
      const activeRegister = await this.finance.getActiveRegister(dto.userId);
      if (activeRegister) {
        await this.finance.registerSalePayment(
          activeRegister.id,
          sale.id,
          dto.amountPaid > total ? total : dto.amountPaid,
          dto.paymentMethod
        );
      }
    }

    return sale;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, dateFrom, dateTo, userId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' as const } },
        { customer: { name: { contains: search, mode: 'insensitive' as const } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [total, sales] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, nit: true } },
          user: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, commercialName: true, genericName: true } },
            },
          },
        },
      }),
    ]);

    return { data: sales, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: {
              include: { category: true, laboratory: true },
            },
            lot: true,
          },
        },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async cancel(id: number, reason: string, userId: number) {
    const sale = await this.findOne(id);
    if (sale.status === 'ANULADA') throw new BadRequestException('La venta ya está anulada');

    // Revertir stock
    await this.prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id },
        data: { status: 'ANULADA', cancelReason: reason },
      });

      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const prevStock = product!.currentStock as number;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            movementType: 'ENTRADA_DEVOLUCION',
            quantity: item.quantity,
            previousStock: prevStock,
            currentStock: prevStock + item.quantity,
            unitPrice: item.unitPrice,
            referenceId: String(sale.id),
            referenceType: 'sale_cancel',
            userId,
            notes: `Anulación venta ${sale.saleNumber}: ${reason}`,
          },
        });

        if (item.lotId) {
          await tx.productLot.update({
            where: { id: item.lotId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      // Revertir movimiento de caja si existía
      const activeRegister = await this.finance.getActiveRegister(userId);
      if (activeRegister) {
        const cashMovement = await tx.cashMovement.findUnique({ where: { saleId: id } });
        if (cashMovement) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: activeRegister.id,
              type: 'EGRESO',
              amount: -Number(cashMovement.amount),
              description: `Anulación de venta ${sale.saleNumber}`,
            }
          });
        }
      }
    });

    return { message: 'Venta anulada correctamente' };
  }

  async getDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: 'COMPLETADA',
      },
      include: { items: true },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((s, v) => s + Number(v.total), 0);
    const totalItems = sales.reduce(
      (s, v) => s + v.items.reduce((si, i) => si + i.quantity, 0),
      0,
    );
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const byPaymentMethod = sales.reduce(
      (acc, v) => {
        acc[v.paymentMethod] = (acc[v.paymentMethod] || 0) + Number(v.total);
        return acc;
      },
      {} as Record<string, number>,
    );

    return { totalSales, totalRevenue, totalItems, avgTicket, byPaymentMethod };
  }
}
