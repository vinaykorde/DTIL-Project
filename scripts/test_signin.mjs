import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn() {
  const email = 'test.student.213500@gmail.com';
  const password = 'Password123!';
  console.log('Testing signIn with:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('SignIn Error:', error.message);
  } else {
    console.log('SignIn Success! User ID:', data.user?.id, 'Session:', Boolean(data.session));

    // Now query profiles
    const { data: prof, error: profErr } = await supabase.from('profiles').select('*');
    console.log('Profiles returned:', prof, profErr?.message);

    // Query hostels
    const { data: hostels, error: hErr } = await supabase.from('hostels').select('*');
    console.log('Hostels returned:', hostels, hErr?.message);
  }
}

testSignIn().catch(console.error);

