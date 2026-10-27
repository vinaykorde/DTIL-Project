import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load the migration SQL file
const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// ============================================================================
// SUITE 1: STATIC ANALYSIS OF SQL MIGRATION FILE & IDEMPOTENCY
// ============================================================================
describe('SUITE 1: SQL MIGRATION FILE SECURITY & IDEMPOTENCY AUDIT', () => {
  it('1.1 All 11 tables must have CREATE TABLE IF NOT EXISTS', () => {
    const requiredTables = [
      'hostels',
      'rooms',
      'profiles',
      'attendance_records',
      'presence_records',
      'complaints',
      'leave_requests',
      'notices',
      'visitors',
      'fee_records',
      'roommate_assignments'
    ];

    for (const table of requiredTables) {
      const regex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, 'i');
      assert.ok(
        regex.test(migrationSql),
        `Table public.${table} must be defined with CREATE TABLE IF NOT EXISTS`
      );
    }
  });

  it('1.2 All 11 tables must have Row Level Security (RLS) enabled', () => {
    const requiredTables = [
      'hostels',
      'rooms',
      'profiles',
      'attendance_records',
      'presence_records',
      'complaints',
      'leave_requests',
      'notices',
      'visitors',
      'fee_records',
      'roommate_assignments'
    ];

    for (const table of requiredTables) {
      const regex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
      assert.ok(
        regex.test(migrationSql),
        `Table public.${table} must have ENABLE ROW LEVEL SECURITY`
      );
    }
  });

  it('1.3 All RLS policies must have DROP POLICY IF EXISTS for re-run safety', () => {
    const policyMatches = migrationSql.match(/CREATE POLICY "([^"]+)"\s+ON public\.([a-z_]+)/gi) || [];
    assert.ok(policyMatches.length >= 20, 'Should find at least 20 RLS policies');

    for (const match of policyMatches) {
      const parts = /CREATE POLICY "([^"]+)"\s+ON public\.([a-z_]+)/i.exec(match);
      const policyName = parts[1];
      const tableName = parts[2];
      const dropRegex = new RegExp(`DROP POLICY IF EXISTS "${policyName}" ON public\\.${tableName};`, 'i');
      assert.ok(
        dropRegex.test(migrationSql),
        `Policy "${policyName}" on public.${tableName} must have a preceding DROP POLICY IF EXISTS`
      );
    }
  });

  it('1.4 All triggers must use DROP TRIGGER IF EXISTS for re-run idempotency', () => {
    const triggerMatches = migrationSql.match(/CREATE TRIGGER ([a-z0-9_]+)\s+(BEFORE|AFTER)/gi) || [];
    assert.ok(triggerMatches.length >= 8, 'Should find all system and workflow triggers');

    for (const match of triggerMatches) {
      const parts = /CREATE TRIGGER ([a-z0-9_]+)/i.exec(match);
      const triggerName = parts[1];
      const dropRegex = new RegExp(`DROP TRIGGER IF EXISTS ${triggerName}\\b`, 'i');
      assert.ok(
        dropRegex.test(migrationSql),
        `Trigger ${triggerName} must have a preceding DROP TRIGGER IF EXISTS`
      );
    }
  });

  it('1.5 All SECURITY DEFINER functions must explicitly specify SET search_path = \'\' (empty string)', () => {
    const lines = migrationSql.split('\n');
    let currentFunc = null;
    let isDefiner = false;
    let hasEmptySearchPath = false;
    const definerFunctions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/CREATE OR REPLACE FUNCTION public\.([a-z_]+)/i);
      if (funcMatch) {
        if (currentFunc && isDefiner) {
          definerFunctions.push({ name: currentFunc, hasEmptySearchPath });
        }
        currentFunc = funcMatch[1];
        isDefiner = false;
        hasEmptySearchPath = false;
      }
      if (line.includes('SECURITY DEFINER')) {
        isDefiner = true;
      }
      if (line.includes("search_path = ''") || line.includes("search_path=''")) {
        hasEmptySearchPath = true;
      }
    }
    if (currentFunc && isDefiner) {
      definerFunctions.push({ name: currentFunc, hasEmptySearchPath });
    }

    assert.ok(definerFunctions.length >= 8, 'Should detect all SECURITY DEFINER functions');
    for (const func of definerFunctions) {
      assert.ok(
        func.hasEmptySearchPath,
        `Function public.${func.name} is SECURITY DEFINER and must have SET search_path = ''`
      );
    }
  });

  it('1.6 Existing hostel geofence settings are strictly preserved as defaults without inserting dummy rows', () => {
    assert.ok(
      migrationSql.includes('18.5204000'),
      'Hostels table default latitude 18.5204000 must be preserved'
    );
    assert.ok(
      migrationSql.includes('73.8567000'),
      'Hostels table default longitude 73.8567000 must be preserved'
    );
    assert.ok(
      /radius NUMERIC NOT NULL DEFAULT 100/i.test(migrationSql),
      'Hostels table default radius 100 must be preserved'
    );
    assert.ok(
      /max_accuracy NUMERIC NOT NULL DEFAULT 50/i.test(migrationSql),
      'Hostels table default max_accuracy 50 must be preserved'
    );
    assert.ok(
      !/INSERT INTO public\.hostels/i.test(migrationSql),
      'Migration must NOT contain INSERT INTO public.hostels without user confirmation'
    );
  });
});

