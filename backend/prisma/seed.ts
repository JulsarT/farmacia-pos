import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmacia.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@farmacia.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seed exitoso: usuario admin creado.');
  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
