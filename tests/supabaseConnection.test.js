import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Parse .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...values] = trimmed.split('=');
    env[key.trim()] = values.join('=').trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

describe('Supabase Client Configuration and Connection', () => {
  it('should have valid VITE_SUPABASE_URL and key in .env.local', () => {
    assert.ok(url, 'VITE_SUPABASE_URL should be present');
    assert.ok(url.startsWith('https://'), 'VITE_SUPABASE_URL must start with https://');
    assert.ok(url.includes('supabase.co'), 'VITE_SUPABASE_URL must point to supabase.co');
    assert.ok(key, 'VITE_SUPABASE_PUBLISHABLE_KEY must be present');
  });

  it('should successfully establish a live client connection to Supabase Auth API', async () => {
    const client = createClient(url, key);
    const { data, error } = await client.auth.getSession();
    assert.strictEqual(error, null, 'Auth getSession should not return an error');
    assert.ok(typeof data === 'object', 'Data object should be returned');
    assert.strictEqual(data.session, null, 'Default session should be null when unauthenticated');
  });
});
