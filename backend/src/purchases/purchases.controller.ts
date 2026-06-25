import { Roles } from '../auth/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';

@Roles('ADMIN', 'FARMACEUTICO')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() createPurchaseDto: any) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('supplierId') supplierId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.purchasesService.findAll({ page, limit, search, supplierId, dateFrom, dateTo });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.purchasesService.findOne(id);
  }
}
