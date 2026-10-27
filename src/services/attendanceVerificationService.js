/**
 * ============================================================================
 * Controlled Attendance & Presence Verification Engine (Backend / Service Layer)
 * ============================================================================
 * Enforces server-side verification order and validation rules:
 * 1. Authenticate student & enforce role/session identity.
 * 2. Confirm student has a registered reference face.
 * 3. Validate fresh live selfie payload.
 * 4. Validate device location data & freshness.
 * 5. Validate location accuracy against hostel threshold.
 * 6. Calculate distance using Haversine formula independently.
 * 7. Validate hostel geofence boundary.
 * 8. Perform genuine facial verification against registered reference face.
 * 9. Check for duplicate attendance submissions for the current period.
 * 10. Atomic record creation: Attendance marked ONLY when all conditions pass.
 * ============================================================================
 */

import { evaluateLocationVerification } from './geolocationService.js';
import { verifyFaceBiometrics } from './faceVerification.js';

/**
 * Execute atomic attendance verification workflow.
 *
 * @param {Object} params
 * @param {string} params.studentId - Authenticated student ID
 * @param {string} params.liveImage - Captured live selfie (data URL)
 * @param {Object} params.locationData - { latitude, longitude, accuracy, timestamp }
 * @param {Object} params.hostelSettings - Hostel configuration
 * @param {Array} params.students - Students database
 * @param {Array} params.attendanceRecords - Existing attendance records
 * @param {Object} params.currentUser - Authenticated session user
 * @param {Function} [params.customFaceVerifier] - Optional custom verifier for testing/mock injection
 * @returns {Promise<{
 *   success: boolean,
 *   verified: boolean,
 *   duplicate?: boolean,
 *   step: string,
 *   error?: string,
 *   message: string,
 *   presenceRecord: Object,
 *   attendanceRecord?: Object
 * }>}
 */
