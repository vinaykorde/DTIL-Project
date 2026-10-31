import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const tableNames = [
    'profiles', 'hostels', 'rooms', 'attendance_records', 'presence_records',
    'complaints', 'leave_requests', 'notices', 'visitors', 'fee_records',
    'roommate_assignments', 'students', 'attendance', 'users'
  ];

  for (const t of tableNames) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table "${t}": ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table "${t}": OK (rows: ${data.length})`);
    }
  }
}

testTables().catch(console.error);

