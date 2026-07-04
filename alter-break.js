const { PrismaClient } = require('@prisma/client');
const url = "postgresql://postgres.gyghqthvxxafjayekgxd:Onkarcg%403319@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
process.env.DATABASE_URL = url;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url
    }
  }
});

async function run() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Break" ADD COLUMN "applyTo" text DEFAULT \'ALL\';');
    console.log('Successfully altered Break table.');
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
