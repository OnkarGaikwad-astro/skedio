const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Class" ADD COLUMN "subjectIds" text[] DEFAULT \'{}\';');
    console.log('Successfully altered Class table.');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column name')) {
      console.log('Column already exists, skipping.');
    } else {
      console.error(e);
    }
  } finally {
    await prisma.$disconnect();
  }
}
run();
