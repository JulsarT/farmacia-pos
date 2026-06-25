import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PurchaseItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  lotNumber?: string;
  expirationDate?: string;
}

interface CreatePurchaseDto {
  supplierId: number;
  userId: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: PurchaseItemDto[];
  amountPaid: number;
  notes?: string;
}

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  private async generatePurchaseNumber(): Promise<string> {
    const count = await this.prisma.purchase.count();
    const num = String(count + 1).padStart(6, '0');
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `COM-${yyyy}${mm}-${num}`;
  }

  async create(dto: CreatePurchaseDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La compra debe tener al menos un producto');
    }

    const purchaseNumber = await this.generatePurchaseNumber();
    
    const itemsWithSubtotal = dto.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    const total = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);

    const purchase = await this.prisma.$transaction(async (tx) => {
      // 1. Crear la compra
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: dto.supplierId,
          userId: dto.userId,
          invoiceNumber: dto.invoiceNumber,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
          subtotal: total,
          total: total,
          amountPaid: dto.amountPaid,
          notes: dto.notes,
        },
      });

      // 2. Procesar items, actualizar stock y registrar lotes
      for (const item of itemsWithSubtotal) {
        let lotId = null;

        // Si viene con lote y fecha de vencimiento, creamos el lote
        if (item.lotNumber && item.expirationDate) {
          const newLot = await tx.productLot.create({
            data: {
              productId: item.productId,
              lotNumber: item.lotNumber,
              expirationDate: new Date(item.expirationDate),
              quantity: item.quantity,
              purchasePrice: item.unitPrice,
            },
          });
          lotId = newLot.id;
        }

        // Crear PurchaseItem
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            lotId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          },
        });

        // Actualizar stock y precio de compra en el producto
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const prevStock = product!.currentStock as number;
        const newStock = prevStock + item.quantity;

        // Actualizamos stock y precio de compra del producto
        await tx.product.update({
          where: { id: item.productId },
          data: { 
            currentStock: newStock,
            purchasePrice: item.unitPrice,
          },
        });

        // Registrar Kárdex
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            lotNumber: item.lotNumber,
            movementType: 'ENTRADA_COMPRA',
            quantity: item.quantity,
            previousStock: prevStock,
            currentStock: newStock,
            unitPrice: item.unitPrice,
            referenceId: String(newPurchase.id),
            referenceType: 'purchase',
            userId: dto.userId,
          },
        });
      }

      // 3. Crear Cuenta por Pagar si el pago es parcial o nulo
      if (dto.amountPaid < total) {
        await tx.accountsPayable.create({
          data: {
            supplierId: dto.supplierId,
            purchaseId: newPurchase.id,
            totalAmount: total,
            paidAmount: dto.amountPaid,
            pendingAmount: total - dto.amountPaid,
            isPaid: false,
          },
        });
      } else if (dto.amountPaid > 0) {
        // Si pagó el 100%, igual creamos la cuenta por pagar pero marcada como pagada
        // Esto para tener historial
        const ap = await tx.accountsPayable.create({
          data: {
            supplierId: dto.supplierId,
            purchaseId: newPurchase.id,
            totalAmount: total,
            paidAmount: dto.amountPaid,
            pendingAmount: 0,
            isPaid: true,
          },
        });

        await tx.payment.create({
          data: {
            accountPayableId: ap.id,
            amount: dto.amountPaid,
            paymentMethod: 'EFECTIVO',
            notes: 'Pago inicial al registrar compra',
          },
        });
      }

      return newPurchase;
    });

    return this.findOne(purchase.id);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    supplierId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, limit = 20, search, supplierId, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' as const } },
        { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (supplierId) where.supplierId = supplierId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [total, purchases] = await Promise.all([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, nit: true } },
          user: { select: { id: true, name: true } },
          accountsPayable: { select: { pendingAmount: true, isPaid: true } },
        },
      }),
    ]);

    return { data: purchases, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: true,
        accountsPayable: true,
        items: {
          include: {
            product: { select: { id: true, commercialName: true, genericName: true } },
            lot: true,
          },
        },
      },
    });
    
    if (!purchase) throw new NotFoundException('Compra no encontrada');
    return purchase;
  }
}
