/**
 * ============================================================================
 * Centralized API Service Layer - College Hostel Management System
 * ============================================================================
 * NOTE FOR BACKEND TEAM:
 * All API interactions for the application are centralized here.
 * Currently, these functions simulate asynchronous network responses using
 * local state and promises.
 * 
 * To integrate with your real backend (e.g. Express, Spring Boot, Django, FastAPI):
 * 1. Configure your Axios or Fetch base URL (e.g. `const API_BASE_URL = 'http://localhost:5000/api'`).
 * 2. Replace the simulated Promise body in each function with the appropriate
 *    HTTP method (GET, POST, PUT, DELETE) as indicated in the header comments.
 * 3. Store authentication tokens (JWT) in headers using an interceptor.
 * ============================================================================
 */

import {
  mockStudents,
  mockRooms,
  mockComplaints,
  mockNotices,
  mockLeaveRequests,
  mockVisitors,
  mockAttendanceRecords,
  mockAdminStats,
  mockFeeDetails
} from '../data/mockData';
import { processAttendanceVerification } from './attendanceVerificationService.js';

// Simulated network delay helper
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Login user with role
 * Checks Supabase Auth first, maps to profiles table, and falls back to demo accounts
 * Body: { email, password, role }
 * Returns: { user: { id, studentId, name, email, role, ... }, token: "jwt_token_here" }
 */
export async function loginUser(email, password, role) {
  if (!email || !password || !role) {
    throw new Error('Please provide email, password, and select a role.');
  }

  const cleanEmail = email.trim();

  // 1. If Supabase is configured, authenticate via Supabase Auth
  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!authError && authData?.user) {
        // Query profile details from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userRole = profile?.role || authData.user.user_metadata?.role || 'student';

        // Guard against role mismatch (e.g. student logging into admin portal)
        if (role && userRole !== role) {
          throw new Error(
            `Access Denied: Your account role is "${userRole}", but you are attempting to sign in to the "${role.toUpperCase()}" portal.`
          );
        }

        const userObj = {
          id: authData.user.id,
          studentId: profile?.student_id || authData.user.user_metadata?.student_id || authData.user.id,
          name: profile?.name || authData.user.user_metadata?.name || cleanEmail.split('@')[0],
          email: profile?.email || authData.user.email,
          role: userRole,
          phone: profile?.phone || '',
          department: profile?.department || 'Information Technology',
          year: profile?.year || '1st Year',
          hostel: profile?.hostel || 'Vikramshilla Boys Hostel',
          room: profile?.room || '201',
          bed: profile?.bed || 'Bed A',
          attendanceRate: profile?.attendance_rate ?? 100,
          pendingFees: profile?.pending_fees ?? 0,
          referenceFacePhoto: profile?.reference_face_photo_path || null,
          status: profile?.status || 'Active'
        };

        return {
          token: authData.session?.access_token || 'supabase-session-token',
          user: userObj
        };
      } else if (authError) {
        // Check if demo fallback credentials were used
        const isDemoAccount = (
          (cleanEmail === 'admin@hostel.com' && role === 'admin') ||
          (cleanEmail === 'warden@hostel.com' && role === 'warden') ||
          (cleanEmail === 'student@hostel.com' && role === 'student')
        ) && password === 'demo123';

        if (!isDemoAccount) {
          throw new Error(authError.message || 'Invalid email or password.');
        }
      }
    } catch (err) {
      const isDemoAccount = (
        (cleanEmail === 'admin@hostel.com' && role === 'admin') ||
        (cleanEmail === 'warden@hostel.com' && role === 'warden') ||
        (cleanEmail === 'student@hostel.com' && role === 'student')
      ) && password === 'demo123';

      if (!isDemoAccount) {
        throw err;
      }
    }
  }

  await delay(150);

  // 2. Demo fallback for evaluation
  if (role === 'admin') {
    return {
      token: 'demo-jwt-admin-token-xyz',
      user: {
        id: 'ADM-001',
        name: 'Prof. V. K. Deshpande',
        role: 'admin',
        email: cleanEmail || 'admin@hostel.com',
        designation: 'Chief Warden & Director of Student Housing',
        department: 'Campus Administration',
        phone: '+91 98765 43210'
      }
    };
  } else if (role === 'warden') {
    return {
      token: 'demo-jwt-warden-token-xyz',
      user: {
        id: 'W101',
        name: 'Satish Sir',
        role: 'warden',
        email: cleanEmail || 'warden@hostel.com',
        hostel: 'Vikramshilla Boys Hostel',
        department: 'Mechanical Engg.',
        phone: '+91 98234 56789'
      }
    };
  } else {
    return {
      token: 'demo-jwt-student-token-xyz',
      user: {
        id: 'STU-2024-001',
        name: 'Vinay Korde',
        role: 'student',
        email: cleanEmail || 'student@hostel.com',
        hostel: 'Vikramshila Boys Hostel',
        room: 'V-616',
        bed: 'Bed A',
        department: 'Information Technology',
        year: '2nd Year',
        phone: '1234567890',
        attendanceRate: 88,
        pendingFees: 0
      }
    };
  }
}

