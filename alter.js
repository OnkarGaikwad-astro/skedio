process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.gyghqthvxxafjayekgxd:Onkarcg%403319@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
});
async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE "Class" ADD COLUMN "subjectIds" text[] DEFAULT \'{}\';');
    console.log('Altered table successfully');
  } catch(e) {
    if (e.message.includes('already exists')) {
      console.log('Column already exists');
    } else {
      console.error(e);
    }
  } finally {
    await client.end();
  }
}
run();
