import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnon() {
  const { data, error } = await supabase.auth.signInAnonymously();
  console.log('Anonymous sign in:', data?.user?.id, error?.message);
}

testAnon().catch(console.error);

