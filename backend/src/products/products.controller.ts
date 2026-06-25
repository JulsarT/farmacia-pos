import { Roles } from '../auth/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── CATEGORÍAS ────────────────────────────────────────────────
  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Post('categories')
  createCategory(@Body() body: { name: string }) {
    return this.productsService.createCategory(body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Put('categories/:id')
  updateCategory(@Param('id') id: number, @Body() body: { name: string }) {
    return this.productsService.updateCategory(id, body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: number) {
    return this.productsService.deleteCategory(id);
  }

  // ─── LABORATORIOS ──────────────────────────────────────────────
  @Get('laboratories')
  getLaboratories() {
    return this.productsService.getLaboratories();
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Post('laboratories')
  createLaboratory(@Body() body: { name: string }) {
    return this.productsService.createLaboratory(body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Put('laboratories/:id')
  updateLaboratory(@Param('id') id: number, @Body() body: { name: string }) {
    return this.productsService.updateLaboratory(id, body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Delete('laboratories/:id')
  deleteLaboratory(@Param('id') id: number) {
    return this.productsService.deleteLaboratory(id);
  }

  // ─── ALERTAS ─────────────────────────────────────────────────
  @Get('alerts/expiration')
  getExpirationAlerts(
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
  ) {
    return this.productsService.getExpirationAlerts(days);
  }

  @Get('alerts/low-stock')
  getLowStockAlerts() {
    return this.productsService.getLowStockAlerts();
  }

  @Get('stats/dashboard')
  getDashboardStats() {
    return this.productsService.getDashboardStats();
  }

  // ─── PRODUCTOS ────────────────────────────────────────────────
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('laboratoryId') laboratoryId?: number,
    @Query('lowStock', new DefaultValuePipe(false), ParseBoolPipe)
    lowStock?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.productsService.findAll({
      search,
      categoryId,
      laboratoryId,
      lowStock,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Post()
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.productsService.delete(id);
  }

  // ─── LOTES ────────────────────────────────────────────────────
  @Get(':id/lots')
  getLots(@Param('id') id: number) {
    return this.productsService.getLots(id);
  }

  @Roles('ADMIN', 'FARMACEUTICO')
  @Post(':id/lots')
  createLot(@Param('id') productId: number, @Body() body: any) {
    return this.productsService.createLot(productId, body);
  }
}
