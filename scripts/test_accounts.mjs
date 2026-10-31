import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccounts() {
  const accounts = [
    { email: 'admin@hostel.com', pass: 'demo123', role: 'admin' },
    { email: 'warden@hostel.com', pass: 'demo123', role: 'warden' },
    { email: 'student@hostel.com', pass: 'demo123', role: 'student' }
  ];

  for (const acc of accounts) {
    console.log(`\nTesting login for ${acc.email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass
    });
    if (error) {
      console.log(`❌ Login failed for ${acc.email}:`, error.message);
    } else {
      console.log(`✅ Login succeeded for ${acc.email}! User ID:`, data.user?.id);
      // Query profiles
      const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', data.user.id);
      console.log('Profile:', prof, profErr?.message);
    }
  }
}

testAccounts().catch(console.error);

