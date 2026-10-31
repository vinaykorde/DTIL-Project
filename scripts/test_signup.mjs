import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
  const ts = Date.now().toString().slice(-6);
  const email = `test.student.${ts}@gmail.com`;
  const password = 'Password123!';
  console.log('Testing signUp with:', email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Test Student',
        student_id: `STU-${ts}`,
        role: 'student'
      }
    }
  });

  if (error) {
    console.error('SignUp Error:', error);
  } else {
    console.log('SignUp Success! User:', data.user?.id, 'Session:', Boolean(data.session));

    // Try reading profiles as this user
    if (data.session) {
      console.log('User has active session!');
      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        }
      });
      const { data: prof, error: profErr } = await userClient.from('profiles').select('*');
      console.log('Profile as user:', prof, profErr?.message);

      const { data: hostels, error: hErr } = await userClient.from('hostels').select('*');
      console.log('Hostels as user:', hostels, hErr?.message);
    } else {
      console.log('No session returned. User identities:', data.user?.identities);
    }
  }
}

testSignUp().catch(console.error);
