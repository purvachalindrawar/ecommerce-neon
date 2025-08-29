require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    const r = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ DB OK ->', r);
  } catch (e) {
    console.error('❌ DB FAIL ->', e);
  } finally {
    await prisma.$disconnect();
  }
})();
