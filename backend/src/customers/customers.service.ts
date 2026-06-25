import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 15) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { nit: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
          isActive: true,
        }
      : { isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { sales: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            saleNumber: true,
            total: true,
            paymentMethod: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(data: any) {
    if (data.nit) {
      const existing = await this.prisma.customer.findUnique({ where: { nit: data.nit } });
      if (existing) throw new ConflictException('Ya existe un cliente con ese NIT/CI');
    }
    return this.prisma.customer.create({ data });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    if (data.nit) {
      const existing = await this.prisma.customer.findFirst({
        where: { nit: data.nit, NOT: { id } },
      });
      if (existing) throw new ConflictException('Ya existe un cliente con ese NIT/CI');
    }
    return this.prisma.customer.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: { isActive: false } });
  }
}
