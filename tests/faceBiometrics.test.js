import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeImageQuality,
  verifyFaceBiometrics
} from '../src/services/faceVerification.js';
import { processAttendanceVerification } from '../src/services/attendanceVerificationService.js';

// Base mock dataset
const mockHostel = {
  name: 'Vikramshilla Boys Hostel',
  latitude: 18.5204,
  longitude: 73.8567,
  radius: 100,
  maxAccuracy: 50
};

const mockStudentEnrolled = {
  id: 'STU-2024-001',
  name: 'Vinay Korde',
  hostel: 'Vikramshilla Boys Hostel',
  room: '204',
  referenceFacePhoto: 'data:image/jpeg;base64,WARDEN_REGISTERED_REFERENCE_FACE_VECTOR'
};

const mockStudentUnenrolled = {
  id: 'STU-2024-002',
  name: 'Rohan Mehta',
  hostel: 'Vikramshilla Boys Hostel',
  room: '101',
  referenceFacePhoto: null
};

const mockStudents = [mockStudentEnrolled, mockStudentUnenrolled];

const accurateInsideLocation = {
  latitude: 18.52042,
  longitude: 73.85672,
  accuracy: 10,
  timestamp: Date.now()
};

// Mock canvas helper for quality testing
function createMockCanvas(width, height, pixelFillFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const { r, g, b, a } = pixelFillFn(x, y);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a !== undefined ? a : 255;
  }

  return {
    width,
    height,
    getContext: (type) => {
      if (type === '2d') {
        return {
          getImageData: (x, y, w, h) => ({ data, width: w, height: h })
        };
      }
      return null;
    }
  };
}

