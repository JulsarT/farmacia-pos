import { Roles } from '../auth/roles.decorator';
import { Controller, Get, Post, Put, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';

@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: number) {
    return this.usersService.toggleActive(id);
  }
}
