import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  console.log('Testing RPC calls...');
  // Test update_my_profile
  const { data: d1, error: e1 } = await supabase.rpc('update_my_profile', {});
  console.log('update_my_profile RPC:', d1, e1?.message);

  // Test get_compatible_roommates
  const { data: d2, error: e2 } = await supabase.rpc('get_compatible_roommates');
  console.log('get_compatible_roommates RPC:', d2, e2?.message);

  // Test bootstrap_initial_admin
  const { data: d3, error: e3 } = await supabase.rpc('bootstrap_initial_admin', { admin_email: 'test@test.com' });
  console.log('bootstrap_initial_admin RPC:', d3, e3?.message);
}

testRPC().catch(console.error);

