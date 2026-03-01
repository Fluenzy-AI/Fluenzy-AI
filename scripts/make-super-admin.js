require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const email = 'achhutajha3@gmail.com';
  const user = await prisma.users.upsert({
    where: { email },
    update: {
      role: 'SUPER_ADMIN',
      plan: 'Pro',
      usageLimit: 999999,
      disabled: false,
    },
    create: {
      email,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      plan: 'Pro',
      usageLimit: 999999,
    },
  });
  console.log('✅ Done!');
  console.log('Email :', user.email);
  console.log('Role  :', user.role);
  console.log('Plan  :', user.plan);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