export async function processAttendanceVerification({
  studentId,
  liveImage,
  locationData,
  hostelSettings,
  students = [],
  attendanceRecords = [],
  currentUser = null,
  customFaceVerifier = null
}) {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];

  // -------------------------------------------------------------
  // Step 1: Session & Student Authorization Check
  // -------------------------------------------------------------
  if (!studentId) {
    return {
      success: false,
      verified: false,
      step: 'AUTHENTICATION',
      error: 'UNAUTHENTICATED',
      message: 'Student session is invalid or missing.',
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId: 'UNKNOWN',
        timestamp,
        faceMatchStatus: 'FAILED',
        locationStatus: 'FAILED',
        verificationStatus: 'REJECTED',
        failureReason: 'Missing student authentication'
      }
    };
  }

  // Prevent student A from submitting attendance under student B's ID
  if (currentUser && currentUser.role === 'student' && currentUser.id !== studentId) {
    return {
      success: false,
      verified: false,
      step: 'AUTHORIZATION',
      error: 'UNAUTHORIZED_STUDENT',
      message: 'Unauthorized: You cannot mark attendance on behalf of another student.',
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        timestamp,
        faceMatchStatus: 'FAILED',
        locationStatus: 'FAILED',
        verificationStatus: 'REJECTED',
        failureReason: 'Unauthorized cross-student attendance attempt'
      }
    };
  }

  // -------------------------------------------------------------
  // Step 2: Retrieve Registered Student Record
  // -------------------------------------------------------------
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return {
      success: false,
      verified: false,
      step: 'STUDENT_LOOKUP',
      error: 'STUDENT_NOT_FOUND',
      message: `Student with ID ${studentId} was not found in the resident database.`,
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        timestamp,
        faceMatchStatus: 'FAILED',
        locationStatus: 'FAILED',
        verificationStatus: 'REJECTED',
        failureReason: 'Student record not found in system'
      }
    };
  }

  const studentName = student.name;

  // -------------------------------------------------------------
  // Step 3: Check Warden-Registered Reference Face
  // -------------------------------------------------------------
  if (!student.referenceFacePhoto) {
    return {
      success: false,
      verified: false,
      step: 'REFERENCE_FACE',
      error: 'NO_REFERENCE_FACE',
      message: 'No registered reference face found for your account. Please contact your Warden to enroll your face.',
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        studentName,
        timestamp,
        faceMatchStatus: 'NO_REFERENCE',
        locationStatus: 'PENDING',
        verificationStatus: 'REJECTED',
        failureReason: 'No reference face registered by Warden'
      }
    };
  }

  // -------------------------------------------------------------
  // Step 4: Validate Fresh Live Selfie Payload
  // -------------------------------------------------------------
  if (!liveImage || typeof liveImage !== 'string' || !liveImage.startsWith('data:image')) {
    return {
      success: false,
      verified: false,
      step: 'SELFIE_CAPTURE',
      error: 'INVALID_SELFIE_PAYLOAD',
      message: 'Fresh live selfie image is required for identity verification.',
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        studentName,
        timestamp,
        faceMatchStatus: 'FAILED',
        locationStatus: 'PENDING',
        verificationStatus: 'REJECTED',
        failureReason: 'Invalid or missing selfie payload'
      }
    };
  }

  // -------------------------------------------------------------
  // Step 5 & 6 & 7: Independent Server-Side Location Evaluation
  // -------------------------------------------------------------
  const locationEval = evaluateLocationVerification(locationData, hostelSettings);

  // -------------------------------------------------------------
  // Step 8: Genuine Face Verification Against Reference Face
  // -------------------------------------------------------------
  let faceResult;
  if (customFaceVerifier && typeof customFaceVerifier === 'function') {
    faceResult = await customFaceVerifier({
      liveImage,
      referenceImage: student.referenceFacePhoto,
      studentId
    });
  } else {
    faceResult = await verifyFaceBiometrics({
      liveImage,
      referenceImage: student.referenceFacePhoto,
      studentId
    });
  }

  // Determine actual face match status for record diagnostics
  let faceMatchStatus = 'FAILED';
  if (faceResult.verified) {
    faceMatchStatus = 'VERIFIED';
  } else if (faceResult.status === 'SERVICE_NOT_CONFIGURED') {
    faceMatchStatus = 'SERVICE_NOT_CONFIGURED';
  } else if (faceResult.error === 'NO_REFERENCE_FACE' || faceResult.error === 'INVALID_REFERENCE_FACE') {
    faceMatchStatus = 'NO_REFERENCE';
  } else {
    faceMatchStatus = 'FAILED';
  }

  let locationStatus = 'INSIDE';
  if (!locationEval.valid) {
    locationStatus = locationEval.error === 'OUTSIDE_GEOFENCE' ? 'OUTSIDE' : 'ACCURACY_POOR';
  }

  // Location check failure: reject attendance atomically with accurate face diagnostics
  if (!locationEval.valid) {
    return {
      success: false,
      verified: false,
      step: 'LOCATION_VERIFICATION',
      error: locationEval.error,
      message: locationEval.message,
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        studentName,
        latitude: locationData?.latitude || 0,
        longitude: locationData?.longitude || 0,
        locationAccuracy: locationEval.accuracy || 0,
        distanceFromHostel: locationEval.distance || 0,
        timestamp,
        faceMatchStatus,
        locationStatus,
        verificationStatus: 'REJECTED',
        failureReason: locationEval.message
      }
    };
  }

  // Face verification failure: reject attendance atomically
  if (!faceResult.verified) {
    return {
      success: false,
      verified: false,
      step: 'FACE_VERIFICATION',
      error: faceResult.error,
      message: faceResult.message,
      presenceRecord: {
        id: `PR-${Date.now()}`,
        studentId,
        studentName,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationEval.accuracy,
        distanceFromHostel: locationEval.distance,
        timestamp,
        faceMatchStatus,
        locationStatus: 'INSIDE',
        verificationStatus: 'REJECTED',
        failureReason: faceResult.message
      }
    };
  }

  // -------------------------------------------------------------
  // Step 9: Check for Duplicate Attendance Entry for Today
  // -------------------------------------------------------------
  const existingToday = attendanceRecords.find(
    (a) => a.studentId === studentId && a.date === dateStr && a.status === 'Present'
  );

  if (existingToday) {
    const presenceRecord = {
      id: `PR-${Date.now()}`,
      studentId,
      studentName,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationAccuracy: locationEval.accuracy,
      distanceFromHostel: locationEval.distance,
      timestamp,
      faceMatchStatus: 'VERIFIED',
      locationStatus: 'INSIDE',
      verificationStatus: 'PRESENT',
      isDuplicate: true,
      failureReason: null
    };

    return {
      success: true,
      verified: true,
      duplicate: true,
      step: 'COMPLETED',
      message: 'Attendance was already marked for today.',
      presenceRecord,
      attendanceRecord: existingToday
    };
  }

  // -------------------------------------------------------------
  // Step 10: Atomic Success - Both Face & Location Checks Passed
  // -------------------------------------------------------------
  const presenceRecord = {
    id: `PR-${Date.now()}`,
    studentId,
    studentName,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    locationAccuracy: locationEval.accuracy,
    distanceFromHostel: locationEval.distance,
    timestamp,
    faceMatchStatus: 'VERIFIED',
    locationStatus: 'INSIDE',
    verificationStatus: 'PRESENT',
    failureReason: null
  };

  const attendanceRecord = {
    id: `ATT-${Date.now()}`,
    studentId,
    studentName,
    room: student.room || 'General',
    hostel: student.hostel || hostelSettings?.name || 'Vikramshilla Boys Hostel',
    date: dateStr,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'Present',
    verifiedVia: 'GEO_FACE_PRESENCE',
    accuracy: locationEval.accuracy,
    distance: locationEval.distance
  };

  return {
    success: true,
    verified: true,
    duplicate: false,
    step: 'COMPLETED',
    message: 'Attendance marked successfully.',
    presenceRecord,
    attendanceRecord
  };
}
