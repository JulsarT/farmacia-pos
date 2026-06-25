import { Roles } from '../auth/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Roles('ADMIN', 'FARMACEUTICO')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() createSupplierDto: any) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll({ page, limit, search });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/balance')
  getAccountBalance(@Param('id') id: number) {
    return this.suppliersService.getAccountBalance(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateSupplierDto: any) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.suppliersService.delete(id);
  }
}
