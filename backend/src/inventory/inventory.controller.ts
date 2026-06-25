import { Roles } from '../auth/roles.decorator';
import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Roles('ADMIN', 'FARMACEUTICO')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('kardex/:productId')
  getKardex(
    @Param('productId') productId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.inventoryService.getKardex(productId, { page, limit, dateFrom, dateTo });
  }

  @Post('adjust')
  createAdjustment(@Body() body: any) {
    return this.inventoryService.createAdjustment(body);
  }
}
