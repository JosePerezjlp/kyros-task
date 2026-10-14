import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (!adminEmail) {
      console.error('[seed] Missing required environment variable: ADMIN_EMAIL');
    }
    if (!adminPassword) {
      console.error('[seed] Missing required environment variable: ADMIN_PASSWORD');
    }
    process.exit(1);
  }

  // Upsert default categories
  await prisma.category.createMany({
    data: [
      { name: 'Trabajo' },
      { name: 'Personal' },
      { name: 'Estudio' },
    ],
    skipDuplicates: true,
  });
  console.log('[seed] Categories seeded');

  // Upsert default priorities
  await prisma.priority.createMany({
    data: [
      { name: 'Alta' },
      { name: 'Media' },
      { name: 'Baja' },
    ],
    skipDuplicates: true,
  });
  console.log('[seed] Priorities seeded');

  // Upsert ADMIN user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`[seed] ADMIN user created: ${adminEmail}`);
  } else {
    console.log(`[seed] ADMIN user already exists: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
