-- ============================================================================
-- COLLEGE HOSTEL MANAGEMENT SYSTEM - INITIAL SUPABASE DATABASE SCHEMA (HARDENED)
-- Migration: 001_initial_schema.sql
-- ============================================================================
-- Comprehensive, production-grade schema for Supabase (PostgreSQL 15+).
--
-- Security & Architectural Guarantees:
-- 1. All 11 tables have Row Level Security (RLS) enabled.
-- 2. Fully Idempotent & Re-run safe: uses IF NOT EXISTS, DROP POLICY IF EXISTS,
--    and DROP TRIGGER IF EXISTS so re-running will never fail or drop existing data.
-- 3. Function Hardening: ALL SECURITY DEFINER functions explicitly enforce
--    `SET search_path = ''` with fully schema-qualified object references to
--    eliminate CVE-2018-1058 search_path injection risks.
-- 4. Warden Scope Enforcement: Wardens are strictly restricted to their assigned
--    hostel block across profiles, rooms, attendance, presence logs, complaints,
--    leave requests, visitors, fee records, and roommate pairings.
-- 5. Attendance Integrity: Direct student INSERT is revoked on attendance_records
--    and presence_records. Official attendance is recorded strictly by the server
--    verification process (service_role). Fabricated client booleans are rejected.
--    No fallback to an arbitrary hostel: if hostel assignment or geofence config
--    is missing, verification is strictly rejected. Atomic duplicate handling.
-- 6. Profile Privacy: Full profiles are strictly self + authorized staff. The insecure
--    'Looking' view is removed. Roommate discovery is isolated to an authorized RPC
--    returning ONLY compatibility preferences for students in the exact same hostel.
-- 7. Profile Updates: Strict column-level update controls and triggers prevent
--    students from modifying institutional, financial, or biometric fields. Wardens
--    cannot modify their own staff privileges or students outside their hostel.
-- 8. First Admin Bootstrap: Safe bootstrap function prevents SQL Editor lockout
--    when auth.uid() is NULL, while blocking public/anon self-promotion and
--    preventing accidental lockout of the last active administrator.
-- 9. Hostel Settings Preserved: Default coordinates (18.5204000, 73.8567000, 100m, 50m)
--    are preserved as table defaults. No assumed hostel records are inserted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Enable UUID extension (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard helper function to automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- Server-side Haversine Distance Calculation (Distance in meters)
-- Used by the attendance verification engine to validate geofences independently.
CREATE OR REPLACE FUNCTION public.calculate_haversine_distance_m(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  r NUMERIC := 6371000; -- Earth radius in meters
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  dlat := pg_catalog.radians(lat2 - lat1);
  dlon := pg_catalog.radians(lon2 - lon1);
  a := pg_catalog.sin(dlat / 2.0)^2 + pg_catalog.cos(pg_catalog.radians(lat1)) * pg_catalog.cos(pg_catalog.radians(lat2)) * pg_catalog.sin(dlon / 2.0)^2;
  c := 2.0 * pg_catalog.atan2(pg_catalog.sqrt(a), pg_catalog.sqrt(1.0 - a));
  RETURN pg_catalog.round(r * c);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. HOSTELS TABLE
-- Represents the hostel buildings and their geofencing boundaries.
-- Existing geographic configuration is strictly preserved.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Boys', 'Girls', 'Co-ed')),
  total_rooms INTEGER NOT NULL DEFAULT 0,
  -- Geofencing coordinates (Defaults to Vikramshilla Boys Hostel location preserved)
  latitude NUMERIC(10, 7) NOT NULL DEFAULT 18.5204000,
  longitude NUMERIC(10, 7) NOT NULL DEFAULT 73.8567000,
  radius NUMERIC NOT NULL DEFAULT 100,         -- Geofence radius in meters
  max_accuracy NUMERIC NOT NULL DEFAULT 50,    -- Max acceptable GPS accuracy in meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.hostels IS 'Hostel buildings and their geographic boundaries for attendance.';

DROP TRIGGER IF EXISTS set_hostels_updated_at ON public.hostels;
CREATE TRIGGER set_hostels_updated_at
  BEFORE UPDATE ON public.hostels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. ROOMS TABLE
-- Represents individual rooms in a hostel.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  floor TEXT,
  room_type TEXT NOT NULL DEFAULT 'Double Sharing',
  capacity INTEGER NOT NULL DEFAULT 2,
  occupied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Partially Occupied', 'Full', 'Maintenance')),
  amenities TEXT[] DEFAULT ARRAY['Wi-Fi', 'Attached Bath']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT unique_hostel_room UNIQUE (hostel_id, room_number)
);

COMMENT ON TABLE public.rooms IS 'Hostel rooms, capacities, and occupant statuses.';

DROP TRIGGER IF EXISTS set_rooms_updated_at ON public.rooms;
CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. PROFILES TABLE
-- Extends Supabase auth.users with hostel-specific details and roommate preferences.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'warden', 'admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  student_id TEXT UNIQUE,                     -- e.g. STU-2024-001 (college roll/reg number)
  department TEXT,                            -- e.g. Information Technology
  year TEXT,                                  -- e.g. 2nd Year, 3rd Year
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  bed TEXT,                                   -- e.g. Bed A, Bed B
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Alumni')),
  emergency_contact TEXT,
  address TEXT,
  designation TEXT,                           -- For Staff/Warden/Admin
  cabin TEXT,                                 -- For Warden
  reference_face_photo_path TEXT,             -- Private Storage path for reference biometric face photo
  attendance_rate NUMERIC DEFAULT 100,
  pending_fees NUMERIC DEFAULT 0,

  -- Roommate Compatibility Preferences
  sleep_time TEXT DEFAULT 'Early' CHECK (sleep_time IN ('Early', 'Late', 'Flexible')),
  study_time TEXT DEFAULT 'Morning' CHECK (study_time IN ('Morning', 'Evening', 'Night', 'Flexible')),
  cleanliness TEXT DEFAULT 'Medium' CHECK (cleanliness IN ('Low', 'Medium', 'High')),
  food_preference TEXT DEFAULT 'Vegetarian' CHECK (food_preference IN ('Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Any')),
  light_preference TEXT DEFAULT 'Bright' CHECK (light_preference IN ('Bright', 'Dim', 'Any')),
  roommate_status TEXT DEFAULT 'Looking' CHECK (roommate_status IN ('Looking', 'Assigned', 'Not Interested')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Upgrade safety: Ensure columns exist if table was created in an earlier migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reference_face_photo_path TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attendance_rate NUMERIC DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_fees NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleep_time TEXT DEFAULT 'Early';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_time TEXT DEFAULT 'Morning';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleanliness TEXT DEFAULT 'Medium';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS food_preference TEXT DEFAULT 'Vegetarian';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS light_preference TEXT DEFAULT 'Bright';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roommate_status TEXT DEFAULT 'Looking';

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with student, warden, and admin information.';

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ATTENDANCE RECORDS TABLE
-- Official attendance marked daily per student.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
  room_number TEXT,
  date DATE NOT NULL DEFAULT pg_catalog.current_date,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'On Leave')),
  marked_by TEXT NOT NULL DEFAULT 'SYSTEM_VERIFIED' CHECK (marked_by IN ('SYSTEM_VERIFIED', 'WARDEN_MANUAL', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT unique_student_attendance_per_day UNIQUE (student_id, date)
);

COMMENT ON TABLE public.attendance_records IS 'Daily marked official student attendance records.';

-- ----------------------------------------------------------------------------
-- 6. PRESENCE AUDIT LOGS TABLE
-- Diagnostic audit log for every biometric & geolocation verification attempt.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.presence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location_accuracy NUMERIC,
  distance_from_hostel NUMERIC,
  face_match_status TEXT CHECK (face_match_status IN ('VERIFIED', 'FAILED', 'NO_REFERENCE', 'SERVICE_NOT_CONFIGURED')),
  location_status TEXT CHECK (location_status IN ('INSIDE', 'OUTSIDE', 'ACCURACY_POOR', 'FAILED')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('PRESENT', 'REJECTED')),
  failure_reason TEXT,
  similarity_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.presence_records IS 'Immutable biometric and geofencing audit log for attendance attempts.';

-- ----------------------------------------------------------------------------
-- 7. COMPLAINTS TABLE
-- Maintenance, electrical, plumbing, mess, and facility requests.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_code TEXT UNIQUE,                 -- e.g. CMP-2026-081
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
  room_number TEXT,
  category TEXT NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'Internet', 'Food', 'Cleaning', 'Room', 'Other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Rejected')),
  date DATE NOT NULL DEFAULT pg_catalog.current_date,
  resolved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.complaints IS 'Student maintenance and facility complaints.';