describe('STEP 5: VERIFICATION SUITE — CASES A THROUGH F', () => {
  // Case A: The student's actual Warden-registered reference face
  it('CASE A: The student\'s actual registered reference face matches and passes attendance', async () => {
    const verifiedVerifier = async ({ liveImage, referenceImage, studentId }) => {
      assert.equal(studentId, 'STU-2024-001');
      assert.ok(referenceImage);
      assert.ok(liveImage);
      return {
        success: true,
        verified: true,
        status: 'VERIFIED',
        similarityScore: 0.92,
        thresholdUsed: 0.60,
        distance: 0.15,
        faceDetected: true,
        faceCount: 1,
        message: 'Face verified successfully against student reference record.'
      };
    };

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: 'data:image/jpeg;base64,STUDENT_ACTUAL_LIVE_SELFIE',
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: verifiedVerifier
    });

    assert.equal(result.success, true, 'Case A must succeed when face biometrics match');
    assert.equal(result.verified, true);
    assert.equal(result.presenceRecord.faceMatchStatus, 'VERIFIED');
    assert.equal(result.attendanceRecord.status, 'Present');
    assert.equal(result.attendanceRecord.studentId, 'STU-2024-001');
  });

  // Case B: A different person's face
  it('CASE B: A different person\'s face fails biometric verification and rejects attendance', async () => {
    const mismatchVerifier = async () => ({
      success: false,
      verified: false,
      status: 'FAILED',
      similarityScore: 0.22,
      thresholdUsed: 0.60,
      distance: 0.88,
      faceDetected: true,
      faceCount: 1,
      error: 'FACE_MISMATCH',
      message: 'Face does not match the registered student reference photo.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: 'data:image/jpeg;base64,STRANGER_FACE_SELFIE',
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: mismatchVerifier
    });

    assert.equal(result.success, false, 'Case B must fail when face does not match');
    assert.equal(result.verified, false);
    assert.equal(result.error, 'FACE_MISMATCH');
    assert.equal(result.presenceRecord.faceMatchStatus, 'FAILED');
    assert.equal(result.attendanceRecord, undefined, 'No attendance record must be created');
  });

  // Case C: A missing reference photo
  it('CASE C: Missing reference photo fails safely without marking attendance and explains the issue', async () => {
    const result = await processAttendanceVerification({
      studentId: 'STU-2024-002', // student without referenceFacePhoto
      liveImage: 'data:image/jpeg;base64,LIVE_SELFIE',
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-002', role: 'student' }
    });

    assert.equal(result.success, false, 'Case C must fail safely');
    assert.equal(result.error, 'NO_REFERENCE_FACE');
    assert.equal(result.presenceRecord.faceMatchStatus, 'NO_REFERENCE');
    assert.match(result.message, /No registered reference face found/i);
    assert.equal(result.attendanceRecord, undefined, 'No attendance record must be created');
  });

  // Case D: An image with no face
  it('CASE D: Image with no face fails detection and requests new selfie', async () => {
    const noFaceVerifier = async () => ({
      success: false,
      verified: false,
      status: 'FAILED',
      faceDetected: false,
      faceCount: 0,
      error: 'NO_FACE_DETECTED',
      message: 'No face detected in the live selfie. Please center your face in the camera.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: 'data:image/jpeg;base64,WALL_OR_EMPTY_BACKGROUND',
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: noFaceVerifier
    });

    assert.equal(result.success, false, 'Case D must fail when no face is found');
    assert.equal(result.error, 'NO_FACE_DETECTED');
    assert.equal(result.attendanceRecord, undefined);
  });

  // Case E: A blurry or poorly lit selfie
  it('CASE E: Blurry or poorly lit image produces useful error in quality checks', () => {
    // 1. Completely dark image (brightness = 5 < 15)
    const darkCanvas = createMockCanvas(100, 100, () => ({ r: 5, g: 5, b: 5 }));
    const darkResult = analyzeImageQuality(darkCanvas);
    assert.equal(darkResult.valid, false, 'Pitch black image must fail quality check');
    assert.equal(darkResult.error, 'IMAGE_TOO_DARK');

    // 2. Overexposed image (brightness = 250 > 245)
    const brightCanvas = createMockCanvas(100, 100, () => ({ r: 250, g: 250, b: 250 }));
    const brightResult = analyzeImageQuality(brightCanvas);
    assert.equal(brightResult.valid, false, 'Overexposed image must fail quality check');
    assert.equal(brightResult.error, 'IMAGE_TOO_BRIGHT');

    // 3. Flat blurry image (variance = 0 < 5)
    const flatBlurCanvas = createMockCanvas(100, 100, () => ({ r: 120, g: 120, b: 120 }));
    const blurResult = analyzeImageQuality(flatBlurCanvas);
    assert.equal(blurResult.valid, false, 'Uniform blurry image must fail blur check');
    assert.equal(blurResult.error, 'IMAGE_BLURRY');

    // 4. Clear image with normal webcam texture and lighting (passes quality)
    const normalCanvas = createMockCanvas(100, 100, (x, y) => {
      const val = 100 + ((x + y) % 60);
      return { r: val, g: val, b: val };
    });
    const normalResult = analyzeImageQuality(normalCanvas);
    assert.equal(normalResult.valid, true, 'Normal textured selfie must pass quality check');
  });

  // Case F: A failed or unavailable verification service
  it('CASE F: Failed or unconfigured verification service does not mark attendance', async () => {
    const unconfiguredVerifier = async () => ({
      success: false,
      verified: false,
      status: 'SERVICE_NOT_CONFIGURED',
      error: 'SERVICE_NOT_CONFIGURED',
      message: 'Face verification service not configured.'
    });

    const result = await processAttendanceVerification({
      studentId: 'STU-2024-001',
      liveImage: 'data:image/jpeg;base64,SELFIE',
      locationData: accurateInsideLocation,
      hostelSettings: mockHostel,
      students: mockStudents,
      attendanceRecords: [],
      currentUser: { id: 'STU-2024-001', role: 'student' },
      customFaceVerifier: unconfiguredVerifier
    });

    assert.equal(result.success, false, 'Case F must reject attendance on unconfigured service');
    assert.equal(result.error, 'SERVICE_NOT_CONFIGURED');
    assert.equal(result.presenceRecord.faceMatchStatus, 'SERVICE_NOT_CONFIGURED');
    assert.equal(result.attendanceRecord, undefined, 'Must NEVER mark attendance when service fails');
  });
});
