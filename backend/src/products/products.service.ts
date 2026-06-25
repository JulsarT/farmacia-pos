import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── CATEGORÍAS ────────────────────────────────────────────────
  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string }) {
    const existing = await this.prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException('La categoría ya existe');
    return this.prisma.category.create({ data });
  }

  async updateCategory(id: number, data: { name: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── LABORATORIOS ──────────────────────────────────────────────
  async getLaboratories() {
    return this.prisma.laboratory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createLaboratory(data: { name: string }) {
    const existing = await this.prisma.laboratory.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException('El laboratorio ya existe');
    return this.prisma.laboratory.create({ data });
  }

  async updateLaboratory(id: number, data: { name: string }) {
    return this.prisma.laboratory.update({ where: { id }, data });
  }

  async deleteLaboratory(id: number) {
    return this.prisma.laboratory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── PRODUCTOS ────────────────────────────────────────────────
  async findAll(params: {
    search?: string;
    categoryId?: number;
    laboratoryId?: number;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, laboratoryId, lowStock, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { commercialName: { contains: search, mode: 'insensitive' as const } },
        { genericName: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
        { internalCode: { contains: search, mode: 'insensitive' as const } },
        { activeIngredient: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (laboratoryId) where.laboratoryId = laboratoryId;
    if (lowStock) {
      // SQLite doesn't support field-to-field comparison directly in Prisma
      // We use a workaround by fetching all and filtering
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { commercialName: 'asc' },
        include: {
          category: { select: { id: true, name: true } },
          laboratory: { select: { id: true, name: true } },
          lots: {
            where: { quantity: { gt: 0 } },
            orderBy: { expirationDate: 'asc' },
          },
        },
      }),
    ]);

    const filtered = lowStock
      ? products.filter((p) => p.currentStock <= p.minStock)
      : products;

    return {
      data: filtered,
      total: lowStock ? filtered.length : total,
      page,
      limit,
      totalPages: Math.ceil((lowStock ? filtered.length : total) / limit),
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        laboratory: true,
        lots: { orderBy: { expirationDate: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(data: any) {
    // Auto-generate sale price if not provided
    if (!data.salePrice1 && data.purchasePrice && data.profitMargin) {
      data.salePrice1 =
        Number(data.purchasePrice) * (1 + Number(data.profitMargin) / 100);
    }
    return this.prisma.product.create({
      data,
      include: { category: true, laboratory: true },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, laboratory: true },
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── LOTES ────────────────────────────────────────────────────
  async getLots(productId: number) {
    return this.prisma.productLot.findMany({
      where: { productId },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async createLot(productId: number, data: any) {
    const lot = await this.prisma.productLot.create({
      data: { ...data, productId },
    });
    // Update current stock
    await this.prisma.product.update({
      where: { id: productId },
      data: { currentStock: { increment: data.quantity } },
    });
    // Register kardex movement
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    await this.prisma.inventoryMovement.create({
      data: {
        productId,
        lotNumber: data.lotNumber,
        movementType: 'ENTRADA_COMPRA',
        quantity: data.quantity,
        previousStock: (product!.currentStock as number) - data.quantity,
        currentStock: product!.currentStock as number,
        unitPrice: data.purchasePrice,
        referenceType: 'lot',
        referenceId: String(lot.id),
      },
    });
    return lot;
  }

  // ─── ALERTAS ─────────────────────────────────────────────────
  async getExpirationAlerts(days = 90) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + days);

    return this.prisma.productLot.findMany({
      where: {
        expirationDate: { lte: limitDate },
        quantity: { gt: 0 },
      },
      include: {
        product: {
          select: { id: true, commercialName: true, genericName: true },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async getLowStockAlerts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        commercialName: true,
        genericName: true,
        currentStock: true,
        minStock: true,
        category: { select: { name: true } },
      },
    });
    return products.filter(
      (p) => (p.currentStock as number) <= (p.minStock as number),
    );
  }

  async getDashboardStats() {
    const [totalProducts, totalCategories, expirationAlerts, lowStockAlerts] =
      await Promise.all([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.category.count({ where: { isActive: true } }),
        this.getExpirationAlerts(30),
        this.getLowStockAlerts(),
      ]);

    return {
      totalProducts,
      totalCategories,
      expirationAlertsCount: expirationAlerts.length,
      lowStockAlertsCount: lowStockAlerts.length,
    };
  }
}