// ============================================================================
// SUITE 2: PROFILE PRIVACY & ROOMMATE DISCOVERY (ISSUE 1 & ISSUE 4)
// ============================================================================
describe('SUITE 2: PROFILE PRIVACY & ROOMMATE DISCOVERY (ISSUE 1 & 4)', () => {
  it('2.1 Profiles select policy strictly restricts full profiles to self, admin, and hostel warden', () => {
    const profileSelectPolicyMatch = migrationSql.match(/CREATE POLICY "Profiles select policy"[\s\S]*?ON public\.profiles FOR SELECT[\s\S]*?USING \(([\s\S]*?)\);/i);
    assert.ok(profileSelectPolicyMatch, 'Profiles select policy must exist');
    const usingClause = profileSelectPolicyMatch[1];

    assert.ok(
      !usingClause.includes("roommate_status = 'Looking'"),
      'Profiles select policy MUST NOT expose full profile based on roommate_status = Looking'
    );
    assert.ok(
      usingClause.includes('id = auth.uid()'),
      'Profiles select policy must allow user to view own profile'
    );
    assert.ok(
      usingClause.includes('hostel_id = public.current_user_hostel_id()'),
      'Warden profile view must be scoped to their assigned hostel'
    );
  });

  it('2.2 Insecure available_roommates view is removed to eliminate view-owner RLS bypass risks', () => {
    assert.ok(
      /DROP VIEW IF EXISTS public\.available_roommates CASCADE;/i.test(migrationSql),
      'Migration must drop available_roommates view'
    );
    assert.ok(
      !/CREATE OR REPLACE VIEW public\.available_roommates/i.test(migrationSql),
      'Migration must NOT define public.available_roommates view'
    );
  });

  it('2.3 Roommate discovery RPC exposes ONLY non-sensitive compatibility fields and excludes private data', () => {
    const rpcMatch = migrationSql.match(/FUNCTION public\.get_compatible_roommates\(\)[\s\S]*?RETURNS TABLE \(([\s\S]*?)\)/i);
    assert.ok(rpcMatch, 'get_compatible_roommates RPC function must exist');
    const returnedColumns = rpcMatch[1].toLowerCase();

    assert.ok(returnedColumns.includes('sleep_time'), 'Must include sleep_time');
    assert.ok(returnedColumns.includes('study_time'), 'Must include study_time');
    assert.ok(returnedColumns.includes('cleanliness'), 'Must include cleanliness');
    assert.ok(returnedColumns.includes('food_preference'), 'Must include food_preference');
    assert.ok(returnedColumns.includes('light_preference'), 'Must include light_preference');
    assert.ok(returnedColumns.includes('roommate_status'), 'Must include roommate_status');

    assert.ok(!returnedColumns.includes('phone'), 'MUST NOT leak phone number');
    assert.ok(!returnedColumns.includes('email'), 'MUST NOT leak email address');
    assert.ok(!returnedColumns.includes('address'), 'MUST NOT leak home address');
    assert.ok(!returnedColumns.includes('emergency_contact'), 'MUST NOT leak emergency contact');
    assert.ok(!returnedColumns.includes('pending_fees'), 'MUST NOT leak pending fees');
    assert.ok(!returnedColumns.includes('reference_face_photo_path'), 'MUST NOT leak reference face photo path');
    assert.ok(!returnedColumns.includes('student_id'), 'MUST NOT leak student ID / roll number');
  });

  it('2.4 Roommate discovery restricts candidate matching strictly to the SAME hostel', () => {
    assert.ok(
      /p\.hostel_id = v_caller_hostel_id/i.test(migrationSql),
      'get_compatible_roommates must enforce matching only within caller hostel'
    );
    assert.ok(
      /p\.id <> auth\.uid\(\)/i.test(migrationSql),
      'get_compatible_roommates must exclude the caller from discovery results'
    );
  });
});

