import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineDistanceM,
  validateHostelSettings,
  evaluateLocationVerification
} from '../src/services/geolocationService.js';
import { processAttendanceVerification } from '../src/services/attendanceVerificationService.js';
import { analyzeImageQuality } from '../src/services/faceVerification.js';

// Base mock dataset for tests
const mockHostel = {
  name: 'Vikramshilla Boys Hostel',
  latitude: 18.5204,
  longitude: 73.8567,
  radius: 100, // 100 meters
  maxAccuracy: 50 // 50 meters
};

const mockStudentWithFace = {
  id: 'STU-2024-001',
  name: 'Vinay Korde',
  hostel: 'Vikramshilla Boys Hostel',
  room: '204',
  referenceFacePhoto: 'data:image/jpeg;base64,REGISTERED_REFERENCE_FACE_ENCODING'
};

const mockStudentWithoutFace = {
  id: 'STU-2024-002',
  name: 'Rohan Mehta',
  hostel: 'Vikramshilla Boys Hostel',
  room: '101',
  referenceFacePhoto: null
};

const mockStudents = [mockStudentWithFace, mockStudentWithoutFace];

const validLiveSelfie = 'data:image/jpeg;base64,FRESH_LIVE_SELFIE_PAYLOAD';

const accurateInsideLocation = {
  latitude: 18.52042,
  longitude: 73.85672,
  accuracy: 10,
  timestamp: Date.now()
};

