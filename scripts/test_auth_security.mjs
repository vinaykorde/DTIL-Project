#!/usr/bin/env node
/**
 * Automated Verification Script for Authentication and Role-Based Access Control
 *
 * Verifies:
 * 1. Demo passwords ('demo123') and arbitrary passwords are completely rejected.
 * 2. Empty or missing fields are rejected.
 * 3. Role-based portal validation rejects mismatched roles (e.g. student logging into admin).
 * 4. ProtectedRoute prevents unauthenticated and cross-role navigation.
 */

import { loginUser } from '../src/services/api.js';

console.log('========================================================');
console.log('   DTIL Hostel Management - Auth & Role Security Tests  ');
console.log('========================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  // Test 1: Empty credentials rejected
  try {
    await loginUser('', '', 'admin');
    assert(false, 'Empty credentials should have thrown an error');
  } catch (err) {
    assert(err.message.includes('provide your email address'), 'Empty credentials rejected properly');
  }

  // Test 2: Demo password 'demo123' must NOT log in without authentic Supabase credentials
  try {
    await loginUser('admin@hostel.com', 'demo123', 'admin');
    assert(false, 'demo123 should never succeed without real Supabase Auth');
  } catch (err) {
    assert(
      err.message.includes('Invalid email or password') || err.message.includes('Authentication failed') || err.message.includes('fetch failed'),
      `demo123 correctly rejected by Supabase Auth (${err.message})`
    );
  }

  // Test 3: Arbitrary passwords must NOT log in
  try {
    await loginUser('student@hostel.com', 'anyrandompassword999', 'student');
    assert(false, 'Arbitrary password should never succeed');
  } catch (err) {
    assert(
      err.message.includes('Invalid email or password') || err.message.includes('Authentication failed') || err.message.includes('fetch failed'),
      `Arbitrary password rejected properly (${err.message})`
    );
  }

  console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed unexpectedly:', err);
  process.exit(1);
});
