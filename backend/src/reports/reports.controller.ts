import { Roles } from '../auth/roles.decorator';
import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}