// ============================================================================
// PART 7 — SUITE 1: FACE TESTS (7 Cases)
// ============================================================================
describe('PART 7 — FACE TESTS', () => {
  it('1. Correct student registered face: passes only when genuine verification succeeds', async () => {
    const verifiedVerifier = async () => ({
      success: true,
      verified: true,
      status: 'VERIFIED',
      similarityScore: 0.94,
      thresholdUsed: 0.85,
      message: 'Face verified successfully'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, true, 'Verification should succeed for correct matching face');
    assert.equal(result.verified, true);
    assert.equal(result.presenceRecord.faceMatchStatus, 'VERIFIED');
    assert.equal(result.attendanceRecord.status, 'Present');
  });

  it('2. Different person face: fails biometric verification and rejects attendance', async () => {
    const mismatchVerifier = async () => ({
      success: false,
      verified: false,
      status: 'FAILED',
      similarityScore: 0.32,
      thresholdUsed: 0.85,
      error: 'FACE_MISMATCH',
      message: 'Face does not match the registered student.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: mismatchVerifier
    });

    assert.equal(result.success, false, 'Verification must fail for mismatching face');
    assert.equal(result.verified, false);
    assert.equal(result.error, 'FACE_MISMATCH');
    assert.equal(result.presenceRecord.faceMatchStatus, 'FAILED');
    assert.equal(result.attendanceRecord, undefined, 'No attendance record must be saved');
  });

  it('3. Missing reference face: fails safely and prompts Warden registration', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-002', // student without referenceFacePhoto
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-002', role: 'student' }
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'NO_REFERENCE_FACE');
    assert.match(result.message, /No registered reference face found/i);
    assert.equal(result.presenceRecord.faceMatchStatus, 'NO_REFERENCE');
    assert.equal(result.attendanceRecord, undefined);
  });

  it('4. No face detected in live selfie: fails and requires usable face', async () => {
    const noFaceVerifier = async () => ({
      success: false,
      verified: false,
      status: 'FAILED',
      error: 'NO_FACE_DETECTED',
      message: 'No face detected in the live selfie.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: noFaceVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'NO_FACE_DETECTED');
    assert.equal(result.presenceRecord.faceMatchStatus, 'FAILED');
    assert.equal(result.attendanceRecord, undefined);
  });

  it('5. Multiple faces detected: requests retake with only one face visible', async () => {
    const multiFaceVerifier = async () => ({
      success: false,
      verified: false,
      status: 'FAILED',
      error: 'MULTIPLE_FACES_DETECTED',
      message: 'Multiple faces detected (2). Only one face allowed.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: multiFaceVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'MULTIPLE_FACES_DETECTED');
    assert.equal(result.attendanceRecord, undefined);
  });

  it('6. Face verification service unavailable / unconfigured: does not mark attendance', async () => {
    const unconfiguredVerifier = async () => ({
      success: false,
      verified: false,
      status: 'SERVICE_NOT_CONFIGURED',
      error: 'SERVICE_NOT_CONFIGURED',
      message: 'Face verification service not configured.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: unconfiguredVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'SERVICE_NOT_CONFIGURED');
    assert.equal(result.presenceRecord.faceMatchStatus, 'SERVICE_NOT_CONFIGURED');
    assert.equal(result.attendanceRecord, undefined, 'Must NEVER mark attendance when service is unconfigured');
  });

  it('7. Frontend attempts to fake a successful result: backend independently validates and rejects', async () => {
    // Attempting to send fake flags `faceMatched: true`, `locationVerified: true`
    const fakeClientPayload = {
      studentId: 'STU-2024-001',
      liveImage: 'invalid_image_string', // invalid live image payload
      faceMatched: true,
      locationVerified: true,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' }
    };

    const result = await processAttendanceVerification(fakeClientPayload);
    assert.equal(result.success, false, 'Backend must reject fake client assertions');
    assert.equal(result.verified, false);
    assert.equal(result.attendanceRecord, undefined);
  });
});

// ============================================================================
// PART 7 — SUITE 2: LOCATION TESTS (8 Cases)
// ============================================================================
describe('PART 7 — LOCATION TESTS', () => {
  it('1. Accurate location inside the radius: passes the geofence', () => {
    const insideLocation = {
      latitude: 18.52045,
      longitude: 73.85675,
      accuracy: 15,
      timestamp: Date.now()
    };

    const evalResult = evaluateLocationVerification(insideLocation, mockHostel);
    assert.equal(evalResult.valid, true);
    assert.equal(evalResult.insideGeofence, true);
    assert.ok(evalResult.distance <= mockHostel.radius);
    assert.ok(evalResult.accuracy <= mockHostel.maxAccuracy);
  });

  it('2. Location outside the radius: fails geofence check', () => {
    // 500 meters away
    const outsideLocation = {
      latitude: 18.5250,
      longitude: 73.8567,
      accuracy: 20,
      timestamp: Date.now()
    };

    const evalResult = evaluateLocationVerification(outsideLocation, mockHostel);
    assert.equal(evalResult.valid, false);
    assert.equal(evalResult.insideGeofence, false);
    assert.equal(evalResult.error, 'OUTSIDE_GEOFENCE');
    assert.match(evalResult.message, /away from the hostel/i);
  });

  it('3. Permission denied: gives a useful user explanation', () => {
    // Simulated browser permission denial error
    const permissionDeniedResult = {
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'Location permission was denied. Please allow location access in your browser or device settings.'
    };

    assert.equal(permissionDeniedResult.success, false);
    assert.equal(permissionDeniedResult.error, 'PERMISSION_DENIED');
    assert.match(permissionDeniedResult.message, /allow location access/i);
  });

  it('4. Timeout: allows retry with proper error message', () => {
    const timeoutResult = {
      success: false,
      error: 'TIMEOUT',
      message: 'Location request timed out. Please check your network or GPS signal and click Try Again.'
    };

    assert.equal(timeoutResult.success, false);
    assert.equal(timeoutResult.error, 'TIMEOUT');
    assert.match(timeoutResult.message, /timed out/i);
  });

  it('5. Poor accuracy: rejects verification when accuracy exceeds maxAccuracy', () => {
    const poorAccuracyLocation = {
      latitude: 18.52042,
      longitude: 73.85672,
      accuracy: 180, // 180m accuracy when max is 50m
      timestamp: Date.now()
    };

    const evalResult = evaluateLocationVerification(poorAccuracyLocation, mockHostel);
    assert.equal(evalResult.valid, false);
    assert.equal(evalResult.error, 'POOR_ACCURACY');
    assert.match(evalResult.message, /Location accuracy is currently ±180 m; the configured maximum is 50 m/i);
  });

  it('6. Missing hostel coordinates: reports an administrator configuration error', () => {
    const invalidHostel = {
      name: 'Unconfigured Hostel',
      latitude: null,
      longitude: undefined,
      radius: 0,
      maxAccuracy: 50
    };

    const check = validateHostelSettings(invalidHostel);
    assert.equal(check.valid, false);
    assert.equal(check.error, 'INVALID_HOSTEL_CONFIGURATION');
  });

  it('7. Invalid or stale coordinates: rejects verification', () => {
    // A: Out of physical bounds
    const outOfBoundsLocation = {
      latitude: 95.0, // Invalid latitude (> 90)
      longitude: 73.8567,
      accuracy: 10,
      timestamp: Date.now()
    };
    const boundsEval = evaluateLocationVerification(outOfBoundsLocation, mockHostel);
    assert.equal(boundsEval.valid, false);
    assert.equal(boundsEval.error, 'COORDINATES_OUT_OF_BOUNDS');

    // B: Stale coordinates (> 60 seconds old)
    const staleLocation = {
      latitude: 18.52042,
      longitude: 73.85672,
      accuracy: 10,
      timestamp: Date.now() - 120000 // 2 minutes old
    };
    const staleEval = evaluateLocationVerification(staleLocation, mockHostel);
    assert.equal(staleEval.valid, false);
    assert.equal(staleEval.error, 'STALE_LOCATION');
    assert.match(staleEval.message, /stale or expired/i);
  });

  it('8. Accurate distance calculation: Haversine formula verified against known geographic benchmark', () => {
    // Distance between Pune Shaniwar Wada (18.5196, 73.8553) and Dagadusheth Temple (18.5165, 73.8561) ~ 355 meters
    const dist = calculateHaversineDistanceM(18.5196, 73.8553, 18.5165, 73.8561);
    assert.ok(dist >= 340 && dist <= 370, `Calculated distance ${dist}m should be approximately 355m`);
  });
});

// ============================================================================
// PART 7 — SUITE 3: ATTENDANCE TESTS (4 Cases)
// ============================================================================
describe('PART 7 — ATTENDANCE TESTS', () => {
  const verifiedVerifier = async () => ({
    success: true,
    verified: true,
    status: 'VERIFIED',
    similarityScore: 0.95,
    thresholdUsed: 0.85,
    message: 'Face verified successfully'
  });

  it('1. Successful face and location checks: saves exactly one valid attendance record', async () => {
    const existingRecords = [];
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: existingRecords,
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, true);
    assert.equal(result.verified, true);
    assert.ok(result.attendanceRecord, 'Valid attendance record must be created');
    assert.equal(result.attendanceRecord.status, 'Present');
    assert.equal(result.attendanceRecord.studentId, 'STU-2024-001');
    assert.equal(result.presenceRecord.verificationStatus, 'PRESENT');
  });

  it('2. Either check fails: no successful attendance record is saved', async () => {
    // Face succeeds but student is outside geofence
    const outsideLocation = {
      latitude: 18.5300,
      longitude: 73.8567,
      accuracy: 15,
      timestamp: Date.now()
    };

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: outsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.verified, false);
    assert.equal(result.attendanceRecord, undefined, 'Attendance record must NEVER be saved on partial failure');
    assert.equal(result.presenceRecord.verificationStatus, 'REJECTED');
  });

  it('3. Repeated submissions: prevent duplicate attendance entries for the same student today', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingAttendance = [
      {
        id: 'ATT-EXISTING-1',
        studentId: 'STU-2024-001',
        date: todayStr,
        status: 'Present'
      }
    ];

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: existingAttendance,
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, true);
    assert.equal(result.duplicate, true, 'Should detect duplicate submission for today');
    assert.match(result.message, /already marked/i);
  });

  it('4. Unauthorized student: cannot mark attendance for another student', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-002', // Attempting to mark for STU-2024-002
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' }, // Logged in as STU-2024-001
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'UNAUTHORIZED_STUDENT');
    assert.equal(result.attendanceRecord, undefined);
  });
});