/**
 * Logout current user
 * BACKEND ROUTE: POST /api/auth/logout
 */
export async function logoutUser() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut notice:', err.message);
    }
  }
  await delay(100);
  return { success: true };
}

// ==========================================
// 2. STUDENTS MANAGEMENT
// ==========================================

/**
 * Get all students (with optional filters: hostel, year, dept, search)
 * BACKEND ROUTE: GET /api/students?hostel=...&year=...&search=...
 */
export async function getStudents(filters = {}) {
  await delay();
  // TODO: return (await axios.get('/api/students', { params: filters })).data;
  return [...mockStudents];
}

/**
 * Get student by ID
 * BACKEND ROUTE: GET /api/students/:id
 */
export async function getStudentById(id) {
  await delay();
  return mockStudents.find(s => s.id === id) || mockStudents[0];
}

/**
 * Update student details
 * BACKEND ROUTE: PUT /api/students/:id
 */
export async function updateStudent(id, updatedData) {
  await delay();
  return { success: true, student: { id, ...updatedData } };
}

/**
 * Delete student record
 * BACKEND ROUTE: DELETE /api/students/:id
 */
export async function deleteStudent(id) {
  await delay();
  return { success: true, message: `Student ${id} removed successfully.` };
}

// ==========================================
// 3. ROOM MANAGEMENT
// ==========================================

/**
 * Get all rooms with current occupancy
 * BACKEND ROUTE: GET /api/rooms?hostel=...&floor=...
 */
export async function getRooms(filters = {}) {
  await delay();
  // TODO: return (await axios.get('/api/rooms', { params: filters })).data;
  return [...mockRooms];
}

/**
 * Add a new room
 * BACKEND ROUTE: POST /api/rooms
 * Body: { roomNumber, hostel, floor, roomType, capacity, amenities }
 */
export async function createRoom(roomData) {
  await delay();
  const newRoom = {
    id: `R-${roomData.roomNumber || Date.now().toString().slice(-3)}`,
    occupied: 0,
    status: 'Available',
    occupants: [],
    amenities: roomData.amenities || ['Wi-Fi', 'Attached Bath'],
    ...roomData
  };
  return newRoom;
}

// ==========================================
// 4. COMPLAINT MANAGEMENT
// ==========================================

/**
 * Get all complaints (or filter by studentId, status, category)
 * BACKEND ROUTE: GET /api/complaints?studentId=...&status=...
 */
export async function getComplaints(filters = {}) {
  await delay();
  return [...mockComplaints];
}

/**
 * Create a new complaint
 * BACKEND ROUTE: POST /api/complaints
 * Body: { studentId, category, subject, description, priority }
 */
