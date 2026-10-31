import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  // Test inserting an empty object to see schema / RLS response
  const { data, error } = await supabase.from('profiles').insert({}).select();
  console.log('Insert empty:', data, error);
}

checkProfiles().catch(console.error);