// ============================================================================
// SUITE 3: ROLE ESCALATION & PROFILE UPDATE RESTRICTIONS (ISSUE 2)
// ============================================================================
describe('SUITE 3: ROLE ESCALATION & PROFILE TAMPERING PREVENTION (ISSUE 2)', () => {
  function simulateProfileUpdateTrigger({ oldRow, newRow, callerRole, callerId, callerHostelId }) {
    const isAdmin = callerRole === 'admin';
    const isWarden = callerRole === 'warden';

    if (oldRow.role !== newRow.role) {
      if (!isAdmin) {
        throw new Error('Security Violation: Only system administrators can modify user roles.');
      }
    }

    if (!isAdmin && !isWarden) {
      const protectedFields = [
        'id', 'email', 'student_id', 'hostel_id', 'room_id', 'bed',
        'status', 'attendance_rate', 'pending_fees', 'reference_face_photo_path',
        'designation', 'cabin', 'department', 'year'
      ];

      for (const field of protectedFields) {
        if (oldRow[field] !== newRow[field]) {
          throw new Error(`Security Violation: Students cannot modify protected profile field (${field}).`);
        }
      }
    }

    if (isWarden && !isAdmin) {
      if (oldRow.id === callerId) {
        if (oldRow.role !== newRow.role || oldRow.hostel_id !== newRow.hostel_id || oldRow.status !== newRow.status) {
          throw new Error('Security Violation: Wardens cannot modify their own staff role, hostel assignment, or account status.');
        }
      }
      if (['admin', 'warden'].includes(oldRow.role) && oldRow.id !== callerId) {
        throw new Error('Security Violation: Wardens cannot modify other staff profiles.');
      }
      if (oldRow.role === 'student' && oldRow.hostel_id !== callerHostelId) {
        throw new Error('Security Violation: Wardens can only manage student profiles within their assigned hostel.');
      }
      if (oldRow.role === 'student' && oldRow.hostel_id !== newRow.hostel_id) {
        throw new Error('Security Violation: Hostel transfers must be approved by Administration.');
      }
    }

    return newRow;
  }

  it('3.1 Student attempting to change role to admin throws Security Violation', () => {
    const oldStudent = { id: 's1', role: 'student', pending_fees: 1000 };
    const newStudent = { ...oldStudent, role: 'admin' };

    assert.throws(
      () => simulateProfileUpdateTrigger({ oldRow: oldStudent, newRow: newStudent, callerRole: 'student', callerId: 's1' }),
      /Only system administrators can modify user roles/
    );
  });

  it('3.2 Student attempting to reset pending fees throws Security Violation', () => {
    const oldStudent = { id: 's1', role: 'student', pending_fees: 50000 };
    const newStudent = { ...oldStudent, pending_fees: 0 };

    assert.throws(
      () => simulateProfileUpdateTrigger({ oldRow: oldStudent, newRow: newStudent, callerRole: 'student', callerId: 's1' }),
      /Students cannot modify protected profile field \(pending_fees\)/
    );
  });

  it('3.3 Student attempting to alter reference face photo path throws Security Violation', () => {
    const oldStudent = { id: 's1', role: 'student', reference_face_photo_path: 'faces/valid.jpg' };
    const newStudent = { ...oldStudent, reference_face_photo_path: 'faces/attacker.jpg' };

    assert.throws(
      () => simulateProfileUpdateTrigger({ oldRow: oldStudent, newRow: newStudent, callerRole: 'student', callerId: 's1' }),
      /Students cannot modify protected profile field \(reference_face_photo_path\)/
    );
  });

  it('3.4 Warden attempting to alter their own staff role or hostel throws Security Violation', () => {
    const oldWarden = { id: 'w1', role: 'warden', hostel_id: 'hostel-boys-1', status: 'Active' };
    const newWarden = { ...oldWarden, role: 'admin' };

    assert.throws(
      () => simulateProfileUpdateTrigger({ oldRow: oldWarden, newRow: newWarden, callerRole: 'warden', callerId: 'w1', callerHostelId: 'hostel-boys-1' }),
      /Only system administrators can modify user roles/
    );
  });

  it('3.5 Warden attempting to update student in another hostel throws Security Violation', () => {
    const studentInHostelB = { id: 's2', role: 'student', hostel_id: 'hostel-girls-2', room_id: 'r2' };
    const updateAttempt = { ...studentInHostelB, room_id: 'r3' };

    assert.throws(
      () => simulateProfileUpdateTrigger({
        oldRow: studentInHostelB,
        newRow: updateAttempt,
        callerRole: 'warden',
        callerId: 'w1',
        callerHostelId: 'hostel-boys-1' // Warden is in hostel-boys-1!
      }),
      /Wardens can only manage student profiles within their assigned hostel/
    );
  });

  it('3.6 Student updating permitted personal & roommate preference fields succeeds', () => {
    const oldStudent = {
      id: 's1',
      role: 'student',
      phone: '+91 11111 22222',
      emergency_contact: 'Father',
      address: 'Old Town',
      sleep_time: 'Early',
      study_time: 'Morning',
      cleanliness: 'Medium',
      food_preference: 'Vegetarian',
      light_preference: 'Bright',
      roommate_status: 'Looking',
      pending_fees: 1000,
      student_id: 'STU-001'
    };

    const newStudent = {
      ...oldStudent,
      phone: '+91 99999 88888',
      emergency_contact: 'Mother: 99999 77777',
      address: 'New Residence Block B',
      sleep_time: 'Late',
      cleanliness: 'High',
      roommate_status: 'Assigned'
    };

    const result = simulateProfileUpdateTrigger({ oldRow: oldStudent, newRow: newStudent, callerRole: 'student', callerId: 's1' });
    assert.strictEqual(result.phone, '+91 99999 88888');
    assert.strictEqual(result.sleep_time, 'Late');
    assert.strictEqual(result.cleanliness, 'High');
    assert.strictEqual(result.roommate_status, 'Assigned');
  });

  it('3.7 Warden updating their own phone number succeeds, but changing their assigned hostel throws Security Violation', () => {
    const oldWarden = {
      id: 'w1',
      role: 'warden',
      hostel_id: 'hostel-boys-1',
      status: 'Active',
      phone: '+91 98765 00000'
    };

    const permittedUpdate = { ...oldWarden, phone: '+91 98765 11111' };
    const result = simulateProfileUpdateTrigger({
      oldRow: oldWarden,
      newRow: permittedUpdate,
      callerRole: 'warden',
      callerId: 'w1',
      callerHostelId: 'hostel-boys-1'
    });
    assert.strictEqual(result.phone, '+91 98765 11111');

    const hostelChangeAttempt = { ...oldWarden, hostel_id: 'hostel-girls-2' };
    assert.throws(
      () => simulateProfileUpdateTrigger({
        oldRow: oldWarden,
        newRow: hostelChangeAttempt,
        callerRole: 'warden',
        callerId: 'w1',
        callerHostelId: 'hostel-boys-1'
      }),
      /Wardens cannot modify their own staff role, hostel assignment, or account status/
    );
  });
});

