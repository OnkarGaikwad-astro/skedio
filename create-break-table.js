const { Client } = require('pg');

async function run() {
  const password = encodeURIComponent('Onkarcg@3319');
  const connectionStrings = [
    `postgresql://postgres.gyghqthvxxafjayekgxd:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${password}@db.gyghqthvxxafjayekgxd.supabase.co:5432/postgres`
  ];

  for (const connectionString of connectionStrings) {
    console.log(`Trying connection...`);
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    
    try {
      await client.connect();
      console.log('Connected successfully!');
      
      const sql = `
        CREATE TABLE IF NOT EXISTS "Break" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "schoolId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "startTime" TEXT NOT NULL,
          "endTime" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        ALTER TABLE "Break" ENABLE ROW LEVEL SECURITY;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE policyname = 'Enable read/write for all users' AND tablename = 'Break'
          ) THEN
              CREATE POLICY "Enable read/write for all users" ON "Break" FOR ALL USING (true) WITH CHECK (true);
          END IF;
        END
        $$;
      `;
      
      await client.query(sql);
      console.log('Table created successfully!');
      
      await client.end();
      return; // Success, exit
    } catch (e) {
      console.error('Failed:', e.message);
    }
  }
}

run();
