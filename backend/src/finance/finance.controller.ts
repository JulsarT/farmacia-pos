import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('cash-register/active/:userId')
  getActiveRegister(@Param('userId') userId: number) {
    return this.financeService.getActiveRegister(userId);
  }

  @Post('cash-register/open')
  openRegister(@Body() body: { userId: number; openingAmount: number; notes?: string }) {
    return this.financeService.openRegister(body.userId, body.openingAmount, body.notes);
  }

  @Post('cash-register/:id/close')
  closeRegister(@Param('id') id: number, @Body() body: { closingAmount: number; notes?: string }) {
    return this.financeService.closeRegister(id, body.closingAmount, body.notes);
  }

  @Post('cash-register/:id/movement')
  registerMovement(
    @Param('id') id: number,
    @Body() body: { type: 'INGRESO' | 'EGRESO'; amount: number; description: string }
  ) {
    return this.financeService.registerCashMovement(id, body.type, body.amount, body.description);
  }

  @Get('cash-registers')
  getRegistersHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('userId') userId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getRegistersHistory({ page, limit, userId, dateFrom, dateTo });
  }
}