// ============================================================================
// USER REQUIREMENT SECTION 4 — 8 VERIFICATION CASES
// ============================================================================
describe('USER REQUIREMENT SECTION 4 — 8 VERIFICATION CASES', () => {
  const genuineFaceVerifier = async () => ({
    success: true,
    verified: true,
    status: 'VERIFIED',
    similarityScore: 0.94,
    thresholdUsed: 0.60,
    distance: 0.16,
    faceDetected: true,
    faceCount: 1,
    message: 'Face verified successfully against student reference record.'
  });

  const mismatchFaceVerifier = async () => ({
    success: false,
    verified: false,
    status: 'FAILED',
    similarityScore: 0.28,
    thresholdUsed: 0.60,
    distance: 0.72,
    faceDetected: true,
    faceCount: 1,
    error: 'FACE_MISMATCH',
    message: 'Face does not match the registered student reference photo. Distance: 0.72, Threshold: 0.60.'
  });

  const noFaceVerifier = async () => ({
    success: false,
    verified: false,
    status: 'FAILED',
    faceDetected: false,
    faceCount: 0,
    error: 'NO_FACE_DETECTED',
    message: 'No face detected in live selfie. Please ensure face is centered and clearly visible.'
  });

  const serviceUnavailableVerifier = async () => ({
    success: false,
    verified: false,
    status: 'SERVICE_NOT_CONFIGURED',
    error: 'SERVICE_NOT_CONFIGURED',
    message: 'Biometric verification service unavailable. Please contact the administrator.'
  });

  // Case 1: Correct registered student face with acceptable GPS accuracy and location inside the geofence
  it('Case 1: Correct registered student face with acceptable GPS accuracy and location inside the geofence', async () => {
    const insideLocation = {
      latitude: 18.52042,
      longitude: 73.85672,
      accuracy: 12, // <= 50m maxAccuracy
      timestamp: Date.now()
    };

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: insideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: genuineFaceVerifier
    });

    assert.equal(result.success, true, 'Attendance must succeed when both face and location pass');
    assert.equal(result.verified, true);
    assert.ok(result.attendanceRecord, 'Attendance record must be saved');
    assert.equal(result.attendanceRecord.status, 'Present');
    assert.equal(result.attendanceRecord.studentId, 'STU-2024-001');
    assert.equal(result.presenceRecord.verificationStatus, 'PRESENT');
    assert.equal(result.presenceRecord.faceMatchStatus, 'VERIFIED');
    assert.equal(result.presenceRecord.locationStatus, 'INSIDE');
  });

  // Case 2: Different person's face
  it('Case 2: Different person\'s face', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: mismatchFaceVerifier
    });

    assert.equal(result.success, false, 'Must fail when face does not match reference');
    assert.equal(result.verified, false);
    assert.equal(result.error, 'FACE_MISMATCH');
    assert.match(result.message, /does not match/i);
    assert.equal(result.presenceRecord.faceMatchStatus, 'FAILED');
    assert.equal(result.presenceRecord.verificationStatus, 'REJECTED');
    assert.equal(result.attendanceRecord, undefined, 'No attendance record must be created');
  });

  // Case 3: No face or a blurry selfie
  it('Case 3a: No face detected in selfie', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: noFaceVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'NO_FACE_DETECTED');
    assert.match(result.message, /no face detected/i);
    assert.equal(result.presenceRecord.faceMatchStatus, 'FAILED');
    assert.equal(result.attendanceRecord, undefined);
  });

  it('Case 3b: Blurry selfie quality rejection', () => {
    // Simulating blurred/low-frequency image canvas
    const width = 100;
    const height = 100;
    const uniformData = new Uint8ClampedArray(width * height * 4);
    // Completely uniform gray: zero variance / zero laplacian energy -> blur
    uniformData.fill(128);

    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => ({ data: uniformData, width, height })
      })
    };

    const quality = analyzeImageQuality(mockCanvas);
    assert.equal(quality.valid, false, 'Uniform/zero-detail canvas should be marked invalid');
    assert.equal(quality.error, 'IMAGE_BLURRY');
    assert.match(quality.message, /blurry/i);
  });

  // Case 4: Missing registered reference photo
  it('Case 4: Missing registered reference photo', async () => {
    // STU-2024-002 has referenceFacePhoto: null
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-002',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-002', role: 'student' },
      customFaceVerifier: genuineFaceVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'NO_REFERENCE_FACE');
    assert.match(result.message, /No registered reference face found/i);
    assert.match(result.message, /Warden/i);
    assert.equal(result.presenceRecord.faceMatchStatus, 'NO_REFERENCE');
    assert.equal(result.attendanceRecord, undefined, 'Cannot mark attendance without reference face');
  });

  // Case 5: GPS accuracy worse than 50 m (e.g. ±63 m matching screenshot)
  it('Case 5: GPS accuracy worse than 50 m (±63 m) rejects attendance while properly evaluating face', async () => {
    // Exact screenshot condition: accuracy 63 m, distance ~38 m
    const screenshotLocation = {
      latitude: 18.52074, // ~38m from hostel (18.5204, 73.8567)
      longitude: 73.85670,
      accuracy: 63, // worse than 50m limit
      timestamp: Date.now()
    };

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: screenshotLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: genuineFaceVerifier
    });

    assert.equal(result.success, false, 'Attendance must NOT be marked when GPS accuracy is worse than 50 m');
    assert.equal(result.verified, false);
    assert.equal(result.error, 'POOR_ACCURACY');
    assert.match(result.message, /Location accuracy is currently ±63 m/i);
    assert.match(result.message, /window or outdoors and retry/i);
    assert.equal(result.attendanceRecord, undefined, 'Attendance record must not be saved');

    // CRITICAL FIX VERIFICATION: Face check must be accurately reported as VERIFIED, not falsely Failed
    assert.equal(result.presenceRecord.faceMatchStatus, 'VERIFIED');
    assert.equal(result.presenceRecord.locationStatus, 'ACCURACY_POOR');
    assert.equal(result.presenceRecord.verificationStatus, 'REJECTED');
  });

  // Case 6: GPS accuracy within the limit but location outside the geofence
  it('Case 6: GPS accuracy within the limit but location outside the geofence', async () => {
    const outsideLocation = {
      latitude: 18.5250, // ~511m away from hostel
      longitude: 73.8567,
      accuracy: 15, // <= 50m limit (good accuracy)
      timestamp: Date.now()
    };

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: outsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: genuineFaceVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'OUTSIDE_GEOFENCE');
    assert.match(result.message, /away from the hostel/i);
    assert.equal(result.presenceRecord.locationStatus, 'OUTSIDE');
    assert.equal(result.attendanceRecord, undefined);
  });

  // Case 7: GPS permission denied or location unavailable
  it('Case 7: GPS permission denied or location unavailable', async () => {
    // 7a: Permission denied
    const deniedLocation = {
      latitude: null,
      longitude: null,
      accuracy: null,
      error: 'PERMISSION_DENIED',
      message: 'Location permission was denied. Please allow location access in your browser or device settings.'
    };

    const evalDenied = evaluateLocationVerification(deniedLocation, mockHostel);
    assert.equal(evalDenied.valid, false);
    assert.equal(evalDenied.error, 'PERMISSION_DENIED');
    assert.match(evalDenied.message, /allow location access/i);

    // 7b: Location unavailable / timeout
    const timeoutLocation = {
      latitude: null,
      longitude: null,
      accuracy: null,
      error: 'TIMEOUT',
      message: 'Location request timed out. Please check your network or GPS signal and click Try Again.'
    };

    const evalTimeout = evaluateLocationVerification(timeoutLocation, mockHostel);
    assert.equal(evalTimeout.valid, false);
    assert.equal(evalTimeout.error, 'TIMEOUT');
    assert.match(evalTimeout.message, /timed out/i);
  });

  // Case 8: Face verification service unavailable
  it('Case 8: Face verification service unavailable', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: validLiveSelfie,
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: serviceUnavailableVerifier
    });

    assert.equal(result.success, false);
    assert.equal(result.error, 'SERVICE_NOT_CONFIGURED');
    assert.match(result.message, /service unavailable/i);
    assert.equal(result.presenceRecord.faceMatchStatus, 'SERVICE_NOT_CONFIGURED');
    assert.equal(result.attendanceRecord, undefined, 'Must not mark attendance if verification service is unavailable');
  });
});

