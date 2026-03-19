const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function wipe() {
  console.log('🗑️  Wiping all match data...');
  try {
    const p = await prisma.prediction.deleteMany({});
    const m = await prisma.match.deleteMany({});
    console.log(`✅ Deleted ${p.count} predictions and ${m.count} matches.`);
  } catch (e) {
    console.error('❌ Wipe failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
wipe();
