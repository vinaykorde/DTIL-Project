import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin.dtil.hostel@gmail.com',
    password: 'Password123!',
    options: {
      data: {
        name: 'Chief Administrator',
        role: 'admin'
      }
    }
  });
  console.log('Admin signup:', data?.user?.id, error?.message);
}

createAdmin().catch(console.error);

