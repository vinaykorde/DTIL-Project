/**
 * ============================================================================
 * Supabase Client Initialization & Verification Layer
 * ============================================================================
 * Centralized Supabase client for College Hostel Management System.
 * 
 * Configured using environment variables from `.env.local`:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)
 * 
 * SECURITY NOTE:
 * Only use client-side publishable / anon keys in this frontend file.
 * NEVER expose the Supabase service_role key in frontend code.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Read environment variables (supports both Vite import.meta.env and Node process.env)
const supabaseUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ''
).trim();

const supabaseKey = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
  ''
).trim();

/**
 * Validates whether the Supabase configuration variables are present and not empty.
 * @returns {{ valid: boolean, error: string | null }}
 */
function validateConfig() {
  if (!supabaseUrl) {
    return {
      valid: false,
      error: 'Missing VITE_SUPABASE_URL in environment configuration. Please check your .env.local file.'
    };
  }

  if (!supabaseKey) {
    return {
      valid: false,
      error: 'Missing VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in environment configuration. Please check your .env.local file.'
    };
  }

  // Basic format check
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    return {
      valid: false,
      error: `Invalid VITE_SUPABASE_URL format ("${supabaseUrl}"). Expected format: https://<project-ref>.supabase.co`
    };
  }

  return { valid: true, error: null };
}

const configValidation = validateConfig();

if (!configValidation.valid) {
  console.warn(
    `[Supabase Setup] Configuration incomplete: ${configValidation.error}\n` +
    'The application will continue operating in local demo mode. To connect Supabase, ensure .env.local contains:\n' +
    '  VITE_SUPABASE_URL=https://<your-project>.supabase.co\n' +
    '  VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>'
  );
}

/**
 * Reusable Supabase client instance.
 * Created only when valid configuration is present to avoid runtime crashes.
 */
export const supabase = configValidation.valid
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Check whether Supabase environment variables are configured.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return configValidation.valid && supabase !== null;
}

/**
 * Retrieve safe status of the Supabase configuration (never exposes the full secret key).
 * @returns {{ configured: boolean, url: string | null, keyConfigured: boolean, error: string | null }}
 */
export function getSupabaseConfigStatus() {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl || null,
    keyConfigured: Boolean(supabaseKey),
    error: configValidation.error
  };
}

/**
 * Actively test connection to the Supabase project.
 * Verifies network reachability and authentication service response.
 * 
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase client is not configured.',
      error: configValidation.error || 'Missing environment variables.'
    };
  }

  try {
    // Test auth service reachability
    const { error: authError } = await supabase.auth.getSession();

    if (authError) {
      return {
        success: false,
        message: 'Connected to Supabase, but Auth service returned an error.',
        error: authError.message
      };
    }

    return {
      success: true,
      message: 'Successfully reached Supabase project and verified client connection.'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Network error while attempting to connect to Supabase.',
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export default supabase;
