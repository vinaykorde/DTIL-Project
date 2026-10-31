import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateBucket() {
  const { data, error } = await supabase.storage.createBucket('reference-faces', { public: false });
  console.log('createBucket:', data, error?.message);
}

testCreateBucket().catch(console.error);

