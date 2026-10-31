import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log('Testing storage bucket check...');
  const { data: bucket, error: bErr } = await supabase.storage.getBucket('reference-faces');
  console.log('GetBucket reference-faces:', bucket, bErr?.message);

  // Try creating a tiny dummy file
  const testBytes = Buffer.from('test-image-data');
  const { data: upData, error: upErr } = await supabase.storage
    .from('reference-faces')
    .upload(`test-${Date.now()}.jpg`, testBytes, { contentType: 'image/jpeg' });
  console.log('Upload result:', upData, upErr?.message);
}

testStorage().catch(console.error);

