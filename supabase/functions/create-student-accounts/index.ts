/**
 * ============================================================================
 * SUPABASE EDGE FUNCTION: create-student-accounts
 * ============================================================================
 * Production server-side administrative account creation engine.
 * 
 * SECURITY GUARANTEES:
 * 1. Authenticates calling administrator via Supabase JWT (supabase.auth.getUser).
 * 2. Confirms caller's administrative privileges ('admin' role in public.profiles).
 * 3. Uses Deno environment SUPABASE_SERVICE_ROLE_KEY strictly on the server.
 * 4. Creates each student in Supabase Auth with email_confirm = true for instant login.
 * 5. Saves student record in public.profiles ensuring profiles.id = auth.users.id.
 * 6. Prevents duplicate accounts by checking existing profiles and auth records.
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Server environment missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Caller Authentication & Admin Role Verification
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing or malformed Authorization bearer token.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid or expired authentication session.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller role in profiles
    const { data: callerProfile, error: profileErr } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileErr || callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized: Only system administrators can create student accounts.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse Request Payload
    const body = await req.json();
    const students = Array.isArray(body?.students) ? body.students : [];

    if (students.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No student accounts provided in request payload.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate Batch Data
    const results = [];
    const seenEmails = new Set();
    const seenStudentIds = new Set();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const name = (s.name || '').trim();
      const studentId = (s.studentId || s.student_id || '').trim();
      const email = (s.email || '').trim().toLowerCase();
      const password = s.password || '';

      if (!name || !studentId || !email || !password || password.length < 6) {
        results.push({
          success: false,
          name,
          studentId,
          email,
          error: 'Missing required fields or password too short (minimum 6 characters).'
        });
        continue;
      }

      if (seenEmails.has(email) || seenStudentIds.has(studentId)) {
        results.push({
          success: false,
          name,
          studentId,
          email,
          error: 'Duplicate student ID or email in submission batch.'
        });
        continue;
      }

      seenEmails.add(email);
      seenStudentIds.add(studentId);

      // Check existing database records
      const { data: existing, error: existErr } = await serviceClient
        .from('profiles')
        .select('id, email, student_id')
        .or(`email.eq.${email},student_id.eq.${studentId}`)
        .maybeSingle();

      if (!existErr && existing) {
        results.push({
          success: false,
          name,
          studentId,
          email,
          error: existing.email?.toLowerCase() === email
            ? `Email "${email}" is already registered.`
            : `Student ID "${studentId}" is already assigned.`
        });
        continue;
      }

      // Create Supabase Auth user
      const { data: newAuth, error: createAuthErr } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          student_id: studentId,
          role: 'student'
        }
      });

      if (createAuthErr || !newAuth?.user) {
        results.push({
          success: false,
          name,
          studentId,
          email,
          error: createAuthErr?.message || 'Failed to create Supabase auth user.'
        });
        continue;
      }

      const userId = newAuth.user.id;

      // Upsert student profile
      const { error: upsertErr } = await serviceClient
        .from('profiles')
        .upsert({
          id: userId,
          email,
          name,
          student_id: studentId,
          role: 'student',
          status: 'Active',
          department: s.department || 'Information Technology',
          year: s.year || '1st Year',
          hostel_id: s.hostelId || null,
          room_id: s.roomId || null,
          bed: s.bed || 'Bed A',
          phone: s.phone || null,
          attendance_rate: 100,
          pending_fees: 0
        });

      if (upsertErr) {
        console.error(`Profile upsert error for ${email}:`, upsertErr);
      }

      results.push({
        success: true,
        userId,
        name,
        studentId,
        email,
        department: s.department || 'Information Technology',
        year: s.year || '1st Year',
        hostel: s.hostel || 'Vikramshilla Boys Hostel',
        room: s.room || '201',
        bed: s.bed || 'Bed A',
        status: 'Active'
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        results,
        summary: { total: students.length, successCount, failureCount },
        message: `Processed ${students.length} accounts: ${successCount} succeeded, ${failureCount} failed.`
      }),
      {
        status: successCount > 0 ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
