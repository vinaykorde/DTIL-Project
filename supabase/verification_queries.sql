-- ============================================================================
-- SUPABASE SCHEMA PREFLIGHT, VERIFICATION & SECURITY TEST SUITE
-- File: supabase/verification_queries.sql
-- ============================================================================
-- Run these queries in the Supabase Dashboard -> SQL Editor.
-- Covers Preflight verification, RLS enforcement, search_path hardening audit,
-- and all 8 security test dimensions.
-- ============================================================================

-- ============================================================================
-- PART 1: PREFLIGHT CHECKLIST (RUN BEFORE MIGRATION)
-- ============================================================================

-- 1.1 Check existing database tables
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 1.2 Check existing columns in public.profiles to verify schema compatibility
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 1.3 Check for any obsolete views (e.g. available_roommates)
SELECT 
  table_name 
FROM information_schema.views 
WHERE table_schema = 'public';


-- ============================================================================
-- PART 2: POST-MIGRATION STRUCTURE & POLICY VERIFICATION
-- ============================================================================

-- 2.1 Verify ALL 11 tables have Row Level Security (RLS) active (rowsecurity = true)
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected 11 tables with rowsecurity = true:
-- - attendance_records
-- - complaints
-- - fee_records
-- - hostels
-- - leave_requests
-- - notices
-- - presence_records
-- - profiles
-- - roommate_assignments
-- - rooms
-- - visitors

-- 2.2 Verify active RLS policies on each table
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 2.3 Verify that ALL SECURITY DEFINER functions enforce `SET search_path = ''`
-- proconfig MUST contain 'search_path=' (empty search path) to protect against CVE-2018-1058.
SELECT 
  proname, 
  prosecdef,
  proconfig
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;

-- Expected: Every function in the list MUST show prosecdef = true AND proconfig = {search_path=}

-- 2.4 Verify Function Execution Privileges (Least Privilege Principle)
SELECT 
  p.proname,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN (
    'record_system_verified_attendance',
    'bootstrap_initial_admin',
    'handle_new_user',
    'admin_set_user_role',
    'get_compatible_roommates',
    'update_my_profile'
  )
ORDER BY p.proname;

