import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfigs() {
    const configs = await this.prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    configs.forEach(c => configMap[c.key] = c.value);
    
    // Default values if not exist
    return {
      farmaciaName: configMap['farmaciaName'] || 'Mi Farmacia',
      farmaciaAddress: configMap['farmaciaAddress'] || '',
      farmaciaPhone: configMap['farmaciaPhone'] || '',
      farmaciaNit: configMap['farmaciaNit'] || '',
      ticketHeader: configMap['ticketHeader'] || '¡Gracias por su compra!',
    };
  }

  async updateConfigs(data: Record<string, string>) {
    const keys = Object.keys(data);
    
    await this.prisma.$transaction(
      keys.map(key => 
        this.prisma.systemConfig.upsert({
          where: { key },
          update: { value: data[key] },
          create: { key, value: data[key], description: `Configuración para ${key}` }
        })
      )
    );

    return this.getConfigs();
  }
}
