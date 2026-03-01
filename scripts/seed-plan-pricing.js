require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const plans = [
    { plan: 'Free',     name: 'Free',     price: 0,   annualPrice: 0,    currency: 'INR', status: 'active' },
    { plan: 'Standard', name: 'Standard', price: 150, annualPrice: 1440, currency: 'INR', status: 'active' },
    { plan: 'Pro',      name: 'Pro',      price: 20,  annualPrice: 192,  currency: 'INR', status: 'active' },
  ];

  for (const p of plans) {
    const result = await prisma.planPricing.upsert({
      where: { plan: p.plan },
      update: { price: p.price, annualPrice: p.annualPrice, currency: p.currency, status: p.status },
      create: p,
    });
    console.log(`✅ ${result.plan} - ₹${result.price}/month`);
  }

  await prisma.$disconnect();
  console.log('\nPlanPricing seeded successfully!');
}

run().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
