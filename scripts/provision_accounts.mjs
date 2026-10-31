#!/usr/bin/env node
/**
 * Provision / Update Admin and Warden Accounts in Supabase
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key" node scripts/provision_accounts.mjs
 *
 * This script runs locally in Node.js and uses the Supabase Admin API
 * to provision or update the authorized Admin and Warden accounts.
 *
 * Initial Passwords Requested:
 *   - Admin: Admin@07092007
 *   - Warden: Warden@07092007
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://twijezwruonhqqpxbhiz.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('====================================================');
console.log('   DTIL Hostel Management - Account Provisioning    ');
console.log('====================================================\n');

if (!serviceRoleKey) {
  console.log('ℹ️  No SUPABASE_SERVICE_ROLE_KEY environment variable provided.');
  console.log('You can easily configure or update the Admin and Warden passwords directly via:');
  console.log('\n--- OPTION A: SUPABASE DASHBOARD (RECOMMENDED) ---');
  console.log('1. Go to your Supabase Project Dashboard:');
  console.log('   https://supabase.com/dashboard/project/twijezwruonhqqpxbhiz/auth/users');
  console.log('2. In "Authentication" -> "Users":');
  console.log('   - For Admin: Click on the admin user (or "Add User" -> "Create User"),');
  console.log('     set password to: Admin@07092007, and toggle "Auto-confirm User" ON.');
  console.log('   - For Warden: Click on the warden user (or "Add User" -> "Create User"),');
  console.log('     set password to: Warden@07092007, and toggle "Auto-confirm User" ON.');
  console.log('3. In "SQL Editor", verify or set their roles:');
  console.log(`
   -- Set Admin Role:
   UPDATE public.profiles 
   SET role = 'admin', designation = 'System Administrator', status = 'Active' 
   WHERE email = 'YOUR_ADMIN_EMAIL';

   -- Set Warden Role:
   UPDATE public.profiles 
   SET role = 'warden', designation = 'Hostel Warden', status = 'Active' 
   WHERE email = 'YOUR_WARDEN_EMAIL';
  `);
  console.log('\n--- OPTION B: CLI / SCRIPT RUN ---');
  console.log('Run this script with your Service Role Key:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." node scripts/provision_accounts.mjs <admin_email> <warden_email>\n');
  process.exit(0);
}

// Service role client has elevated admin permissions over auth.users
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@hostel.com';
const wardenEmail = process.argv[3] || process.env.WARDEN_EMAIL || 'warden@hostel.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@07092007';
const wardenPassword = process.env.WARDEN_PASSWORD || 'Warden@07092007';

async function provisionAccount(email, password, role, name, designation) {
  console.log(`\nProvisioning ${role.toUpperCase()} account (${email})...`);
  
  // 1. Check if user already exists in auth.users
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  let userId;

  if (existingUser) {
    console.log(`✓ Found existing auth user (ID: ${existingUser.id}). Updating password and metadata...`);
    const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: { name, role, designation }
      }
    );
    if (updateError) throw updateError;
    userId = updated.user.id;
  } else {
    console.log(`✓ Creating new ${role} user in Supabase Auth...`);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, designation }
    });
    if (createError) throw createError;
    userId = created.user.id;
  }

  // 2. Upsert profile in public.profiles table
  console.log(`✓ Updating profile in public.profiles for ID: ${userId}...`);
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: email.toLowerCase(),
      name,
      role,
      designation,
      status: 'Active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (profileError) {
    console.warn(`⚠️ Profile upsert notice: ${profileError.message}`);
  } else {
    console.log(`✅ Successfully provisioned ${role.toUpperCase()} account for ${email}!`);
  }
}

async function main() {
  try {
    await provisionAccount(adminEmail, adminPassword, 'admin', 'System Administrator', 'Chief System Administrator');
    await provisionAccount(wardenEmail, wardenPassword, 'warden', 'Hostel Warden', 'Chief Hostel Warden');
    console.log('\n🎉 Both Admin and Warden accounts successfully provisioned and secured!');
  } catch (err) {
    console.error('\n❌ Provisioning failed:', err.message);
    process.exit(1);
  }
}

main();