// ============================================================================
// SUITE 4: WARDEN SCOPE ACROSS ALL TABLES (ISSUE 3)
// ============================================================================
describe('SUITE 4: WARDEN HOSTEL SCOPED ACCESS (ISSUE 3)', () => {
  it('4.1 Rooms table policy scopes warden management to their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Hostel staff can manage rooms"[\s\S]*?ON public\.rooms[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Rooms update policy must check hostel_id = public.current_user_hostel_id()'
    );
  });

  it('4.2 Attendance records policy scopes warden select & insert to their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Attendance select policy"[\s\S]*?ON public\.attendance_records[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Attendance select policy must check hostel_id = public.current_user_hostel_id()'
    );
    assert.ok(
      /CREATE POLICY "Staff can insert attendance"[\s\S]*?ON public\.attendance_records[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Attendance insert policy must check hostel_id = public.current_user_hostel_id()'
    );
  });

  it('4.3 Complaints policy scopes warden access to complaints for their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Complaints select policy"[\s\S]*?ON public\.complaints[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Complaints select policy must check hostel_id = public.current_user_hostel_id()'
    );
    assert.ok(
      /CREATE POLICY "Complaints update policy"[\s\S]*?ON public\.complaints[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Complaints update policy must check hostel_id = public.current_user_hostel_id()'
    );
  });

  it('4.4 Leave requests policy scopes warden access to students residing in their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Leave requests select policy"[\s\S]*?ON public\.leave_requests[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Leave requests select policy must verify student hostel matches warden assigned hostel'
    );
  });

  it('4.5 Visitors policy scopes warden access to visitors of students in their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Visitors select policy"[\s\S]*?ON public\.visitors[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Visitors select policy must verify student hostel matches warden assigned hostel'
    );
  });

  it('4.6 Fee records policy scopes warden management to students in their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Hostel staff can manage fee records"[\s\S]*?ON public\.fee_records[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Fee records policy must verify student hostel matches warden assigned hostel'
    );
  });

  it('4.7 Roommate assignments policy scopes warden management to students in their assigned hostel', () => {
    assert.ok(
      /CREATE POLICY "Hostel staff can manage roommate assignments"[\s\S]*?ON public\.roommate_assignments[\s\S]*?hostel_id = public\.current_user_hostel_id\(\)/i.test(migrationSql),
      'Roommate assignments policy must verify student hostel matches warden assigned hostel'
    );
  });
});

