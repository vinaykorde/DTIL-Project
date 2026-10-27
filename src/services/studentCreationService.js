/**
 * ============================================================================
 * Student Account Creation Service Layer
 * ============================================================================
 * Bridges the Admin Students UI with the server-side account creation engine.
 * Supports:
 * - Real-time client-side validation
 * - Prevention of duplicate emails and Student IDs
 * - Password generation and validation
 * - Secure communication with the server-side creation endpoint
 * - Direct Supabase Auth and Profiles synchronization
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Generates a random strong password for student onboarding.
 * Format: 3 lowercase + 3 uppercase + 2 digits + 1 special char (e.g. "krtWXZ48#")
 * @returns {string}
 */
export function generateStrongPassword() {
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const specials = '!@#$%&*';

  let pass = '';
  for (let i = 0; i < 3; i++) pass += lowers.charAt(Math.floor(Math.random() * lowers.length));
  for (let i = 0; i < 3; i++) pass += uppers.charAt(Math.floor(Math.random() * uppers.length));
  for (let i = 0; i < 2; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pass += specials.charAt(Math.floor(Math.random() * specials.length));

  // Shuffle
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Validates an individual student record.
 * @param {object} student
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateStudent(student) {
  const errors = [];
  const name = (student?.name || '').trim();
  const studentId = (student?.studentId || student?.student_id || '').trim();
  const email = (student?.email || '').trim().toLowerCase();
  const password = typeof student?.password === 'string' ? student.password : '';

  if (!name) {
    errors.push('Full name is required.');
  }
  if (!studentId) {
    errors.push('Student ID (roll / registration number) is required.');
  }
  if (!email) {
    errors.push('Email address is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`"${email}" is not a valid email address.`);
  }
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks for duplicates within a batch list of students.
 * @param {Array<object>} students
 * @returns {{ hasDuplicates: boolean, duplicateDetails: Array<string> }}
 */
export function checkBatchInternalDuplicates(students) {
  const seenEmails = new Map();
  const seenIds = new Map();
  const duplicateDetails = [];

  students.forEach((s, idx) => {
    const email = (s.email || '').trim().toLowerCase();
    const sid = (s.studentId || s.student_id || '').trim();

    if (email) {
      if (seenEmails.has(email)) {
        duplicateDetails.push(`Email "${email}" is duplicated in rows #${seenEmails.get(email) + 1} and #${idx + 1}.`);
      } else {
        seenEmails.set(email, idx);
      }
    }

    if (sid) {
      if (seenIds.has(sid)) {
        duplicateDetails.push(`Student ID "${sid}" is duplicated in rows #${seenIds.get(sid) + 1} and #${idx + 1}.`);
      } else {
        seenIds.set(sid, idx);
      }
    }
  });

  return {
    hasDuplicates: duplicateDetails.length > 0,
    duplicateDetails
  };
}

/**
 * Inspect server-side creation endpoint capabilities.
 * @returns {Promise<{ configured: boolean, hasServiceKey: boolean, mode: string }>}
 */
export async function checkServerStatus() {
  try {
    const res = await fetch('/api/admin/server-status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('Local server-status check bypassed:', err.message);
  }

  return {
    configured: isSupabaseConfigured(),
    hasServiceKey: false,
    mode: 'publishable_fallback'
  };
}

/**
 * Check whether any email or student ID already exists in Supabase profiles.
 * @param {Array<object>} students
 * @returns {Promise<{ hasConflict: boolean, conflicts: Array<string> }>}
 */
export async function checkExistingDuplicates(students) {
  if (!isSupabaseConfigured()) {
    return { hasConflict: false, conflicts: [] };
  }

  try {
    const emails = students.map(s => (s.email || '').trim().toLowerCase()).filter(Boolean);
    const studentIds = students.map(s => (s.studentId || s.student_id || '').trim()).filter(Boolean);

    if (emails.length === 0 && studentIds.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const conflicts = [];

    // Query profiles for matching emails or student IDs
    const { data: matchedProfiles, error } = await supabase
      .from('profiles')
      .select('email, student_id')
      .or(`email.in.(${emails.map(e => `"${e}"`).join(',')}),student_id.in.(${studentIds.map(s => `"${s}"`).join(',')})`);

    if (!error && Array.isArray(matchedProfiles)) {
      matchedProfiles.forEach(p => {
        if (emails.includes(p.email?.toLowerCase())) {
          conflicts.push(`Email "${p.email}" is already registered in the system.`);
        }
        if (studentIds.includes(p.student_id)) {
          conflicts.push(`Student ID "${p.student_id}" is already assigned to a student.`);
        }
      });
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  } catch (err) {
    console.warn('[Duplicate Check] Note:', err.message);
    return { hasConflict: false, conflicts: [] };
  }
}

/**
 * Primary dispatch function to create student accounts.
 * Executes server-side account creation via:
 * 1. Local Vite server endpoint (`/api/admin/create-students`)
 * 2. Supabase Edge Function (`create-student-accounts`)
 * 
 * @param {Array<object>} students
 * @returns {Promise<{ success: boolean, results: Array<object>, message: string, summary?: object }>}
 */
export async function createStudentAccounts(students) {
  if (!Array.isArray(students) || students.length === 0) {
    throw new Error('Please provide at least one student account to create.');
  }

  // 1. Client-side batch validation
  const batchCheck = checkBatchInternalDuplicates(students);
  if (batchCheck.hasDuplicates) {
    throw new Error(`Batch contains duplicate entries:\n${batchCheck.duplicateDetails.join('\n')}`);
  }

  for (let i = 0; i < students.length; i++) {
    const val = validateStudent(students[i]);
    if (!val.valid) {
      throw new Error(`Row #${i + 1} (${students[i].name || 'Unnamed'}): ${val.errors.join(' ')}`);
    }
  }

  // 2. Pre-check database for existing duplicates
  const dbConflict = await checkExistingDuplicates(students);
  if (dbConflict.hasConflict) {
    throw new Error(`Database Conflict:\n${dbConflict.conflicts.join('\n')}`);
  }

  // 3. Dispatch to Server-Side Endpoint
  try {
    const response = await fetch('/api/admin/create-students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ students })
    });

    const data = await response.json();

    if (!response.ok && !data.results) {
      throw new Error(data.message || `Server responded with status ${response.status}`);
    }

    return data;
  } catch (err) {
    // If local dev server endpoint is not responding, attempt Supabase Edge Function
    if (isSupabaseConfigured() && supabase.functions) {
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-student-accounts', {
          body: { students }
        });

        if (edgeError) {
          throw edgeError;
        }

        return edgeData;
      } catch (edgeErr) {
        console.warn('Edge Function fallback failed:', edgeErr.message);
      }
    }

    throw err;
  }
}
