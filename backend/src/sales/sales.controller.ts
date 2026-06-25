import {
  Controller, Get, Post, Body, Param, Query,
  DefaultValuePipe, ParseIntPipe, ParseEnumPipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() body: any) {
    return this.salesService.create(body);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') userId?: number,
    @Query('status') status?: string,
  ) {
    return this.salesService.findAll({ page, limit, search, dateFrom, dateTo, userId, status });
  }

  @Get('summary/daily')
  getDailySummary() {
    return this.salesService.getDailySummary();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.salesService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: number, @Body() body: { reason: string; userId: number }) {
    return this.salesService.cancel(id, body.reason, body.userId);
  }
}
