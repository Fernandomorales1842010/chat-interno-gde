const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    await prisma.$disconnect();
    process.exit(1);
  }
}

check();
