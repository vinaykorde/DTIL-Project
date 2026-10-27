/**
 * ============================================================================
 * Server-Side Admin Student Account Creation Handler
 * ============================================================================
 * Runs exclusively in Node.js server context (never bundled or sent to the browser).
 * Uses the Supabase service_role key to securely create authenticated student
 * users via the Supabase Admin API and insert corresponding profile records.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Validates a single student account entry.
 * @param {object} student
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStudentEntry(student) {
  if (!student || typeof student !== 'object') {
    return { valid: false, error: 'Student data must be an object.' };
  }

  const name = (student.name || '').trim();
  const studentId = (student.studentId || student.student_id || '').trim();
  const email = (student.email || '').trim().toLowerCase();
  const password = typeof student.password === 'string' ? student.password : '';

  if (!name) {
    return { valid: false, error: 'Full name is required.' };
  }
  if (!studentId) {
    return { valid: false, error: 'Student ID (roll / registration number) is required.' };
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { valid: false, error: `Invalid email address: "${email}".` };
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long.' };
  }

  return { valid: true };
}

/**
 * Creates multiple student accounts using the Supabase Admin API.
 * @param {Array<object>} students
 * @param {object} env
 * @returns {Promise<{ success: boolean, results: Array<object>, message: string }>}
 */
export async function handleCreateStudentAccounts(students, env = {}) {
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl) {
    return {
      success: false,
      results: [],
      message: 'Server configuration error: VITE_SUPABASE_URL is not set.'
    };
  }

  if (!Array.isArray(students) || students.length === 0) {
    return {
      success: false,
      results: [],
      message: 'No student accounts provided to create.'
    };
  }

  // 1. Batch-level internal duplicate check
  const seenEmails = new Set();
  const seenStudentIds = new Set();
  const validationErrors = [];

  students.forEach((s, index) => {
    const val = validateStudentEntry(s);
    if (!val.valid) {
      validationErrors.push(`Student #${index + 1}: ${val.error}`);
      return;
    }

    const email = s.email.trim().toLowerCase();
    const sid = (s.studentId || s.student_id).trim();

    if (seenEmails.has(email)) {
      validationErrors.push(`Duplicate email "${email}" in submission batch.`);
    } else {
      seenEmails.add(email);
    }

    if (seenStudentIds.has(sid)) {
      validationErrors.push(`Duplicate student ID "${sid}" in submission batch.`);
    } else {
      seenStudentIds.add(sid);
    }
  });

  if (validationErrors.length > 0) {
    return {
      success: false,
      results: [],
      message: validationErrors.join(' | ')
    };
  }

  // 2. Initialize Supabase Admin Client
  // If service_role key is available, use it for administrative user creation (auto-confirmed).
  // Otherwise, use publishable key with secondary client.
  const hasServiceKey = Boolean(serviceKey);
  const activeKey = hasServiceKey ? serviceKey : anonKey;

  const supabaseClient = createClient(supabaseUrl, activeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  // 3. Check for existing duplicates in public.profiles
  try {
    const emailList = Array.from(seenEmails);
    const sidList = Array.from(seenStudentIds);

    const { data: existingProfiles, error: checkError } = await supabaseClient
      .from('profiles')
      .select('email, student_id')
      .or(`email.in.(${emailList.map(e => `"${e}"`).join(',')}),student_id.in.(${sidList.map(s => `"${s}"`).join(',')})`);

    if (!checkError && existingProfiles && existingProfiles.length > 0) {
      const existing = existingProfiles[0];
      const conflictField = emailList.includes(existing.email?.toLowerCase())
        ? `Email "${existing.email}" is already registered.`
        : `Student ID "${existing.student_id}" is already assigned.`;

      return {
        success: false,
        results: [],
        message: `Account creation halted: ${conflictField}`
      };
    }
  } catch (err) {
    // If profiles check fails due to RLS, proceed with auth creation which enforces unique email
    console.warn('[Server Account Creation] Pre-check profile notice:', err.message);
  }

  // 4. Create accounts iteratively
  const results = [];

  for (const stu of students) {
    const name = stu.name.trim();
    const studentId = (stu.studentId || stu.student_id).trim();
    const email = stu.email.trim().toLowerCase();
    const password = stu.password;

    try {
      let authUserId = null;

      if (hasServiceKey) {
        // Administrative creation: immediately confirmed, no verification email needed
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            student_id: studentId,
            role: 'student'
          }
        });

        if (authError) {
          results.push({
            success: false,
            name,
            studentId,
            email,
            error: authError.message
          });
          continue;
        }

        authUserId = authData.user.id;
      } else {
        // Fallback: standard signup via non-persisted client
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              student_id: studentId,
              role: 'student'
            }
          }
        });

        if (authError) {
          results.push({
            success: false,
            name,
            studentId,
            email,
            error: authError.message
          });
          continue;
        }

        if (!authData.user) {
          results.push({
            success: false,
            name,
            studentId,
            email,
            error: 'Failed to create auth user.'
          });
          continue;
        }

        authUserId = authData.user.id;
      }

      // Upsert profile record in public.profiles linked to auth.users.id
      const profileData = {
        id: authUserId,
        email,
        name,
        student_id: studentId,
        role: 'student',
        status: 'Active',
        department: stu.department || 'Information Technology',
        year: stu.year || '1st Year',
        hostel_id: stu.hostelId || null,
        room_id: stu.roomId || null,
        bed: stu.bed || 'Bed A',
        phone: stu.phone || null,
        attendance_rate: 100,
        pending_fees: 0
      };

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.warn(`[Profile Upsert Notice] Error for ${email}:`, profileError.message);
      }

      results.push({
        success: true,
        userId: authUserId,
        name,
        studentId,
        email,
        department: profileData.department,
        year: profileData.year,
        hostel: stu.hostel || 'Vikramshilla Boys Hostel',
        room: stu.room || '201',
        bed: profileData.bed,
        phone: profileData.phone,
        status: 'Active',
        autoConfirmed: hasServiceKey
      });
    } catch (err) {
      results.push({
        success: false,
        name,
        studentId,
        email,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return {
    success: successCount > 0,
    hasServiceKey,
    results,
    summary: {
      total: students.length,
      successCount,
      failureCount
    },
    message: failureCount === 0
      ? `Successfully created ${successCount} student account(s) in Supabase.`
      : `Created ${successCount} account(s), but ${failureCount} failed. See details below.`
  };
}