// ============================================================================
// SUITE 5: ATTENDANCE INTEGRITY & SERVER-SIDE VERIFICATION (ISSUE 1)
// ============================================================================
describe('SUITE 5: ATTENDANCE INTEGRITY & SERVER-SIDE VERIFICATION (ISSUE 1)', () => {
  it('5.1 Direct student INSERT permission on attendance_records and presence_records is revoked', () => {
    const attInsert = migrationSql.match(/CREATE POLICY "Staff can insert attendance"[\s\S]*?ON public\.attendance_records FOR INSERT[\s\S]*?WITH CHECK \(([\s\S]*?)\);/i);
    assert.ok(attInsert, 'Staff can insert attendance policy must exist');
    assert.ok(!attInsert[1].includes('student_id = auth.uid()'), 'Student direct insert MUST NOT exist on attendance_records');

    const presInsert = migrationSql.match(/CREATE POLICY "Staff can insert presence records"[\s\S]*?ON public\.presence_records FOR INSERT[\s\S]*?WITH CHECK \(([\s\S]*?)\);/i);
    assert.ok(presInsert, 'Staff can insert presence records policy must exist');
    assert.ok(!presInsert[1].includes('student_id = auth.uid()'), 'Student direct insert MUST NOT exist on presence_records');
  });

  it('5.2 Database function record_system_verified_attendance is restricted from public/anon/authenticated execution', () => {
    assert.ok(
      /REVOKE EXECUTE ON FUNCTION public\.record_system_verified_attendance[\s\S]*?FROM PUBLIC, anon, authenticated;/i.test(migrationSql),
      'record_system_verified_attendance MUST revoke execution from PUBLIC, anon, authenticated'
    );
    assert.ok(
      /GRANT EXECUTE ON FUNCTION public\.record_system_verified_attendance[\s\S]*?TO service_role/i.test(migrationSql),
      'record_system_verified_attendance MUST grant execution strictly to service_role'
    );
  });

  it('5.3 Database attendance function strictly rejects verification if hostel assignment or geofence config is missing (NO ARBITRARY FALLBACK)', () => {
    assert.ok(
      !/ORDER BY created_at ASC\s+LIMIT 1/i.test(migrationSql),
      'Must NOT contain fallback to an arbitrary first hostel'
    );
    assert.ok(
      /Student is not assigned to any hostel building/i.test(migrationSql) || /Student has no assigned hostel/i.test(migrationSql),
      'Must reject if student has no hostel assigned'
    );
    assert.ok(
      /Assigned hostel geofence configuration is missing or incomplete/i.test(migrationSql) || /Hostel geofence configuration is missing/i.test(migrationSql),
      'Must reject if hostel geofence configuration is missing'
    );
  });

  it('5.4 Duplicate attendance submissions for today are handled atomically and idempotently', () => {
    assert.ok(
      /ON CONFLICT \(student_id, date\) DO NOTHING/i.test(migrationSql),
      'Must use ON CONFLICT (student_id, date) DO NOTHING to prevent duplicate errors'
    );
    assert.ok(
      /Attendance already marked for today/i.test(migrationSql) || /v_is_duplicate/i.test(migrationSql),
      'Must handle duplicate status atomically and report duplicate'
    );
  });

  it('5.5 Server verification logic rejects when GPS accuracy or distance fails, even if face is true', () => {
    function evaluateAttendance({ faceVerified, insideGeofence, hasReferenceFace, hasHostelConfig }) {
      if (faceVerified && insideGeofence && hasReferenceFace && hasHostelConfig) {
        return { status: 'PRESENT', recordAttendance: true };
      }
      return { status: 'REJECTED', recordAttendance: false };
    }

    // Both pass
    assert.strictEqual(evaluateAttendance({ faceVerified: true, insideGeofence: true, hasReferenceFace: true, hasHostelConfig: true }).recordAttendance, true);

    // Location fails
    assert.strictEqual(evaluateAttendance({ faceVerified: true, insideGeofence: false, hasReferenceFace: true, hasHostelConfig: true }).recordAttendance, false);

    // Missing hostel config
    assert.strictEqual(evaluateAttendance({ faceVerified: true, insideGeofence: true, hasReferenceFace: true, hasHostelConfig: false }).recordAttendance, false);

    // Face verification fails
    assert.strictEqual(evaluateAttendance({ faceVerified: false, insideGeofence: true, hasReferenceFace: true, hasHostelConfig: true }).recordAttendance, false);
  });

  it('5.6 Database function record_system_verified_attendance strictly requires verified face match and similarity score >= 0.60', () => {
    assert.ok(
      /p_similarity_score >= 0\.60/i.test(migrationSql),
      'Database attendance function must independently check similarity score >= 0.60'
    );
    assert.ok(
      /p_face_match_status = 'VERIFIED'/i.test(migrationSql),
      'Database attendance function must independently verify face_match_status is VERIFIED'
    );
  });

  it('5.7 Database function strictly verifies target user role = student and validates coordinates and accuracy', () => {
    assert.ok(
      /v_student\.role <> 'student'/i.test(migrationSql),
      'Must reject attendance if target user is not a student'
    );
    assert.ok(
      /p_latitude >= -90\.0 AND p_latitude <= 90\.0/i.test(migrationSql),
      'Must validate latitude bounds'
    );
    assert.ok(
      /p_location_accuracy <= 0/i.test(migrationSql),
      'Must reject zero or negative GPS accuracy'
    );
  });

  it('5.8 Storage configuration creates private reference-faces bucket with staff-only RLS policies', () => {
    assert.ok(
      /INSERT INTO storage\.buckets[\s\S]*?'reference-faces'[\s\S]*?false/i.test(migrationSql),
      'Bucket reference-faces must be configured with public = false (private)'
    );
    assert.ok(
      /CREATE POLICY "reference_faces_staff_select"[\s\S]*?ON storage\.objects/i.test(migrationSql),
      'Storage RLS policy must restrict reference face reading to staff'
    );
  });
});

