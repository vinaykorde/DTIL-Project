import {
  registerStudentAccount,
  loginUser,
  fetchStudentProfile,
  updateStudentProfile,
  getRegisteredAccounts,
  saveRegisteredAccount
} from '../src/services/api.js';
import { supabase, isSupabaseConfigured } from '../src/services/supabaseClient.js';
import { processAttendanceVerification } from '../src/services/attendanceVerificationService.js';
import { mockHostelSettings, mockStudents } from '../src/data/mockData.js';

console.log('================================================================');
console.log('DTIL HOSTEL SYSTEM - END-TO-END VERIFICATION TEST SUITE');
console.log('================================================================');
console.log('Supabase Connected:', isSupabaseConfigured());

// Sample synthetic face data URLs for testing biometric enrollment
const MOCK_FACE_PHOTO_A = 'data:image/jpeg;base64,' + Buffer.from('MOCK_BIOMETRIC_FACE_STUDENT_A_FEATURES_XYZ').toString('base64');
const MOCK_FACE_PHOTO_B = 'data:image/jpeg;base64,' + Buffer.from('MOCK_BIOMETRIC_FACE_STUDENT_B_FEATURES_ABC').toString('base64');

async function runEndToEndTests() {
  const testResults = [];

  function record(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${testName}${details ? ` -> ${details}` : ''}`);
  }

  const timestamp = Date.now().toString().slice(-6);

  // -------------------------------------------------------------
  // TEST 1: Register Student A (Vikramshilla Boys Hostel)
  // -------------------------------------------------------------
  const studentAData = {
    name: `Aarav Sharma ${timestamp}`,
    studentId: `STU-2026-A${timestamp}`,
    email: `aarav.${timestamp}@college.edu`,
    phone: `+91 98${timestamp}1`,
    password: `AaravPass#${timestamp}`,
    confirmPassword: `AaravPass#${timestamp}`,
    department: 'Computer Science & Engg',
    year: '2nd Year',
    hostel: 'Vikramshilla Boys Hostel',
    emergencyContact: '+91 98220 11221 (Father - Rajesh Sharma)',
    referenceFacePhoto: MOCK_FACE_PHOTO_A
  };

  let studentAUser = null;
  try {
    const regResult = await registerStudentAccount(studentAData);
    studentAUser = regResult.user;
    record(
      'Test 1.1: Student A Registration with Face & Emergency Contact',
      Boolean(regResult.success && studentAUser),
      `ID: ${studentAUser?.id}, Roll: ${studentAUser?.studentId}, Hostel: ${studentAUser?.hostel}`
    );
  } catch (err) {
    record('Test 1.1: Student A Registration with Face & Emergency Contact', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Register Student B (Ganga Girls Hostel)
  // -------------------------------------------------------------
  const studentBData = {
    name: `Ananya Deshmukh ${timestamp}`,
    studentId: `STU-2026-B${timestamp}`,
    email: `ananya.${timestamp}@college.edu`,
    phone: `+91 97${timestamp}2`,
    password: `AnanyaPass#${timestamp}`,
    confirmPassword: `AnanyaPass#${timestamp}`,
    department: 'Information Technology',
    year: '3rd Year',
    hostel: 'Ganga Girls Hostel',
    emergencyContact: '+91 98220 11222 (Mother - Sunita Deshmukh)',
    referenceFacePhoto: MOCK_FACE_PHOTO_B
  };

  let studentBUser = null;
  try {
    const regResultB = await registerStudentAccount(studentBData);
    studentBUser = regResultB.user;
    record(
      'Test 1.2: Student B Registration with Face & Emergency Contact',
      Boolean(regResultB.success && studentBUser),
      `ID: ${studentBUser?.id}, Roll: ${studentBUser?.studentId}, Hostel: ${studentBUser?.hostel}`
    );
  } catch (err) {
    record('Test 1.2: Student B Registration with Face & Emergency Contact', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Duplicate Registration Guard
  // -------------------------------------------------------------
  try {
    let duplicateCaught = false;
    try {
      await registerStudentAccount(studentAData);
    } catch (dErr) {
      duplicateCaught = dErr.message.includes('already registered') || dErr.message.includes('Student ID');
    }
    record('Test 1.3: Duplicate Email & Roll Prevention', duplicateCaught, 'Blocked re-registration attempt');
  } catch (err) {
    record('Test 1.3: Duplicate Email & Roll Prevention', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Portal Synchronization & Scoping
  // -------------------------------------------------------------
  try {
    const registered = getRegisteredAccounts().map(a => a.user).filter(Boolean);
    const allStudents = [...registered, ...mockStudents];

    // Admin sees all students
    const inAdminListA = allStudents.some(s => s.email === studentAData.email);
    const inAdminListB = allStudents.some(s => s.email === studentBData.email);
    record('Test 2.1: Admin Student List Visibility', inAdminListA && inAdminListB, 'Both Student A and B appear in Admin List');

    // Vikramshilla Warden Scoping
    const wardenHostelVikram = 'Vikramshilla Boys Hostel';
    const vikramStudents = allStudents.filter(s => s.hostel === wardenHostelVikram);
    const vikramHasA = vikramStudents.some(s => s.email === studentAData.email);
    const vikramHasB = vikramStudents.some(s => s.email === studentBData.email);

    record(
      'Test 2.2: Vikramshilla Warden Scoping',
      vikramHasA && !vikramHasB,
      `Student A present: ${vikramHasA}, Student B excluded: ${!vikramHasB}`
    );

    // Ganga Girls Warden Scoping
    const wardenHostelGanga = 'Ganga Girls Hostel';
    const gangaStudents = allStudents.filter(s => s.hostel === wardenHostelGanga);
    const gangaHasA = gangaStudents.some(s => s.email === studentAData.email);
    const gangaHasB = gangaStudents.some(s => s.email === studentBData.email);

    record(
      'Test 2.3: Ganga Girls Warden Scoping',
      !gangaHasA && gangaHasB,
      `Student B present: ${gangaHasB}, Student A excluded: ${!gangaHasA}`
    );

    // Check Pending Assignment Status
    const studentARecord = allStudents.find(s => s.email === studentAData.email);
    const isPending = !studentARecord?.room || studentARecord?.room === 'Unallocated' || studentARecord?.status === 'Pending Assignment';
    record('Test 2.4: Initial Pending Assignment Status', isPending, `Status: ${studentARecord?.status || 'Pending Assignment'}, Room: ${studentARecord?.room || 'Unallocated'}`);
  } catch (err) {
    record('Test 2: Portal Synchronization & Scoping', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Student Profile Login & Personal Data Verification
  // -------------------------------------------------------------
  let studentAProfile = null;
  let studentBProfile = null;
  try {
    const loginA = await loginUser(studentAData.email, studentAData.password, 'student');
    studentAProfile = await fetchStudentProfile(loginA.user.id);

    const loginB = await loginUser(studentBData.email, studentBData.password, 'student');
    studentBProfile = await fetchStudentProfile(loginB.user.id);

    const isolated =
      studentAProfile.id !== studentBProfile.id &&
      studentAProfile.email !== studentBProfile.email &&
      studentAProfile.hostel !== studentBProfile.hostel &&
      studentAProfile.emergencyContact !== studentBProfile.emergencyContact;

    record(
      'Test 3.1: Student Multi-User Isolation',
      isolated,
      `A: ${studentAProfile.name} (${studentAProfile.hostel}) | B: ${studentBProfile.name} (${studentBProfile.hostel})`
    );

    const faceEnrolledA = Boolean(studentAProfile.referenceFacePhoto || studentAProfile.reference_face_photo_path);
    const faceEnrolledB = Boolean(studentBProfile.referenceFacePhoto || studentBProfile.reference_face_photo_path);
    record(
      'Test 3.2: Biometric Face Registration Linkage',
      faceEnrolledA && faceEnrolledB,
      `Student A face: ${Boolean(faceEnrolledA)}, Student B face: ${Boolean(faceEnrolledB)}`
    );
  } catch (err) {
    record('Test 3: Student Profile & Isolation', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Warden / Admin Room & Bed Allocation
  // -------------------------------------------------------------
  try {
    const allocatedRoom = '204';
    const allocatedBed = 'Bed B';

    await updateStudentProfile(studentAProfile.id, {
      room: allocatedRoom,
      bed: allocatedBed,
      status: 'Active'
    });

    const refreshedProfileA = await fetchStudentProfile(studentAProfile.id);
    const allocationSuccess =
      refreshedProfileA.room === allocatedRoom &&
      refreshedProfileA.bed === allocatedBed &&
      refreshedProfileA.status === 'Active';

    record(
      'Test 4.1: Room & Bed Allocation Synchronization',
      allocationSuccess,
      `Updated Room: ${refreshedProfileA.room}, Bed: ${refreshedProfileA.bed}, Status: ${refreshedProfileA.status}`
    );
  } catch (err) {
    record('Test 4.1: Room & Bed Allocation Synchronization', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Biometric & Geofenced Attendance Verification
  // -------------------------------------------------------------
  try {
    const studentRecord = {
      id: studentAProfile.id,
      studentId: studentAData.studentId,
      name: studentAData.name,
      room: '204',
      hostel: 'Vikramshilla Boys Hostel',
      referenceFacePhoto: MOCK_FACE_PHOTO_A
    };

    const studentsDb = [studentRecord, ...mockStudents];

    // Case 1: Matching live selfie and valid geofence coordinates
    const validPresenceResult = await processAttendanceVerification({
      studentId: studentAProfile.id,
      liveImage: MOCK_FACE_PHOTO_A,
      locationData: {
        latitude: 18.5204100, // inside 100m radius of 18.5204000
        longitude: 73.8567100,
        accuracy: 15,
        timestamp: Date.now()
      },
      hostelSettings: mockHostelSettings,
      students: studentsDb,
      attendanceRecords: [],
      currentUser: studentAProfile,
      customFaceVerifier: async () => ({ verified: true, score: 0.12 })
    });

    record(
      'Test 5.1: Valid Biometric & Geofence Attendance Verification',
      validPresenceResult.success && validPresenceResult.verified,
      `Status: ${validPresenceResult.attendanceRecord?.status}, Distance: ${validPresenceResult.presenceRecord?.distanceFromHostel}m`
    );

    // Case 2: Out of Geofence Rejection
    const outsideGeofenceResult = await processAttendanceVerification({
      studentId: studentAProfile.id,
      liveImage: MOCK_FACE_PHOTO_A,
      locationData: {
        latitude: 19.0760, // Mumbai (far outside Pune hostel)
        longitude: 72.8777,
        accuracy: 15,
        timestamp: Date.now()
      },
      hostelSettings: mockHostelSettings,
      students: studentsDb,
      attendanceRecords: [],
      currentUser: studentAProfile,
      customFaceVerifier: async () => ({ verified: true, score: 0.12 })
    });

    record(
      'Test 5.2: Out of Geofence Attendance Rejection',
      !outsideGeofenceResult.success && outsideGeofenceResult.error === 'OUTSIDE_GEOFENCE',
      `Correctly rejected: ${outsideGeofenceResult.message}`
    );

    // Case 3: Face Mismatch Rejection
    const faceMismatchResult = await processAttendanceVerification({
      studentId: studentAProfile.id,
      liveImage: MOCK_FACE_PHOTO_B, // Different face
      locationData: {
        latitude: 18.5204100,
        longitude: 73.8567100,
        accuracy: 15,
        timestamp: Date.now()
      },
      hostelSettings: mockHostelSettings,
      students: studentsDb,
      attendanceRecords: [],
      currentUser: studentAProfile,
      customFaceVerifier: async () => ({ verified: false, error: 'FACE_MISMATCH', message: 'Face verification mismatch.' })
    });

    record(
      'Test 5.3: Face Mismatch Attendance Rejection',
      !faceMismatchResult.success && faceMismatchResult.error === 'FACE_MISMATCH',
      `Correctly rejected: ${faceMismatchResult.message}`
    );
  } catch (err) {
    record('Test 5: Attendance Verification', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Re-Login & Persistence Verification
  // -------------------------------------------------------------
  try {
    const reLogin = await loginUser(studentAData.email, studentAData.password, 'student');
    const freshA = await fetchStudentProfile(reLogin.user.id);
    const persists =
      freshA.name === studentAData.name &&
      freshA.email === studentAData.email &&
      freshA.hostel === studentAData.hostel &&
      freshA.room === '204' &&
      freshA.bed === 'Bed B' &&
      Boolean(freshA.referenceFacePhoto || freshA.reference_face_photo_path);

    record(
      'Test 6.1: Profile & Face Persistence Across Sessions',
      persists,
      `Persisted Room: ${freshA.room}, Bed: ${freshA.bed}, Face: ${Boolean(freshA.referenceFacePhoto)}`
    );
  } catch (err) {
    record('Test 6.1: Profile & Face Persistence Across Sessions', false, err.message);
  }

  console.log('\n================================================================');
  const allPassed = testResults.every(t => t.passed);
  console.log(`ALL VERIFICATION CHECKS: ${allPassed ? 'ALL PASSED ✨' : 'SOME CHECKS FAILED ⚠️'}`);
  console.log(`Passed: ${testResults.filter(t => t.passed).length} / ${testResults.length}`);
  console.log('================================================================');
}

runEndToEndTests();

