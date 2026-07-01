const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyghqthvxxafjayekgxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z2hxdGh2eHhhZmpheWVrZ3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDcyNTEsImV4cCI6MjA5NjM4MzI1MX0.t-i1asO4donLYttyp31T-7_WmkYt46AQGMsk3mTKTcc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase.from('Break').select('*').limit(1);
  if (error) {
    console.error('Error fetching Break table:', error.message);
  } else {
    console.log('Break table exists. Data:', data);
  }
}

checkTable();