export async function createComplaint(complaintData) {
  await delay();
  const newComplaint = {
    id: `CMP-2026-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    resolvedDate: null,
    notes: 'Submitted and queued for warden review.',
    ...complaintData
  };
  return newComplaint;
}

/**
 * Update complaint status (e.g. In Progress, Resolved)
 * BACKEND ROUTE: PATCH /api/complaints/:id/status
 * Body: { status, notes }
 */
export async function updateComplaintStatus(id, status, notes = '') {
  await delay();
  return { success: true, id, status, notes };
}

// ==========================================
// 5. NOTICES & ANNOUNCEMENTS
// ==========================================

/**
 * Get all active notices
 * BACKEND ROUTE: GET /api/notices
 */
export async function getNotices() {
  await delay();
  return [...mockNotices];
}

/**
 * Create a notice (Admin / Warden)
 * BACKEND ROUTE: POST /api/notices
 * Body: { title, description, category, priority, postedBy, targetRole }
 */
export async function createNotice(noticeData) {
  await delay();
  const newNotice = {
    id: `NOT-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    ...noticeData
  };
  return newNotice;
}

/**
 * Delete a notice
 * BACKEND ROUTE: DELETE /api/notices/:id
 */
export async function deleteNotice(id) {
  await delay();
  return { success: true, id };
}

// ==========================================
// 6. ATTENDANCE MANAGEMENT
// ==========================================

/**
 * Get attendance records for a specific date, hostel, and room
 * BACKEND ROUTE: GET /api/attendance?date=...&hostel=...&room=...
 */
export async function getAttendance(date, hostel) {
  await delay();
  return [...mockAttendanceRecords];
}

/**
 * Save / update attendance records in bulk
 * BACKEND ROUTE: POST /api/attendance/mark
 * Body: { date, hostel, records: [{ studentId, status: 'Present' | 'Absent' }] }
 */
export async function markAttendance(payload) {
  await delay();
  return { success: true, updatedCount: payload.records?.length || 0 };
}

/**
 * Verify student presence (Face + Geofence) and atomically mark attendance
 * BACKEND ROUTE: POST /api/attendance/verify-presence
 * Body: { studentId, liveImage, locationData, hostelSettings, ... }
 */
export async function verifyAttendancePresence(payload) {
  await delay(250);
  return await processAttendanceVerification(payload);
}

// ==========================================
// 7. LEAVE REQUESTS
// ==========================================

/**
 * Get leave requests (filtered by student or all for warden)
 * BACKEND ROUTE: GET /api/leave-requests
 */
export async function getLeaveRequests() {
  await delay();
  return [...mockLeaveRequests];
}

/**
 * Submit a student leave request
 * BACKEND ROUTE: POST /api/leave-requests
 * Body: { studentId, fromDate, toDate, reason, emergencyContact }
 */
export async function submitLeaveRequest(requestData) {
  await delay();
  const newRequest = {
    id: `LEV-${Math.floor(100 + Math.random() * 900)}`,
    status: 'Pending',
    appliedAt: new Date().toISOString().split('T')[0],
    remarks: '',
    ...requestData
  };
  return newRequest;
}

/**
 * Approve or reject leave request
 * BACKEND ROUTE: PATCH /api/leave-requests/:id/status
 * Body: { status: 'Approved' | 'Rejected', remarks }
 */
export async function reviewLeaveRequest(id, status, remarks = '') {
  await delay();
  return { success: true, id, status, remarks };
}

// ==========================================
// 8. VISITOR MANAGEMENT
// ==========================================

/**
 * Get visitor entries
 * BACKEND ROUTE: GET /api/visitors
 */
export async function getVisitors() {
  await delay();
  return [...mockVisitors];
}

/**
 * Register a new visitor
 * BACKEND ROUTE: POST /api/visitors
 * Body: { visitorName, relationship, phone, visitDate, visitTime, studentId }
 */
export async function registerVisitor(visitorData) {
  await delay();
  const newVisitor = {
    id: `VIS-${Math.floor(100 + Math.random() * 900)}`,
    status: 'Expected',
    ...visitorData
  };
  return newVisitor;
}

// ==========================================
// 9. FEES & REPORTS
// ==========================================

/**
 * Get student fee summary and breakdown
 * BACKEND ROUTE: GET /api/fees/student/:studentId
 */
export async function getStudentFees(studentId) {
  await delay();
  return { ...mockFeeDetails };
}

/**
 * Get aggregated analytics for Admin Dashboard
 * BACKEND ROUTE: GET /api/admin/analytics
 */
export async function getAdminAnalytics() {
  await delay();
  return { ...mockAdminStats };
}
