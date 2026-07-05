const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminRollNumber = 'admin';
  const adminPassword = 'password123'; // The default requested by plan

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { roll_number: adminRollNumber }
  });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(adminPassword, salt);

  // Create admin user
  await prisma.user.create({
    data: {
      roll_number: adminRollNumber,
      name: 'Super Admin',
      password_hash: password_hash,
      role: 'admin' // ENUM is 'admin'
    }
  });

  console.log(`✅ Admin account created successfully! Username: ${adminRollNumber} | Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
