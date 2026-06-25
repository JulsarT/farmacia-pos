import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { nit: { contains: search, mode: 'insensitive' as const } },
        { contactName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [total, suppliers] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, isActive: true },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(data: any) {
    if (data.nit) {
      const existing = await this.prisma.supplier.findUnique({
        where: { nit: data.nit },
      });
      if (existing) throw new ConflictException('Ya existe un proveedor con este NIT');
    }

    return this.prisma.supplier.create({
      data,
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    
    if (data.nit) {
      const existing = await this.prisma.supplier.findUnique({
        where: { nit: data.nit },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe otro proveedor con este NIT');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAccountBalance(supplierId: number) {
    const accounts = await this.prisma.accountsPayable.findMany({
      where: {
        supplierId,
        isPaid: false,
      },
    });

    const totalPending = accounts.reduce((sum, acc) => sum + Number(acc.pendingAmount), 0);
    return {
      supplierId,
      totalPending,
      pendingInvoicesCount: accounts.length,
    };
  }
}
