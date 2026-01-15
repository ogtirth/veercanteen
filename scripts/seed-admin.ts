import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@veer' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists!');
    console.log('Email: admin@veer');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('admin@veer', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@veer',
      password: hashedPassword,
      name: 'Admin User',
      isAdmin: true,
      isActive: true,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('Email: admin@veer');
  console.log('Password: admin@veer');
  console.log('Role: Admin');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
