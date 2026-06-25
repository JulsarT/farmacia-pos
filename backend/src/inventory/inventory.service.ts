import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getKardex(productId: number, params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 20, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = { productId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, commercialName: true, genericName: true, currentStock: true },
    });

    return {
      product,
      data: movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createAdjustment(dto: {
    productId: number;
    userId: number;
    adjustType: 'ENTRADA' | 'SALIDA';
    quantity: number;
    reason: string;
    notes?: string;
  }) {
    if (dto.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Producto no encontrado');

      const prevStock = product.currentStock as number;
      const newStock = dto.adjustType === 'ENTRADA' 
        ? prevStock + dto.quantity 
        : prevStock - dto.quantity;

      if (newStock < 0) throw new BadRequestException(`Stock insuficiente. Stock actual: ${prevStock}`);

      // Crear ajuste
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          productId: dto.productId,
          userId: dto.userId,
          adjustType: dto.adjustType,
          quantity: dto.quantity,
          reason: dto.reason,
          notes: dto.notes,
        },
      });

      // Actualizar stock
      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock },
      });

      // Movimiento Kardex
      await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          movementType: `AJUSTE_${dto.adjustType}`,
          quantity: dto.quantity,
          previousStock: prevStock,
          currentStock: newStock,
          unitPrice: product.purchasePrice,
          referenceId: String(adjustment.id),
          referenceType: 'adjustment',
          userId: dto.userId,
          notes: dto.reason,
        },
      });

      return adjustment;
    });
  }
}
