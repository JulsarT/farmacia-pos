import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getActiveRegister(userId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { userId, status: 'ABIERTA' },
      include: {
        movements: { orderBy: { createdAt: 'desc' } },
      },
    });
    return register;
  }

  async openRegister(userId: number, openingAmount: number, notes?: string) {
    const active = await this.getActiveRegister(userId);
    if (active) throw new BadRequestException('Ya existe una caja abierta para este usuario');

    return this.prisma.cashRegister.create({
      data: {
        userId,
        openingAmount,
        notes,
        status: 'ABIERTA',
        movements: {
          create: {
            type: 'APERTURA',
            amount: openingAmount,
            description: 'Monto inicial de apertura',
          },
        },
      },
      include: { movements: true },
    });
  }

  async closeRegister(registerId: number, closingAmount: number, notes?: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { movements: true },
    });

    if (!register) throw new NotFoundException('Caja no encontrada');
    if (register.status === 'CERRADA') throw new BadRequestException('La caja ya está cerrada');

    // Calcular esperado: (Solo sumamos los movimientos de EFECTIVO a la caja, QR y tarjeta van a banco)
    const expectedAmount = register.movements.reduce((sum: number, mov: any) => sum + Number(mov.amount), 0);
    const difference = closingAmount - expectedAmount;

    return this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        status: 'CERRADA',
        closingAmount,
        expectedAmount,
        difference,
        closedAt: new Date(),
        notes: notes ? `${register.notes || ''}\nCierre: ${notes}` : register.notes,
      },
    });
  }

  async registerCashMovement(registerId: number, type: 'INGRESO' | 'EGRESO', amount: number, description: string) {
    const register = await this.prisma.cashRegister.findUnique({ where: { id: registerId } });
    if (!register || register.status === 'CERRADA') {
      throw new BadRequestException('La caja no existe o está cerrada');
    }

    const realAmount = type === 'INGRESO' ? amount : -amount;

    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: registerId,
        type,
        amount: realAmount,
        description,
      },
    });
  }

  // Se llama desde SalesService (Idealmente con eventos, pero por ahora directo)
  async registerSalePayment(registerId: number, saleId: number, amount: number, method: string) {
    if (method !== 'EFECTIVO' && method !== 'MIXTO') return; // Solo efectivo entra a caja física
    
    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: registerId,
        saleId,
        type: 'VENTA',
        amount,
        description: `Venta cobrada en efectivo`,
      },
    });
  }

  async getRegistersHistory(params: { page?: number; limit?: number; userId?: number; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 20, userId, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.openedAt = {};
      if (dateFrom) where.openedAt.gte = new Date(dateFrom);
      if (dateTo) where.openedAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [total, registers] = await Promise.all([
      this.prisma.cashRegister.count({ where }),
      this.prisma.cashRegister.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return { data: registers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
