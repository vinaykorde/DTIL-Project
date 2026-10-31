import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('\n--- 1. HOSTELS ---');
  const { data: hostels, error: hErr } = await supabase.from('hostels').select('*');
  if (hErr) console.error('Hostels error:', hErr.message);
  else console.log(`Found ${hostels.length} hostels:`, hostels.map(h => ({ id: h.id, name: h.name, type: h.type })));

  console.log('\n--- 2. ROOMS ---');
  const { data: rooms, error: rErr } = await supabase.from('rooms').select('*').limit(5);
  if (rErr) console.error('Rooms error:', rErr.message);
  else console.log(`Found rooms sample (${rooms.length}):`, rooms.map(r => ({ id: r.id, room_number: r.room_number, hostel_id: r.hostel_id })));

  console.log('\n--- 3. PROFILES ---');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error('Profiles error:', pErr.message);
  else console.log(`Found ${profiles?.length || 0} profiles:`, profiles?.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    student_id: p.student_id,
    hostel_id: p.hostel_id,
    room_id: p.room_id,
    reference_face_photo_path: p.reference_face_photo_path ? 'YES' : 'NO'
  })));

  console.log('\n--- 4. STORAGE BUCKETS ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) console.error('Buckets error:', bErr.message);
  else console.log('Buckets:', buckets);

  console.log('\n--- 5. TESTING SIGNUP / AUTH ---');
  // Just check if we can inspect auth session
  const { data: sessionData, error: sErr } = await supabase.auth.getSession();
  console.log('Auth getSession:', sessionData, sErr?.message);
}

inspect().catch(console.error);