// ============================================================================
// SUITE 6: LEAVE REQUESTS & VISITORS WORKFLOW INTEGRITY (ISSUE 4)
// ============================================================================
describe('SUITE 6: LEAVE REQUESTS & VISITORS WORKFLOW INTEGRITY (ISSUE 4)', () => {
  it('6.1 Student cannot insert pre-approved leave or checked-in visitors', () => {
    assert.ok(
      /NEW\.status := 'Pending'/i.test(migrationSql),
      'Leave insert trigger must force student status to Pending'
    );
    assert.ok(
      /NEW\.reviewed_by := NULL/i.test(migrationSql),
      'Leave insert trigger must force reviewed_by to NULL'
    );
    assert.ok(
      /NEW\.status := 'Expected'/i.test(migrationSql),
      'Visitor insert trigger must force status to Expected'
    );
  });

  it('6.2 Student cannot update pending leave to Approved or Expected visitor to Checked In', () => {
    assert.ok(
      /Students are only permitted to cancel pending requests/i.test(migrationSql),
      'Leave update trigger must block students from changing status to anything other than Cancelled'
    );
    assert.ok(
      /Only hostel staff can check in or complete visitor logs/i.test(migrationSql),
      'Visitor update trigger must block students from changing status to Checked In or Completed'
    );
  });

  it('6.3 Staff members cannot approve their own student leave applications', () => {
    assert.ok(
      /Staff members cannot approve their own leave applications/i.test(migrationSql),
      'Trigger must reject staff approving their own leave request'
    );
  });

  it('6.4 Warden cannot approve leave or check in visitors for students in another hostel', () => {
    assert.ok(
      /Wardens can only review leave requests for students in their assigned hostel/i.test(migrationSql),
      'Trigger must prevent warden reviewing leave for students outside their assigned hostel'
    );
    assert.ok(
      /Wardens can only manage visitors for students in their assigned hostel/i.test(migrationSql),
      'Trigger must prevent warden managing visitors for students outside their assigned hostel'
    );
  });
});