-- Expected privileges:
-- - record_system_verified_attendance: anon = FALSE, authenticated = FALSE (only service_role/postgres)
-- - bootstrap_initial_admin:           anon = FALSE, authenticated = FALSE (only postgres/service_role)
-- - handle_new_user:                   anon = FALSE, authenticated = FALSE (internal trigger only)
-- - admin_set_user_role:               anon = FALSE, authenticated = TRUE (internal check restricts to Admin)
-- - get_compatible_roommates:          anon = FALSE, authenticated = TRUE (checks session and hostel)
-- - update_my_profile:                 anon = FALSE, authenticated = TRUE (only updates caller's personal fields)

-- 2.5 Verify Private Storage Bucket Configuration and RLS
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'reference-faces';

-- Expected: public = FALSE, file_size_limit = 5242880

SELECT 
  policyname, 
  cmd, 
  roles 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'reference_faces_%';


-- ============================================================================
-- PART 3: SIMULATED SECURITY TESTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEST 1: FIRST ADMIN BOOTSTRAP WORKFLOW
-- ----------------------------------------------------------------------------
-- Step A: Sign up in Supabase Auth with your administrator email (e.g. admin@college.edu).
-- Step B: Run this in SQL Editor (operates as postgres superuser):
--
-- SELECT public.bootstrap_initial_admin('admin@college.edu');
--
-- Expected: Returns success JSON. Promotes user to 'admin'.
-- If you run it a second time, it raises:
-- "ERROR: Bootstrap Disabled: System already has 1 active administrator(s). Use admin_set_user_role instead."

-- ----------------------------------------------------------------------------
-- TEST 2: ROLE ESCALATION & PROFILE TAMPERING
-- ----------------------------------------------------------------------------
-- Simulating a student session:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub": "STUDENT_UUID_HERE", "role": "authenticated"}';
--
-- 2A. Attempt self-promotion:
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Only system administrators can modify user roles.
--
-- 2B. Attempt pending fee erasure:
-- UPDATE public.profiles SET pending_fees = 0 WHERE id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Students cannot modify pending fee records.
--
-- 2C. Attempt face-photo path tampering:
-- UPDATE public.profiles SET reference_face_photo_path = 'hacked.jpg' WHERE id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Reference biometric face photo path can only be enrolled by authorized staff.
--
-- 2D. Safe permitted update (via RPC or direct update):
-- SELECT public.update_my_profile(p_phone := '+91 98765 43210', p_sleep_time := 'Late');
-- EXPECTED: SUCCESS.

-- ----------------------------------------------------------------------------
-- TEST 3: WARDEN HOSTEL-SCOPED ACCESS
-- ----------------------------------------------------------------------------
-- Simulating Warden A (assigned to Hostel A):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub": "WARDEN_A_UUID", "role": "authenticated"}';
--
-- 3A. Query rooms in Hostel B:
-- SELECT * FROM public.rooms WHERE hostel_id = 'HOSTEL_B_UUID';
-- (Rooms view policy allows viewing room availability)
--
-- 3B. Attempt to modify rooms in Hostel B:
-- UPDATE public.rooms SET status = 'Maintenance' WHERE hostel_id = 'HOSTEL_B_UUID';
-- EXPECTED: 0 rows affected (RLS WITH CHECK blocks modification outside assigned hostel).
--
-- 3C. Attempt to approve leave request for student in Hostel B:
-- UPDATE public.leave_requests SET status = 'Approved' WHERE id = 'LEAVE_IN_HOSTEL_B_UUID';
-- EXPECTED: ERROR: Security Violation: Wardens can only review leave requests for students in their assigned hostel.
--
-- 3D. Attempt to check in visitor for student in Hostel B:
-- UPDATE public.visitors SET status = 'Checked In' WHERE id = 'VISITOR_IN_HOSTEL_B_UUID';
-- EXPECTED: ERROR: Security Violation: Wardens can only manage visitors for students in their assigned hostel.
--
-- 3E. Attempt to modify own warden role:
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Only system administrators can modify user roles.
--
-- 3F. Warden updates own phone number (permitted personal contact update):
-- UPDATE public.profiles SET phone = '+91 98765 43210' WHERE id = auth.uid();
-- EXPECTED: SUCCESS (1 row affected).
--
-- 3G. Warden attempts to change own assigned hostel:
-- UPDATE public.profiles SET hostel_id = '00000000-0000-0000-0000-000000000002' WHERE id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Wardens cannot modify their own staff role, hostel assignment, or account status.

-- ----------------------------------------------------------------------------
-- TEST 4: ATTENDANCE INTEGRITY & FORGERY PREVENTION
-- ----------------------------------------------------------------------------
-- Simulating a student session:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub": "STUDENT_UUID_HERE", "role": "authenticated"}';
--
-- 4A. Student attempts direct INSERT into attendance_records:
-- INSERT INTO public.attendance_records (student_id, date, status, marked_by)
-- VALUES (auth.uid(), CURRENT_DATE, 'Present', 'SYSTEM_VERIFIED');
-- EXPECTED: ERROR: new row violates row-level security policy for table "attendance_records".
--
-- 4B. Student attempts direct INSERT into presence_records audit log:
-- INSERT INTO public.presence_records (student_id, verification_status, face_match_status, location_status)
-- VALUES (auth.uid(), 'PRESENT', 'VERIFIED', 'INSIDE');
-- EXPECTED: ERROR: new row violates row-level security policy for table "presence_records".
--
-- 4C. Student attempts to execute record_system_verified_attendance RPC:
-- SELECT public.record_system_verified_attendance(auth.uid(), 18.5204, 73.8567, 10, true, 0.95, 'VERIFIED');
-- EXPECTED: ERROR: permission denied for function record_system_verified_attendance
-- (or Access Denied: may only be executed by trusted server runtime).
--
-- 4D. Trusted server process calls record_system_verified_attendance with low similarity score (< 0.60):
-- SELECT public.record_system_verified_attendance(auth.uid(), 18.5204, 73.8567, 10, true, 0.45, 'VERIFIED');
-- EXPECTED: verification_status = 'REJECTED', failure_reason = 'Face similarity score (0.45) is below required verification threshold (0.60).'
--
-- 4E. Trusted server process calls record_system_verified_attendance with non-student UUID:
-- SELECT public.record_system_verified_attendance('WARDEN_UUID_HERE', 18.5204, 73.8567, 10, true, 0.95, 'VERIFIED');
-- EXPECTED: ERROR: Attendance rejected: Target user ... is not a registered student (role: warden).

-- ----------------------------------------------------------------------------
-- TEST 5: LEAVE REQUEST SELF-APPROVAL & IMMUTABILITY
-- ----------------------------------------------------------------------------
-- 5A. Student attempts to insert pre-approved leave:
-- INSERT INTO public.leave_requests (student_id, from_date, to_date, reason, emergency_contact, status, reviewed_by)
-- VALUES (auth.uid(), CURRENT_DATE, CURRENT_DATE + 2, 'Vacation', '9999999999', 'Approved', auth.uid());
-- EXPECTED: Trigger forces status = 'Pending', reviewed_by = NULL.
--
-- 5B. Student attempts to update pending leave to Approved:
-- UPDATE public.leave_requests SET status = 'Approved' WHERE student_id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Students are only permitted to cancel pending requests.

-- ----------------------------------------------------------------------------
-- TEST 6: VISITOR REGISTRATION & CHECK-IN INTEGRITY
-- ----------------------------------------------------------------------------
-- 6A. Student attempts to insert Checked In visitor:
-- INSERT INTO public.visitors (student_id, visitor_name, relationship, phone, visit_time, status)
-- VALUES (auth.uid(), 'John Doe', 'Brother', '9999999999', '14:00', 'Checked In');
-- EXPECTED: Trigger forces status = 'Expected'.
--
-- 6B. Student attempts to update Expected visitor to Checked In:
-- UPDATE public.visitors SET status = 'Checked In' WHERE student_id = auth.uid();
-- EXPECTED: ERROR: Security Violation: Only hostel staff can check in or complete visitor logs.

-- ----------------------------------------------------------------------------
-- TEST 7: PRIVACY-PRESERVING ROOMMATE DISCOVERY
-- ----------------------------------------------------------------------------
-- 7A. Student calls roommate discovery RPC:
-- SELECT * FROM public.get_compatible_roommates();
-- EXPECTED: Returns ONLY students in the SAME hostel who have roommate_status = 'Looking'.
-- Columns returned: id, name, department, year, hostel_id, sleep_time, study_time,
-- cleanliness, food_preference, light_preference, roommate_status.
-- ZERO phone, address, emergency contact, fees, or face photo paths are returned.
--
-- 7B. Querying available_roommates view:
-- SELECT * FROM public.available_roommates;
-- EXPECTED: View does not exist (relation "public.available_roommates" does not exist).
-- Eliminates view-owner RLS bypass risks.
