import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  const adminEmail = 'john@example.com';

  // Check if the admin user already exists
  const existingAdmin = await prisma.appUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

    await prisma.appUser.create({
      data: {
        name: 'John Doe',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN', // Make sure your Prisma User model has a role enum
      },
    });

    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists, skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