DROP TRIGGER IF EXISTS set_complaints_updated_at ON public.complaints;
CREATE TRIGGER set_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. LEAVE REQUESTS TABLE
-- Formal out-of-hostel leave applications reviewed by Wardens.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_code TEXT UNIQUE,                     -- e.g. LEV-501
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  applied_at DATE NOT NULL DEFAULT pg_catalog.current_date,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT check_leave_dates CHECK (to_date >= from_date)
);

COMMENT ON TABLE public.leave_requests IS 'Student leave and gate pass applications.';

DROP TRIGGER IF EXISTS set_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER set_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 9. NOTICES & ANNOUNCEMENTS TABLE
-- Notice board broadcast by Wardens and Admins.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_code TEXT UNIQUE,                    -- e.g. NOT-101
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Maintenance', 'Discipline', 'Events', 'IT Services', 'General')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  posted_by TEXT NOT NULL,                    -- Display author name
  posted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT pg_catalog.current_date,
  target_role TEXT NOT NULL DEFAULT 'All' CHECK (target_role IN ('All', 'Students', 'Wardens')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.notices IS 'Official hostel announcements and notices.';

DROP TRIGGER IF EXISTS set_notices_updated_at ON public.notices;
CREATE TRIGGER set_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. VISITORS TABLE
-- Guest and visitor registry entries.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_code TEXT UNIQUE,                   -- e.g. VIS-901
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  visit_date DATE NOT NULL DEFAULT pg_catalog.current_date,
  visit_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Expected' CHECK (status IN ('Expected', 'Checked In', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.visitors IS 'Guest and visitor log entries registered by students.';

DROP TRIGGER IF EXISTS set_visitors_updated_at ON public.visitors;
CREATE TRIGGER set_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 11. FEE RECORDS TABLE
-- Fee breakdowns and payment tracking per student.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                        -- e.g. Hostel Accommodation, Mess Charges
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  receipt_no TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON TABLE public.fee_records IS 'Student accommodation and mess fee records.';

DROP TRIGGER IF EXISTS set_fee_records_updated_at ON public.fee_records;
CREATE TRIGGER set_fee_records_updated_at
  BEFORE UPDATE ON public.fee_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 12. ROOMMATE ASSIGNMENTS TABLE
-- History of roommate pairings made by Wardens.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roommate_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Dissolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT check_different_students CHECK (student_a_id <> student_b_id)
);

COMMENT ON TABLE public.roommate_assignments IS 'Warden-facilitated student roommate pairings.';