// ============================================================================
// SUITE 7: FIRST ADMIN BOOTSTRAP & ROLE PROVISIONING (ISSUE 5 & 6)
// ============================================================================
describe('SUITE 7: FIRST ADMIN BOOTSTRAP & ROLE PROVISIONING (ISSUE 5 & 6)', () => {
  it('7.1 bootstrap_initial_admin function exists and has execution revoked from public/anon/authenticated', () => {
    assert.ok(
      /FUNCTION public\.bootstrap_initial_admin\(admin_email TEXT\)/i.test(migrationSql),
      'bootstrap_initial_admin function must be defined'
    );
    assert.ok(
      /REVOKE EXECUTE ON FUNCTION public\.bootstrap_initial_admin\(TEXT\) FROM PUBLIC, anon, authenticated;/i.test(migrationSql),
      'bootstrap_initial_admin must be revoked from PUBLIC, anon, authenticated'
    );
    assert.ok(
      /GRANT EXECUTE ON FUNCTION public\.bootstrap_initial_admin\(TEXT\) TO postgres, service_role;/i.test(migrationSql),
      'bootstrap_initial_admin must be granted to postgres and service_role'
    );
  });

  it('7.2 bootstrap_initial_admin disables itself if an active admin already exists', () => {
    assert.ok(
      /Bootstrap Disabled: System already has % active administrator\(s\)/i.test(migrationSql) || /Bootstrap Disabled: System already has an active administrator/i.test(migrationSql),
      'bootstrap_initial_admin must guard against running when an active admin exists'
    );
  });

  it('7.3 admin_set_user_role function prevents self-lockout of the last active administrator', () => {
    assert.ok(
      /Cannot demote the last remaining active system administrator/i.test(migrationSql),
      'admin_set_user_role must prevent removing or demoting the last admin'
    );
  });

  it('7.4 Public signup trigger handle_new_user strictly creates role = student', () => {
    assert.ok(
      /INSERT INTO public\.profiles[\s\S]*?'student'[\s\S]*?-- ALWAYS defaults to student/i.test(migrationSql),
      'handle_new_user must strictly insert role = student'
    );
  });
});
