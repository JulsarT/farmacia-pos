import { Roles } from '../auth/roles.decorator';
import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfigService } from './config.service';

@Roles('ADMIN')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfigs() {
    return this.configService.getConfigs();
  }

  @Put()
  updateConfigs(@Body() body: Record<string, string>) {
    return this.configService.updateConfigs(body);
  }
}