-- ----------------------------------------------------------------------------
-- 13. INDEXES FOR PERFORMANCE (IDEMPOTENT)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_hostel ON public.profiles(hostel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_roommate_status ON public.profiles(roommate_status);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON public.rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_hostel ON public.attendance_records(hostel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_presence_student_time ON public.presence_records(student_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_hostel ON public.complaints(hostel_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON public.leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_visitors_student ON public.visitors(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON public.fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_roommate_assignments_a ON public.roommate_assignments(student_a_id);
CREATE INDEX IF NOT EXISTS idx_roommate_assignments_b ON public.roommate_assignments(student_b_id);

-- ============================================================================
-- 14. HARDENED SECURITY FUNCTIONS (SEARCH_PATH = '', NON-RECURSIVE)
-- ============================================================================

-- Helper: Retrieve current caller's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: Retrieve current caller's assigned hostel ID
CREATE OR REPLACE FUNCTION public.current_user_hostel_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT hostel_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: System Administrator check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'Active'
  );
$$;

-- Helper: Any Active Warden check
CREATE OR REPLACE FUNCTION public.is_warden()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'warden' AND status = 'Active'
  );
$$;

-- Helper: Warden for specific hostel block check
CREATE OR REPLACE FUNCTION public.is_warden_for_hostel(p_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'warden' 
      AND status = 'Active'
      AND hostel_id IS NOT NULL 
      AND hostel_id = p_hostel_id
  );
$$;

-- Helper: Staff authorized for specific hostel block (Admin or Hostel Warden)
CREATE OR REPLACE FUNCTION public.is_staff_for_hostel(p_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (public.is_admin() OR public.is_warden_for_hostel(p_hostel_id));
$$;

-- Helper: Generic staff check (Admin or Any active Warden)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (public.is_admin() OR public.is_warden());
$$;

-- Restrict execution permissions on role lookup helpers
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_user_hostel_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_hostel_id() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_warden() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_warden() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_warden_for_hostel(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_warden_for_hostel(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_staff_for_hostel(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_for_hostel(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 15. PROFILE SECURITY TRIGGERS (ROLE ESCALATION & FIELD TAMPERING GUARDS)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_profile_update_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role TEXT;
  v_is_admin BOOLEAN;
  v_is_warden BOOLEAN;
  v_caller_hostel UUID;
  v_is_db_admin BOOLEAN;
BEGIN
  -- Detect direct database superuser sessions (e.g. Supabase SQL Editor where auth.uid() is NULL)
  v_is_db_admin := (pg_catalog.current_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL);
  v_caller_role := public.current_user_role();
  v_is_admin := (v_caller_role = 'admin' OR v_is_db_admin);
  v_is_warden := (v_caller_role = 'warden' AND NOT v_is_admin);
  v_caller_hostel := public.current_user_hostel_id();

  -- 1. ROLE CHANGE SECURITY:
  -- Only confirmed Administrators can alter user roles.
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Security Violation: Only system administrators can modify user roles.';
    END IF;

    -- Prevent lockout: Cannot demote the last remaining active admin
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      IF (SELECT pg_catalog.count(*) FROM public.profiles WHERE role = 'admin' AND status = 'Active' AND id <> OLD.id) < 1 THEN
        RAISE EXCEPTION 'Operation blocked: Cannot demote the last remaining active system administrator.';
      END IF;
    END IF;
  END IF;

  -- 2. STUDENT CALLER RESTRICTIONS:
  -- If caller is a student, block modifications to all institutional,
  -- administrative, financial, and biometric fields.
  IF NOT (v_is_admin OR v_is_warden) THEN
    IF OLD.id IS DISTINCT FROM NEW.id THEN
      RAISE EXCEPTION 'Security Violation: User ID is immutable.';
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
      RAISE EXCEPTION 'Security Violation: Email must be updated via Supabase Auth identity verification.';
    END IF;

    IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify student ID or college registration roll number.';
    END IF;

    IF OLD.hostel_id IS DISTINCT FROM NEW.hostel_id THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify hostel assignment.';
    END IF;

    IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify room assignment.';
    END IF;

    IF OLD.bed IS DISTINCT FROM NEW.bed THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify bed assignment.';
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      RAISE EXCEPTION 'Security Violation: Students cannot alter account status.';
    END IF;

    IF OLD.attendance_rate IS DISTINCT FROM NEW.attendance_rate THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify attendance rates.';
    END IF;

    IF OLD.pending_fees IS DISTINCT FROM NEW.pending_fees THEN
      RAISE EXCEPTION 'Security Violation: Students cannot modify pending fee records.';
    END IF;

    IF OLD.reference_face_photo_path IS DISTINCT FROM NEW.reference_face_photo_path THEN
      RAISE EXCEPTION 'Security Violation: Reference biometric face photo path can only be enrolled by authorized staff.';
    END IF;

    IF OLD.designation IS DISTINCT FROM NEW.designation OR OLD.cabin IS DISTINCT FROM NEW.cabin THEN
      RAISE EXCEPTION 'Security Violation: Staff designation and office cabin are restricted fields.';
    END IF;

    IF OLD.department IS DISTINCT FROM NEW.department OR OLD.year IS DISTINCT FROM NEW.year THEN
      RAISE EXCEPTION 'Security Violation: Academic department and year can only be changed by administration.';
    END IF;
  END IF;

  -- 3. WARDEN CALLER RESTRICTIONS:
  IF v_is_warden AND NOT v_is_admin THEN
    -- Wardens cannot alter their own institutional fields (hostel, status, role)
    IF OLD.id = auth.uid() THEN
      IF OLD.role IS DISTINCT FROM NEW.role 
         OR OLD.hostel_id IS DISTINCT FROM NEW.hostel_id 
         OR OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE EXCEPTION 'Security Violation: Wardens cannot modify their own staff role, hostel assignment, or account status.';
      END IF;
    END IF;

    -- Wardens cannot modify other staff profiles
    IF OLD.role IN ('admin', 'warden') AND OLD.id <> auth.uid() THEN
      RAISE EXCEPTION 'Security Violation: Wardens cannot modify other staff profiles.';
    END IF;

    -- Wardens can only modify student profiles within their assigned hostel block
    IF OLD.role = 'student' AND (OLD.hostel_id IS DISTINCT FROM v_caller_hostel OR v_caller_hostel IS NULL) THEN
      RAISE EXCEPTION 'Security Violation: Wardens can only manage student profiles within their assigned hostel.';
    END IF;

    -- Wardens cannot transfer students across hostels
    IF OLD.role = 'student' AND NEW.hostel_id IS DISTINCT FROM OLD.hostel_id THEN
      RAISE EXCEPTION 'Security Violation: Hostel transfers must be approved by Administration.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_update_security_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_update_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_security();

-- Protect profile insertions against client-forged roles or privileged fields
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If not executed by Admin or system service, enforce safe student defaults
  IF NOT (public.is_admin() OR (pg_catalog.current_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL)) THEN
    NEW.role := 'student';
    NEW.status := 'Active';
    NEW.attendance_rate := 100;
    NEW.pending_fees := 0;
    NEW.reference_face_photo_path := NULL;
    NEW.hostel_id := NULL;
    NEW.room_id := NULL;
    NEW.bed := NULL;
    NEW.designation := NULL;
    NEW.cabin := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_insert_security_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_insert_security_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_insert_security();

-- Automatic profile creation on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    pg_catalog.coalesce(NEW.raw_user_meta_data->>'name', pg_catalog.split_part(NEW.email, '@', 1)),
    'student', -- ALWAYS defaults to student on public signup
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 16. VALIDATED STUDENT PROFILE UPDATE RPC
-- ----------------------------------------------------------------------------
-- Provides an explicit, safe RPC for students to update only their permitted
-- personal contact and roommate-preference fields.
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_phone TEXT DEFAULT NULL,
  p_emergency_contact TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_sleep_time TEXT DEFAULT NULL,
  p_study_time TEXT DEFAULT NULL,
  p_cleanliness TEXT DEFAULT NULL,
  p_food_preference TEXT DEFAULT NULL,
  p_light_preference TEXT DEFAULT NULL,
  p_roommate_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Validate choice enums if provided
  IF p_sleep_time IS NOT NULL AND p_sleep_time NOT IN ('Early', 'Late', 'Flexible') THEN
    RAISE EXCEPTION 'Invalid sleep_time value.';
  END IF;
  IF p_study_time IS NOT NULL AND p_study_time NOT IN ('Morning', 'Evening', 'Night', 'Flexible') THEN
    RAISE EXCEPTION 'Invalid study_time value.';
  END IF;
  IF p_cleanliness IS NOT NULL AND p_cleanliness NOT IN ('Low', 'Medium', 'High') THEN
    RAISE EXCEPTION 'Invalid cleanliness value.';
  END IF;
  IF p_food_preference IS NOT NULL AND p_food_preference NOT IN ('Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Any') THEN
    RAISE EXCEPTION 'Invalid food_preference value.';
  END IF;
  IF p_light_preference IS NOT NULL AND p_light_preference NOT IN ('Bright', 'Dim', 'Any') THEN
    RAISE EXCEPTION 'Invalid light_preference value.';
  END IF;
  IF p_roommate_status IS NOT NULL AND p_roommate_status NOT IN ('Looking', 'Assigned', 'Not Interested') THEN
    RAISE EXCEPTION 'Invalid roommate_status value.';
  END IF;

  UPDATE public.profiles
  SET
    phone = pg_catalog.coalesce(p_phone, phone),
    emergency_contact = pg_catalog.coalesce(p_emergency_contact, emergency_contact),
    address = pg_catalog.coalesce(p_address, address),
    sleep_time = pg_catalog.coalesce(p_sleep_time, sleep_time),
    study_time = pg_catalog.coalesce(p_study_time, study_time),
    cleanliness = pg_catalog.coalesce(p_cleanliness, cleanliness),
    food_preference = pg_catalog.coalesce(p_food_preference, food_preference),
    light_preference = pg_catalog.coalesce(p_light_preference, light_preference),
    roommate_status = pg_catalog.coalesce(p_roommate_status, roommate_status),
    updated_at = pg_catalog.now()
  WHERE id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'message', 'Profile preferences updated successfully.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 17. PRIVACY-PRESERVING ROOMMATE DISCOVERY RPC
-- ----------------------------------------------------------------------------
-- Drop obsolete or unsafe security views if previously created
DROP VIEW IF EXISTS public.available_roommates CASCADE;

-- Authorized RPC function for roommate discovery:
-- 1. Verifies caller authentication.
-- 2. Inspects caller's assigned hostel.
-- 3. Returns ONLY students in the EXACT same hostel who have roommate_status = 'Looking'.
-- 4. Exposes ONLY safe compatibility preferences:
--    id, name, department, year, hostel_id, sleep_time, study_time, cleanliness,
--    food_preference, light_preference, roommate_status.
-- 5. NEVER leaks phone, email, address, emergency contact, pending fees,
--    attendance rate, reference face photo path, or student ID.
CREATE OR REPLACE FUNCTION public.get_compatible_roommates()
RETURNS TABLE (
  id UUID,
  name TEXT,
  department TEXT,
  year TEXT,
  hostel_id UUID,
  sleep_time TEXT,
  study_time TEXT,
  cleanliness TEXT,
  food_preference TEXT,
  light_preference TEXT,
  roommate_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_hostel_id UUID;
BEGIN
  -- Verify authenticated session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to search for compatible roommates.';
  END IF;

  -- Lookup caller's hostel assignment
  SELECT p.hostel_id INTO v_caller_hostel_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- If student has no hostel assigned yet, they cannot discover roommates within a hostel
  IF v_caller_hostel_id IS NULL THEN
    RETURN;
  END IF;

  -- Return matching candidates strictly within the caller's hostel
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.department,
    p.year,
    p.hostel_id,
    p.sleep_time,
    p.study_time,
    p.cleanliness,
    p.food_preference,
    p.light_preference,
    p.roommate_status
  FROM public.profiles p
  WHERE p.hostel_id = v_caller_hostel_id
    AND p.roommate_status = 'Looking'
    AND p.id <> auth.uid()
    AND p.role = 'student'
    AND p.status = 'Active';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_compatible_roommates() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_compatible_roommates() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 18. SECURE SERVER-SIDE ATTENDANCE RECORDING FUNCTION
-- ----------------------------------------------------------------------------
-- This function is executed strictly by the server-side verification runtime
-- (Supabase Edge Function using service_role credentials).
-- Direct client execution is completely revoked and blocked by caller checks.
--
-- Security rules:
-- 1. Caller MUST be service_role or database superuser.
-- 2. Requires student to have an assigned hostel with geofence parameters.
--    ZERO fallback to an arbitrary first hostel.
-- 3. Performs independent Haversine distance calculation in PostgreSQL.
-- 4. Checks GPS accuracy <= hostel max_accuracy AND distance <= hostel radius.
-- 5. Handles duplicate submissions atomically (idempotent per student/day).
-- 6. Logs all attempts into immutable presence_records audit trail.
CREATE OR REPLACE FUNCTION public.record_system_verified_attendance(
  p_student_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_location_accuracy NUMERIC,
  p_face_verified BOOLEAN,
  p_similarity_score NUMERIC,
  p_face_match_status TEXT,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student RECORD;
  v_hostel RECORD;
  v_distance NUMERIC;
  v_location_status TEXT;
  v_verification_status TEXT;
  v_fail_msg TEXT := p_failure_reason;
  v_today DATE := pg_catalog.current_date;
  v_existing_attendance RECORD;
  v_presence_id UUID;
  v_attendance_id UUID := NULL;
  v_is_duplicate BOOLEAN := FALSE;
  v_face_check_passed BOOLEAN := FALSE;
BEGIN
  -- 1. Caller Identity Verification
  -- Must only be invoked by database superuser or Supabase service_role process
  IF pg_catalog.current_user NOT IN ('postgres', 'supabase_admin', 'service_role') 
     AND pg_catalog.coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Access Denied: record_system_verified_attendance may only be executed by trusted server runtime (service_role).';
  END IF;

  -- 2. Retrieve student record and assigned hostel
  SELECT id, name, role, hostel_id, room_id, status, reference_face_photo_path
  INTO v_student
  FROM public.profiles
  WHERE id = p_student_id;

  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'Student record not found for ID: %', p_student_id;
  END IF;

  IF v_student.role <> 'student' THEN
    RAISE EXCEPTION 'Attendance rejected: Target user % is not a registered student (role: %).', p_student_id, v_student.role;
  END IF;

  IF v_student.status <> 'Active' THEN
    RAISE EXCEPTION 'Attendance rejected: Student account is %', v_student.status;
  END IF;

  -- 3. Validate reference face existence
  IF v_student.reference_face_photo_path IS NULL THEN
    v_verification_status := 'REJECTED';
    v_fail_msg := pg_catalog.coalesce(v_fail_msg, 'No reference face registered by Warden.');
  END IF;

  -- 4. Retrieve assigned hostel geofence parameters (NO FALLBACK TO ARBITRARY HOSTEL)
  IF v_student.hostel_id IS NULL THEN
    v_verification_status := 'REJECTED';
    v_fail_msg := pg_catalog.coalesce(v_fail_msg, 'Student is not assigned to any hostel building.');
  ELSE
    SELECT latitude, longitude, radius, max_accuracy
    INTO v_hostel
    FROM public.hostels
    WHERE id = v_student.hostel_id;

    IF v_hostel.latitude IS NULL OR v_hostel.longitude IS NULL OR v_hostel.radius IS NULL OR v_hostel.max_accuracy IS NULL THEN
      v_verification_status := 'REJECTED';
      v_fail_msg := pg_catalog.coalesce(v_fail_msg, 'Assigned hostel geofence configuration is missing or incomplete.');
    END IF;
  END IF;

  -- 5. Independent Server-Side Geofence Evaluation
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL 
     AND p_latitude >= -90.0 AND p_latitude <= 90.0 
     AND p_longitude >= -180.0 AND p_longitude <= 180.0 
     AND v_hostel.latitude IS NOT NULL AND v_hostel.longitude IS NOT NULL THEN
    v_distance := public.calculate_haversine_distance_m(
      p_latitude,
      p_longitude,
      v_hostel.latitude,
      v_hostel.longitude
    );

    IF p_location_accuracy IS NULL OR p_location_accuracy <= 0 OR p_location_accuracy > v_hostel.max_accuracy THEN
      v_location_status := 'ACCURACY_POOR';
      IF v_fail_msg IS NULL THEN
        v_fail_msg := pg_catalog.format('GPS accuracy (%s m) is worse than maximum allowed threshold (%s m).', p_location_accuracy, v_hostel.max_accuracy);
      END IF;
    ELSIF v_distance > v_hostel.radius THEN
      v_location_status := 'OUTSIDE';
      IF v_fail_msg IS NULL THEN
        v_fail_msg := pg_catalog.format('Location is outside hostel geofence (%s m away, radius is %s m).', v_distance, v_hostel.radius);
      END IF;
    ELSE
      v_location_status := 'INSIDE';
    END IF;
  ELSE
    v_location_status := 'FAILED';
    IF v_fail_msg IS NULL THEN
      v_fail_msg := 'Invalid GPS coordinates or missing hostel geofence configuration.';
    END IF;
  END IF;

  -- 6. Biometric Facial Verification Validation (Defense-in-Depth)
  -- The database function independently requires:
  -- - p_face_verified = TRUE
  -- - p_face_match_status = 'VERIFIED'
  -- - p_similarity_score >= 0.60 AND <= 1.00
  IF p_face_verified = TRUE 
     AND p_face_match_status = 'VERIFIED'
     AND p_similarity_score IS NOT NULL 
     AND p_similarity_score >= 0.60 
     AND p_similarity_score <= 1.00 THEN
    v_face_check_passed := TRUE;
  ELSE
    v_face_check_passed := FALSE;
    IF v_fail_msg IS NULL THEN
      IF p_face_match_status <> 'VERIFIED' OR p_face_verified <> TRUE THEN
        v_fail_msg := 'Biometric facial match verification failed.';
      ELSIF p_similarity_score IS NULL OR p_similarity_score < 0.60 THEN
        v_fail_msg := pg_catalog.format('Face similarity score (%s) is below required verification threshold (0.60).', p_similarity_score);
      ELSE
        v_fail_msg := 'Biometric facial match verification failed.';
      END IF;
    END IF;
  END IF;

  -- 7. Overall Verification Decision
  IF v_face_check_passed = TRUE 
     AND v_location_status = 'INSIDE' 
     AND v_student.reference_face_photo_path IS NOT NULL 
     AND v_student.hostel_id IS NOT NULL THEN
    v_verification_status := 'PRESENT';
    v_fail_msg := NULL;
  ELSE
    v_verification_status := 'REJECTED';
    IF v_fail_msg IS NULL THEN
      IF v_face_check_passed <> TRUE THEN
        v_fail_msg := 'Biometric facial match verification failed.';
      ELSE
        v_fail_msg := 'Location verification failed.';
      END IF;
    END IF;
  END IF;

  -- 7. Atomic Attendance Record Update (Idempotent for current date)
  IF v_verification_status = 'PRESENT' THEN
    SELECT id, status, marked_by
    INTO v_existing_attendance
    FROM public.attendance_records
    WHERE student_id = p_student_id AND date = v_today;

    IF v_existing_attendance.id IS NOT NULL THEN
      v_attendance_id := v_existing_attendance.id;
      v_is_duplicate := TRUE;
      v_fail_msg := 'Attendance already marked for today.';
    ELSE
      INSERT INTO public.attendance_records (
        student_id,
        hostel_id,
        room_number,
        date,
        status,
        marked_by,
        created_at
      ) VALUES (
        p_student_id,
        v_student.hostel_id,
        (SELECT room_number FROM public.rooms WHERE id = v_student.room_id),
        v_today,
        'Present',
        'SYSTEM_VERIFIED',
        pg_catalog.now()
      )
      ON CONFLICT (student_id, date) DO NOTHING
      RETURNING id INTO v_attendance_id;

      -- Handle concurrent race condition fallback
      IF v_attendance_id IS NULL THEN
        SELECT id INTO v_attendance_id
        FROM public.attendance_records
        WHERE student_id = p_student_id AND date = v_today;
        v_is_duplicate := TRUE;
      END IF;
    END IF;
  END IF;

  -- 8. Insert Diagnostic Audit Record into presence_records
  INSERT INTO public.presence_records (
    student_id,
    timestamp,
    latitude,
    longitude,
    location_accuracy,
    distance_from_hostel,
    face_match_status,
    location_status,
    verification_status,
    failure_reason,
    similarity_score,
    created_at
  ) VALUES (
    p_student_id,
    pg_catalog.now(),
    p_latitude,
    p_longitude,
    p_location_accuracy,
    v_distance,
    p_face_match_status,
    v_location_status,
    v_verification_status,
    CASE WHEN v_is_duplicate THEN 'Duplicate submission for today' ELSE v_fail_msg END,
    p_similarity_score,
    pg_catalog.now()
  )
  RETURNING id INTO v_presence_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', (v_verification_status = 'PRESENT'),
    'verified', (v_verification_status = 'PRESENT'),
    'duplicate', v_is_duplicate,
    'verification_status', v_verification_status,
    'presence_record_id', v_presence_id,
    'attendance_record_id', v_attendance_id,
    'distance', v_distance,
    'location_status', v_location_status,
    'face_match_status', p_face_match_status,
    'message', CASE 
      WHEN v_is_duplicate THEN 'Attendance was already marked for today.'
      WHEN v_verification_status = 'PRESENT' THEN 'Attendance marked successfully.'
      ELSE v_fail_msg
    END
  );
END;
$$;

-- Restrict execution: Revoke from public, anon, authenticated; grant strictly to service_role and postgres
REVOKE EXECUTE ON FUNCTION public.record_system_verified_attendance(UUID, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_system_verified_attendance(UUID, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, NUMERIC, TEXT, TEXT) TO service_role, postgres;

-- ----------------------------------------------------------------------------
-- 19. WORKFLOW INTEGRITY TRIGGERS (LEAVE, COMPLAINTS, VISITORS)
-- ----------------------------------------------------------------------------

-- Leave Requests State & Ownership Enforcement Trigger
CREATE OR REPLACE FUNCTION public.enforce_leave_request_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_warden BOOLEAN;
  v_student_hostel UUID;
  v_caller_hostel UUID;
BEGIN
  v_is_admin := public.is_admin();
  v_is_warden := public.is_warden();
  v_caller_hostel := public.current_user_hostel_id();

  IF TG_OP = 'INSERT' THEN
    IF NOT (v_is_admin OR v_is_warden) THEN
      -- Students can only submit requests for themselves, defaulting to Pending
      NEW.student_id := auth.uid();
      NEW.status := 'Pending';
      NEW.reviewed_by := NULL;
      NEW.remarks := NULL;
      NEW.applied_at := pg_catalog.current_date;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Student ID / ownership is immutable
    IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
      RAISE EXCEPTION 'Security Violation: Cannot transfer leave request to another student.';
    END IF;

    IF NOT (v_is_admin OR v_is_warden) THEN
      -- Student can ONLY cancel a Pending request
      IF OLD.status <> 'Pending' THEN
        RAISE EXCEPTION 'Security Violation: Only pending leave requests can be cancelled.';
      END IF;

      IF NEW.status <> 'Cancelled' THEN
        RAISE EXCEPTION 'Security Violation: Students are only permitted to cancel pending requests.';
      END IF;

      -- Preserve application dates and reviewer fields
      NEW.from_date := OLD.from_date;
      NEW.to_date := OLD.to_date;
      NEW.reason := OLD.reason;
      NEW.emergency_contact := OLD.emergency_contact;
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.remarks := OLD.remarks;
    ELSE
      -- Staff review: Prevent staff approving their own leave request
      IF OLD.student_id = auth.uid() THEN
        RAISE EXCEPTION 'Security Violation: Staff members cannot approve their own leave applications.';
      END IF;

      -- Warden scope: Warden can only review leave for students in their assigned hostel
      IF v_is_warden AND NOT v_is_admin THEN
        SELECT hostel_id INTO v_student_hostel FROM public.profiles WHERE id = OLD.student_id;
        IF v_student_hostel IS DISTINCT FROM v_caller_hostel OR v_caller_hostel IS NULL THEN
          RAISE EXCEPTION 'Security Violation: Wardens can only review leave requests for students in their assigned hostel.';
        END IF;
      END IF;

      -- Stamp reviewer when approving or rejecting
      IF NEW.status IN ('Approved', 'Rejected') AND OLD.status = 'Pending' THEN
        NEW.reviewed_by := auth.uid();
      END IF;

      -- Staff cannot alter student's original application dates or reason
      NEW.from_date := OLD.from_date;
      NEW.to_date := OLD.to_date;
      NEW.reason := OLD.reason;
      NEW.emergency_contact := OLD.emergency_contact;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_leave_request_security_trigger ON public.leave_requests;
CREATE TRIGGER enforce_leave_request_security_trigger
  BEFORE INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_leave_request_security();

-- Visitors State & Ownership Enforcement Trigger
CREATE OR REPLACE FUNCTION public.enforce_visitor_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_warden BOOLEAN;
  v_student_hostel UUID;
  v_caller_hostel UUID;
BEGIN
  v_is_admin := public.is_admin();
  v_is_warden := public.is_warden();
  v_caller_hostel := public.current_user_hostel_id();

  IF TG_OP = 'INSERT' THEN
    IF NOT (v_is_admin OR v_is_warden) THEN
      NEW.student_id := auth.uid();
      NEW.status := 'Expected';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
      RAISE EXCEPTION 'Security Violation: Cannot transfer visitor record to another student.';
    END IF;

    IF NOT (v_is_admin OR v_is_warden) THEN
      IF OLD.status <> 'Expected' THEN
        RAISE EXCEPTION 'Security Violation: Only expected visitors can be modified or cancelled by students.';
      END IF;

      IF NEW.status NOT IN ('Expected', 'Cancelled') THEN
        RAISE EXCEPTION 'Security Violation: Only hostel staff can check in or complete visitor logs.';
      END IF;
    ELSE
      -- Warden scope: Warden can only check in visitors for their assigned hostel
      IF v_is_warden AND NOT v_is_admin THEN
        SELECT hostel_id INTO v_student_hostel FROM public.profiles WHERE id = OLD.student_id;
        IF v_student_hostel IS DISTINCT FROM v_caller_hostel OR v_caller_hostel IS NULL THEN
          RAISE EXCEPTION 'Security Violation: Wardens can only manage visitors for students in their assigned hostel.';
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_visitor_security_trigger ON public.visitors;
CREATE TRIGGER enforce_visitor_security_trigger
  BEFORE INSERT OR UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.enforce_visitor_security();

-- Complaints Workflow & Ownership Enforcement Trigger
CREATE OR REPLACE FUNCTION public.enforce_complaint_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_warden BOOLEAN;
  v_caller_hostel UUID;
BEGIN
  v_is_admin := public.is_admin();
  v_is_warden := public.is_warden();
  v_caller_hostel := public.current_user_hostel_id();

  IF TG_OP = 'INSERT' THEN
    IF NOT (v_is_admin OR v_is_warden) THEN
      NEW.student_id := auth.uid();
      NEW.status := 'Pending';
      NEW.resolved_date := NULL;
      NEW.notes := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
      RAISE EXCEPTION 'Security Violation: Cannot transfer complaint to another student.';
    END IF;

    IF NOT (v_is_admin OR v_is_warden) THEN
      IF OLD.status <> 'Pending' THEN
        RAISE EXCEPTION 'Security Violation: Only pending complaints can be modified by students.';
      END IF;

      -- Students cannot resolve complaints or add administrative notes
      NEW.status := 'Pending';
      NEW.resolved_date := NULL;
      NEW.notes := OLD.notes;
    ELSE
      -- Warden scope: Warden can only resolve complaints in their assigned hostel
      IF v_is_warden AND NOT v_is_admin THEN
        IF OLD.hostel_id IS DISTINCT FROM v_caller_hostel OR v_caller_hostel IS NULL THEN
          RAISE EXCEPTION 'Security Violation: Wardens can only manage complaints within their assigned hostel.';
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_complaint_security_trigger ON public.complaints;
CREATE TRIGGER enforce_complaint_security_trigger
  BEFORE INSERT OR UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.enforce_complaint_security();

-- ----------------------------------------------------------------------------
-- 20. FIRST ADMIN BOOTSTRAP & SECURE ROLE PROVISIONING
-- ----------------------------------------------------------------------------

-- Safe First Admin Bootstrap Function:
-- Solves the chicken-and-egg problem where auth.uid() is NULL in SQL Editor sessions
-- while strictly preventing public users from self-promoting.
-- Can ONLY be called by postgres (SQL Editor) or service_role, and PERMANENTLY
-- disables itself once at least one active administrator exists.
CREATE OR REPLACE FUNCTION public.bootstrap_initial_admin(admin_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_count INTEGER;
  v_target_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- 1. Caller verification: Only database superuser (postgres, supabase_admin) or service_role
  IF pg_catalog.current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'Access Denied: bootstrap_initial_admin can only be executed by database superuser or service_role.';
  END IF;

  v_normalized_email := pg_catalog.lower(pg_catalog.trim(admin_email));

  -- 2. Guard: Ensure NO active administrator currently exists
  SELECT pg_catalog.count(*) INTO v_admin_count
  FROM public.profiles
  WHERE role = 'admin' AND status = 'Active';

  IF v_admin_count > 0 THEN
    RAISE EXCEPTION 'Bootstrap Disabled: System already has % active administrator(s). Use admin_set_user_role instead.', v_admin_count;
  END IF;

  -- 3. Lookup user in profiles
  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE pg_catalog.lower(email) = v_normalized_email;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'Bootstrap Failed: User with email % not found in profiles. Please register the account in Supabase Auth first.', admin_email;
  END IF;

  -- 4. Promote target user to admin
  UPDATE public.profiles
  SET 
    role = 'admin',
    designation = 'Chief System Administrator',
    status = 'Active',
    updated_at = pg_catalog.now()
  WHERE id = v_target_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'message', pg_catalog.format('User %s successfully bootstrapped as initial System Administrator.', v_normalized_email),
    'user_id', v_target_id,
    'role', 'admin'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_initial_admin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_admin(TEXT) TO postgres, service_role;

-- Authorized Administrative RPC to Provision Wardens and Subsequent Admins
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_designation TEXT DEFAULT NULL,
  new_hostel_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 1. Security Check: Only confirmed Admins can execute
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only system administrators can assign user roles.';
  END IF;

  -- 2. Validate role
  IF new_role NOT IN ('student', 'warden', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified (%). Must be student, warden, or admin.', new_role;
  END IF;

  -- 3. Prevent self-lockout: Admin cannot demote themselves if they are the last active admin
  IF target_user_id = auth.uid() AND new_role <> 'admin' THEN
    IF (SELECT pg_catalog.count(*) FROM public.profiles WHERE role = 'admin' AND status = 'Active') <= 1 THEN
      RAISE EXCEPTION 'Operation blocked: Cannot demote the last remaining active system administrator.';
    END IF;
  END IF;

  -- 4. Apply role update
  UPDATE public.profiles
  SET 
    role = new_role,
    designation = pg_catalog.coalesce(new_designation, designation),
    hostel_id = pg_catalog.coalesce(new_hostel_id, hostel_id),
    updated_at = pg_catalog.now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found for ID: %', target_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT, UUID) TO authenticated, service_role;

-- ============================================================================
-- 21. ROW LEVEL SECURITY (RLS) POLICIES ON ALL 11 TABLES (HOSTEL SCOPED)
-- ============================================================================

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_assignments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS POLICIES: HOSTELS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Hostels are viewable by authenticated users" ON public.hostels;
CREATE POLICY "Hostels are viewable by authenticated users"
  ON public.hostels FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage hostels" ON public.hostels;
CREATE POLICY "Admins can manage hostels"
  ON public.hostels FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: ROOMS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Rooms are viewable by authenticated users" ON public.rooms;
CREATE POLICY "Rooms are viewable by authenticated users"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Hostel staff can manage rooms" ON public.rooms;
CREATE POLICY "Hostel staff can manage rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (
    public.is_admin() 
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  )
  WITH CHECK (
    public.is_admin() 
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: PROFILES (WARDEN HOSTEL SCOPED & STRICT PRIVACY)
-- ----------------------------------------------------------------------------
-- SELECT: Student sees only their own profile. Admin sees all.
-- Warden sees own profile AND students within their assigned hostel block.
-- No student cross-profile access.
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND role = 'student' 
      AND hostel_id = public.current_user_hostel_id()
    )
  );

-- INSERT: Students can insert initial profile if missing, forced to safe student values
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (role IS NULL OR role = 'student')
    AND reference_face_photo_path IS NULL
  );

-- UPDATE: Students update own row (trigger restricts to personal/roommate fields).
-- Wardens update students ONLY within their assigned hostel block.
-- Admins update system-wide.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND role = 'student' 
      AND hostel_id = public.current_user_hostel_id()
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND role = 'student' 
      AND hostel_id = public.current_user_hostel_id()
    )
  );

-- DELETE: Only Admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: ATTENDANCE RECORDS (WARDEN HOSTEL SCOPED & INTEGRITY HARDENED)
-- ----------------------------------------------------------------------------
-- SELECT: Students view own attendance. Admin views all.
-- Wardens view attendance ONLY for their assigned hostel block.
DROP POLICY IF EXISTS "Attendance select policy" ON public.attendance_records;
CREATE POLICY "Attendance select policy"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

-- INSERT: Direct student INSERT is REVOKED.
-- Only Admin or Hostel Warden (for their assigned hostel) can manually insert.
-- Official attendance is marked via the server-side verification runtime (service_role).
DROP POLICY IF EXISTS "Attendance insert policy" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff can insert attendance" ON public.attendance_records;
CREATE POLICY "Staff can insert attendance"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() 
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

-- UPDATE: Admin or Hostel Warden for their assigned hostel
DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance_records;
CREATE POLICY "Staff can update attendance"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() 
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  )
  WITH CHECK (
    public.is_admin() 
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

-- DELETE: Only Admins can delete records
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance_records;
CREATE POLICY "Admins can delete attendance"
  ON public.attendance_records FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: PRESENCE AUDIT RECORDS (IMMUTABLE AUDIT TRAIL, WARDEN SCOPED)
-- ----------------------------------------------------------------------------
-- SELECT: Student sees own presence log. Admin sees all.
-- Warden sees presence logs ONLY for students residing in their assigned hostel.
DROP POLICY IF EXISTS "Presence records select policy" ON public.presence_records;
CREATE POLICY "Presence records select policy"
  ON public.presence_records FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

-- INSERT: Direct student INSERT is REVOKED.
-- Inserted via server verification function or authorized staff.
DROP POLICY IF EXISTS "Presence records insert policy" ON public.presence_records;
DROP POLICY IF EXISTS "Staff can insert presence records" ON public.presence_records;
CREATE POLICY "Staff can insert presence records"
  ON public.presence_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() 
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

-- DELETE: Presence records are immutable; only Admins may purge if required
DROP POLICY IF EXISTS "Admins can delete presence records" ON public.presence_records;
CREATE POLICY "Admins can delete presence records"
  ON public.presence_records FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: COMPLAINTS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Complaints select policy" ON public.complaints;
CREATE POLICY "Complaints select policy"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

DROP POLICY IF EXISTS "Complaints insert policy" ON public.complaints;
CREATE POLICY "Complaints insert policy"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND (status IS NULL OR status = 'Pending') AND resolved_date IS NULL AND notes IS NULL)
    OR public.is_admin()
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

DROP POLICY IF EXISTS "Complaints update policy" ON public.complaints;
CREATE POLICY "Complaints update policy"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Pending')
    OR public.is_admin()
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  )
  WITH CHECK (
    (student_id = auth.uid() AND status = 'Pending')
    OR public.is_admin()
    OR (public.is_warden() AND hostel_id = public.current_user_hostel_id())
  );

DROP POLICY IF EXISTS "Complaints delete policy" ON public.complaints;
CREATE POLICY "Complaints delete policy"
  ON public.complaints FOR DELETE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Pending')
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: LEAVE REQUESTS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leave requests select policy" ON public.leave_requests;
CREATE POLICY "Leave requests select policy"
  ON public.leave_requests FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Leave requests insert policy" ON public.leave_requests;
CREATE POLICY "Leave requests insert policy"
  ON public.leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND (status IS NULL OR status = 'Pending') AND reviewed_by IS NULL AND remarks IS NULL)
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Leave requests update policy" ON public.leave_requests;
CREATE POLICY "Leave requests update policy"
  ON public.leave_requests FOR UPDATE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Pending')
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  )
  WITH CHECK (
    (student_id = auth.uid() AND status IN ('Pending', 'Cancelled'))
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can delete leave requests" ON public.leave_requests;
CREATE POLICY "Admins can delete leave requests"
  ON public.leave_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: NOTICES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notices select policy" ON public.notices;
CREATE POLICY "Notices select policy"
  ON public.notices FOR SELECT
  TO authenticated
  USING (
    target_role IN ('All', 'Students')
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "Staff can create notices" ON public.notices;
CREATE POLICY "Staff can create notices"
  ON public.notices FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can update notices" ON public.notices;
CREATE POLICY "Staff can update notices"
  ON public.notices FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can delete notices" ON public.notices;
CREATE POLICY "Staff can delete notices"
  ON public.notices FOR DELETE
  TO authenticated
  USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: VISITORS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visitors select policy" ON public.visitors;
CREATE POLICY "Visitors select policy"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Visitors insert policy" ON public.visitors;
CREATE POLICY "Visitors insert policy"
  ON public.visitors FOR INSERT
  TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND (status IS NULL OR status = 'Expected'))
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Visitors update policy" ON public.visitors;
CREATE POLICY "Visitors update policy"
  ON public.visitors FOR UPDATE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Expected')
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  )
  WITH CHECK (
    (student_id = auth.uid() AND status IN ('Expected', 'Cancelled'))
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Visitors delete policy" ON public.visitors;
CREATE POLICY "Visitors delete policy"
  ON public.visitors FOR DELETE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Expected')
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: FEE RECORDS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Fee records select policy" ON public.fee_records;
CREATE POLICY "Fee records select policy"
  ON public.fee_records FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

DROP POLICY IF EXISTS "Staff can manage fee records" ON public.fee_records;
DROP POLICY IF EXISTS "Hostel staff can manage fee records" ON public.fee_records;
CREATE POLICY "Hostel staff can manage fee records"
  ON public.fee_records FOR ALL
  TO authenticated
  USING (
    public.is_admin() 
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  )
  WITH CHECK (
    public.is_admin() 
    OR (
      public.is_warden() 
      AND student_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: ROOMMATE ASSIGNMENTS (WARDEN HOSTEL SCOPED)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Roommate assignments select policy" ON public.roommate_assignments;
CREATE POLICY "Roommate assignments select policy"
  ON public.roommate_assignments FOR SELECT
  TO authenticated
  USING (
    student_a_id = auth.uid()
    OR student_b_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_warden() 
      AND (
        student_a_id IN (
          SELECT p.id FROM public.profiles p 
          WHERE p.hostel_id = public.current_user_hostel_id()
        )
        OR student_b_id IN (
          SELECT p.id FROM public.profiles p 
          WHERE p.hostel_id = public.current_user_hostel_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Staff can manage roommate assignments" ON public.roommate_assignments;
DROP POLICY IF EXISTS "Hostel staff can manage roommate assignments" ON public.roommate_assignments;
CREATE POLICY "Hostel staff can manage roommate assignments"
  ON public.roommate_assignments FOR ALL
  TO authenticated
  USING (
    public.is_admin() 
    OR (
      public.is_warden() 
      AND student_a_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  )
  WITH CHECK (
    public.is_admin() 
    OR (
      public.is_warden() 
      AND student_a_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.hostel_id = public.current_user_hostel_id()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 21. PRIVATE STORAGE CONFIGURATION FOR BIOMETRIC REFERENCE PHOTOS
-- ----------------------------------------------------------------------------
-- Ensures the reference-faces bucket exists, is strictly private, and is protected by RLS.
-- Students CANNOT list, read, or overwrite reference photos.
-- Wardens can only read reference photos of students in their assigned hostel.
-- Only authorized staff (Warden/Admin) can enroll reference photos.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    -- Create private reference-faces bucket if not exists
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'reference-faces',
      'reference-faces',
      false, -- Private bucket: Never accessible via public URLs
      5242880, -- 5 MB limit
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

    -- RLS Policies on storage.objects for reference-faces
    DROP POLICY IF EXISTS "reference_faces_staff_select" ON storage.objects;
    CREATE POLICY "reference_faces_staff_select"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'reference-faces'
        AND (
          public.is_admin()
          OR (
            public.is_warden()
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.reference_face_photo_path = storage.objects.name
                AND p.hostel_id = public.current_user_hostel_id()
            )
          )
        )
      );

    DROP POLICY IF EXISTS "reference_faces_staff_insert" ON storage.objects;
    CREATE POLICY "reference_faces_staff_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'reference-faces'
        AND (public.is_admin() OR public.is_warden())
      );

    DROP POLICY IF EXISTS "reference_faces_staff_update" ON storage.objects;
    CREATE POLICY "reference_faces_staff_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'reference-faces'
        AND (public.is_admin() OR public.is_warden())
      );

    DROP POLICY IF EXISTS "reference_faces_admin_delete" ON storage.objects;
    CREATE POLICY "reference_faces_admin_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'reference-faces'
        AND public.is_admin()
      );
  END IF;
END $$;

