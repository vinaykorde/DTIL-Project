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
} from '../data/mockData.js';
import { processAttendanceVerification } from './attendanceVerificationService.js';

// Simulated network delay helper
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// Local registered accounts store to persist multi-student accounts across refreshes/rate-limits
export function getRegisteredAccounts() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dtil_registered_accounts');
      return saved ? JSON.parse(saved) : [];
    }
  } catch (err) {
    console.debug('Registered accounts read notice:', err);
  }
  return globalThis.__dtil_registered_accounts || [];
}

export function saveRegisteredAccount(account) {
  try {
    const list = getRegisteredAccounts();
    const existingIdx = list.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIdx >= 0) {
      list[existingIdx] = account;
    } else {
      list.push(account);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dtil_registered_accounts', JSON.stringify(list));
    }
    globalThis.__dtil_registered_accounts = list;
  } catch (err) {
    console.debug('Registered accounts write notice:', err);
  }
}

/**
 * Register a new student account
 * Enforces:
 * - Public registration is STRICTLY for 'student' role. Never allows Admin or Warden.
 * - Email format and uniqueness check in Supabase profiles and local accounts.
 * - Unique Student ID check.
 * - Password length verification (min 6 chars).
 * - Collects department, academic year, hostel selection, emergency contact, and reference face photo.
 * - Saves in Supabase Auth, profiles table, and persistent resident directory.
 */
export async function registerStudentAccount({
  name,
  studentId,
  email,
  phone,
  password,
  department,
  year,
  hostel,
  emergencyContact,
  referenceFacePhoto
}) {
  if (!name || !studentId || !email || !password) {
    throw new Error('Please fill in all required registration fields.');
  }

  const cleanName = name.trim();
  const cleanStudentId = studentId.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = (phone || '').trim();
  const cleanDept = (department || 'Information Technology').trim();
  const cleanYear = (year || '1st Year').trim();
  const cleanHostel = (hostel || 'Pending Allocation / To be assigned').trim();
  const cleanEmergencyContact = (emergencyContact || '').trim();
  const cleanFacePhoto = referenceFacePhoto || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error(`"${cleanEmail}" is not a valid email address.`);
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Pre-check for duplicate in local persistent accounts registry
  const localAccounts = getRegisteredAccounts();
  const localEmailMatch = localAccounts.find(a => a.email?.toLowerCase() === cleanEmail);
  if (localEmailMatch) {
    throw new Error(`An account with email "${cleanEmail}" is already registered. Please sign in instead.`);
  }
  const localIdMatch = localAccounts.find(a => (a.user?.studentId || a.user?.id) === cleanStudentId);
  if (localIdMatch) {
    throw new Error(`Student ID "${cleanStudentId}" is already registered. Please check your roll number or contact administration.`);
  }

  // Pre-check existing dtil_students list in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const savedStudents = JSON.parse(localStorage.getItem('dtil_students') || '[]');
      const stuEmailMatch = savedStudents.find(s => s.email?.toLowerCase() === cleanEmail);
      if (stuEmailMatch) {
        throw new Error(`An account with email "${cleanEmail}" is already registered. Please sign in instead.`);
      }
      const stuIdMatch = savedStudents.find(s => (s.id || s.studentId) === cleanStudentId);
      if (stuIdMatch) {
        throw new Error(`Student ID "${cleanStudentId}" is already registered. Please check your roll number or contact administration.`);
      }
    }
  } catch (err) {
    if (err.message?.includes('already registered')) throw err;
  }

  let authUserId = null;
  let authSession = null;

  // 1. If Supabase is configured, check for duplicates and create account
  if (isSupabaseConfigured()) {
    try {
      // Pre-check for duplicate email or student ID in public.profiles
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('email, student_id')
        .or(`email.eq.${cleanEmail},student_id.eq.${cleanStudentId}`);

      if (!checkError && existing && existing.length > 0) {
        const emailMatch = existing.find(p => p.email?.toLowerCase() === cleanEmail);
        if (emailMatch) {
          throw new Error(`An account with email "${cleanEmail}" is already registered. Please sign in instead.`);
        }
        const idMatch = existing.find(p => p.student_id === cleanStudentId);
        if (idMatch) {
          throw new Error(`Student ID "${cleanStudentId}" is already registered. Please check your roll number or contact administration.`);
        }
      }
    } catch (err) {
      if (err.message?.includes('already registered')) {
        throw err;
      }
      console.warn('[Pre-Check Notice]:', err.message);
    }

    // Register via Supabase Authentication (Strictly student role)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            student_id: cleanStudentId,
            phone: cleanPhone,
            department: cleanDept,
            year: cleanYear,
            hostel: cleanHostel,
            emergency_contact: cleanEmergencyContact,
            reference_face_photo_path: cleanFacePhoto ? `faces/${cleanStudentId}.jpg` : null,
            role: 'student' // Strictly student; never admin or warden
          }
        }
      });

      if (!authError && authData?.user) {
        authUserId = authData.user.id;
        authSession = authData.session;
      } else if (authError) {
        console.warn('[Supabase Auth Notice]:', authError.message);
      }
    } catch (authException) {
      console.warn('[Supabase Auth Exception]:', authException.message);
    }
  }

  // Generate fallback unique user ID if offline or rate limit
  if (!authUserId) {
    authUserId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `stu-${Date.now().toString().slice(-6)}`;
  }

  // Determine normalized hostel string
  const isPendingHostel = !cleanHostel || cleanHostel.includes('Pending Allocation') || cleanHostel.includes('To be assigned') || cleanHostel === 'Awaiting Allocation';
  const displayHostel = isPendingHostel ? 'Pending Assignment' : cleanHostel;

  // Try upserting to Supabase public.profiles if client is connected
  if (isSupabaseConfigured()) {
    try {
      const profilePayload = {
        id: authUserId,
        email: cleanEmail,
        name: cleanName,
        student_id: cleanStudentId,
        phone: cleanPhone,
        department: cleanDept,
        year: cleanYear,
        hostel: displayHostel,
        emergency_contact: cleanEmergencyContact,
        reference_face_photo_path: cleanFacePhoto ? `faces/${cleanStudentId}.jpg` : null,
        role: 'student',
        status: isPendingHostel ? 'Pending Assignment' : 'Active',
        attendance_rate: 100,
        pending_fees: 0
      };

      await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });
    } catch (pErr) {
      console.debug('[Profile Upsert Notice]:', pErr.message);
    }
  }

  const studentUser = {
    id: cleanStudentId,
    authUserId: authUserId,
    studentId: cleanStudentId,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    department: cleanDept,
    year: cleanYear,
    hostel: displayHostel,
    room: 'Unallocated',
    bed: 'Unallocated',
    emergencyContact: cleanEmergencyContact,
    address: '',
    attendanceRate: 100,
    pendingFees: 0,
    role: 'student',
    status: isPendingHostel ? 'Pending Assignment' : 'Active',
    referenceFacePhoto: cleanFacePhoto,
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'Medium',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Looking'
  };

  // 1. Save in registered accounts repository
  saveRegisteredAccount({
    email: cleanEmail,
    password,
    user: studentUser
  });

  // 2. Synchronize directly into dtil_students in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const savedStudents = JSON.parse(localStorage.getItem('dtil_students') || '[]');
      const filtered = savedStudents.filter(s => s.id !== cleanStudentId && s.email?.toLowerCase() !== cleanEmail);
      localStorage.setItem('dtil_students', JSON.stringify([studentUser, ...filtered]));
    }
  } catch (err) {
    console.debug('Local students storage notice:', err);
  }

  // 3. Dispatch real-time cross-tab and in-tab synchronization event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dtil_student_registered', { detail: studentUser }));
  }

  return {
    success: true,
    user: studentUser,
    session: authSession || { access_token: `token-${authUserId}` },
    confirmationRequired: false
  };
}

/**
 * Fetch fresh student profile from Supabase profiles table
 */
export async function fetchStudentProfile(userId) {
  if (!userId) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${userId},student_id.eq.${userId}`)
        .maybeSingle();

      if (!error && profile) {
        return {
          id: profile.id,
          authUserId: profile.id,
          studentId: profile.student_id || profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          department: profile.department || 'Information Technology',
          year: profile.year || '1st Year',
          hostel: profile.hostel || (profile.hostel_id ? 'Assigned Hostel' : 'Awaiting Allocation'),
          room: profile.room || (profile.room_id ? 'Assigned Room' : 'Unallocated'),
          bed: profile.bed || 'Unallocated',
          emergencyContact: profile.emergency_contact || '',
          address: profile.address || '',
          attendanceRate: profile.attendance_rate ?? 100,
          pendingFees: profile.pending_fees ?? 0,
          role: profile.role || 'student',
          status: profile.status || 'Active',
          referenceFacePhoto: profile.reference_face_photo_path || null,
          sleepTime: profile.sleep_time || 'Early',
          studyTime: profile.study_time || 'Morning',
          cleanliness: profile.cleanliness || 'Medium',
          foodPreference: profile.food_preference || 'Vegetarian',
          lightPreference: profile.light_preference || 'Bright',
          roommateStatus: profile.roommate_status || 'Looking'
        };
      }
    } catch (err) {
      console.warn('[Fetch Profile Notice]:', err.message);
    }
  }

  // Check local accounts registry if not found in cloud table
  const localAccounts = getRegisteredAccounts();
  const matched = localAccounts.find(
    a => a.user?.id === userId || a.user?.studentId === userId || a.user?.authUserId === userId || a.email?.toLowerCase() === String(userId).toLowerCase()
  );
  if (matched?.user) {
    return matched.user;
  }

  // Also check dtil_students in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('dtil_students') || '[]');
      const found = saved.find(s => s.id === userId || s.studentId === userId || s.authUserId === userId || s.email?.toLowerCase() === String(userId).toLowerCase());
      if (found) return found;
    }
  } catch (e) {
    // Ignore localStorage read issue
  }

  return null;
}

/**
 * Update student profile personal details in Supabase
 * Enforces security: personal, emergency contact, address, and preferences can be modified.
 */
export async function updateStudentProfile(userId, updateFields) {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        phone: updateFields.phone || null,
        emergency_contact: updateFields.emergencyContact ?? updateFields.emergency_contact ?? null,
        address: updateFields.address || null,
        updated_at: new Date().toISOString()
      };

      if (updateFields.name) payload.name = updateFields.name;
      if (updateFields.sleepTime) payload.sleep_time = updateFields.sleepTime;
      if (updateFields.studyTime) payload.study_time = updateFields.studyTime;
      if (updateFields.cleanliness) payload.cleanliness = updateFields.cleanliness;
      if (updateFields.foodPreference) payload.food_preference = updateFields.foodPreference;
      if (updateFields.lightPreference) payload.light_preference = updateFields.lightPreference;
      if (updateFields.roommateStatus) payload.roommate_status = updateFields.roommateStatus;

      await supabase
        .from('profiles')
        .update(payload)
        .or(`id.eq.${userId},student_id.eq.${userId}`);
    } catch (err) {
      console.warn('[Profile Update Warning]:', err.message);
    }
  }

  // Update in local accounts registry
  const localAccounts = getRegisteredAccounts();
  const matched = localAccounts.find(a => a.user?.id === userId || a.user?.studentId === userId || a.user?.authUserId === userId);
  if (matched?.user) {
    matched.user = {
      ...matched.user,
      ...updateFields,
      phone: updateFields.phone ?? matched.user.phone,
      emergencyContact: updateFields.emergencyContact ?? updateFields.emergency_contact ?? matched.user.emergencyContact,
      address: updateFields.address ?? matched.user.address
    };
    saveRegisteredAccount(matched);
  }

  // Update in dtil_students in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('dtil_students') || '[]');
      const updated = saved.map(s => (s.id === userId || s.studentId === userId || s.authUserId === userId) ? { ...s, ...updateFields } : s);
      localStorage.setItem('dtil_students', JSON.stringify(updated));
    }
  } catch (e) {
    console.debug('dtil_students sync notice:', e);
  }

  // Update in dtil_hostel_user if currently logged in
  try {
    if (typeof localStorage !== 'undefined') {
      const curr = JSON.parse(localStorage.getItem('dtil_hostel_user') || 'null');
      if (curr && (curr.id === userId || curr.studentId === userId || curr.authUserId === userId)) {
        const updatedCurr = { ...curr, ...updateFields };
        localStorage.setItem('dtil_hostel_user', JSON.stringify(updatedCurr));
      }
    }
  } catch (e) {
    console.debug('dtil_hostel_user sync notice:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dtil_student_updated', { detail: { id: userId, ...updateFields } }));
  }

  await delay(100);
  return { success: true, profile: updateFields };
}

/**
 * Send password reset email via Supabase Auth
 */
export async function resetPasswordForEmail(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/login`
    });

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        throw new Error('Email rate limit reached on Supabase free tier. Please try again later.');
      }
      throw new Error(error.message || 'Failed to send password reset email.');
    }

    return {
      success: true,
      message: `Password reset instructions sent to ${cleanEmail}. Please check your inbox.`
    };
  }

  await delay(200);
  return {
    success: true,
    message: `Password reset link simulated for ${cleanEmail}. (Demo Mode)`
  };
}

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
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        // If profile row doesn't exist yet, insert it automatically
        if (!profile) {
          const initialProfile = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
            student_id: authData.user.user_metadata?.student_id || null,
            phone: authData.user.user_metadata?.phone || null,
            department: authData.user.user_metadata?.department || 'Information Technology',
            year: authData.user.user_metadata?.year || '1st Year',
            role: authData.user.user_metadata?.role || 'student',
            status: 'Active',
            attendance_rate: 100,
            pending_fees: 0
          };

          const { data: insertedProfile } = await supabase
            .from('profiles')
            .upsert(initialProfile)
            .select()
            .maybeSingle();

          profile = insertedProfile || initialProfile;
        }

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
          phone: profile?.phone || authData.user.user_metadata?.phone || '',
          department: profile?.department || authData.user.user_metadata?.department || 'Information Technology',
          year: profile?.year || authData.user.user_metadata?.year || '1st Year',
          hostel: profile?.hostel || (profile?.hostel_id ? 'Assigned Hostel' : 'Awaiting Hostel Allocation'),
          room: profile?.room || (profile?.room_id ? 'Assigned Room' : 'Unallocated'),
          bed: profile?.bed || 'Unallocated',
          emergencyContact: profile?.emergency_contact || '',
          address: profile?.address || '',
          attendanceRate: profile?.attendance_rate ?? 100,
          pendingFees: profile?.pending_fees ?? 0,
          referenceFacePhoto: profile?.reference_face_photo_path || null,
          status: profile?.status || 'Active',
          sleepTime: profile?.sleep_time || 'Early',
          studyTime: profile?.study_time || 'Morning',
          cleanliness: profile?.cleanliness || 'Medium',
          foodPreference: profile?.food_preference || 'Vegetarian',
          lightPreference: profile?.light_preference || 'Bright',
          roommateStatus: profile?.roommate_status || 'Looking'
        };

        return {
          token: authData.session?.access_token || 'supabase-session-token',
          user: userObj
        };
      } else if (authError) {
        // Check if user is in registered accounts
        const registered = getRegisteredAccounts().find(
          a => a.email.toLowerCase() === cleanEmail.toLowerCase() && a.password === password
        );
        if (registered) {
          const userRole = registered.user?.role || 'student';
          if (role && userRole !== role) {
            throw new Error(
              `Access Denied: Your account role is "${userRole}", but you are attempting to sign in to the "${role.toUpperCase()}" portal.`
            );
          }
          return {
            token: `token-${registered.user.id}`,
            user: registered.user
          };
        }

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
      if (err.message?.includes('Access Denied:')) {
        throw err;
      }

      const registered = getRegisteredAccounts().find(
        a => a.email.toLowerCase() === cleanEmail.toLowerCase() && a.password === password
      );
      if (registered) {
        const userRole = registered.user?.role || 'student';
        if (role && userRole !== role) {
          throw new Error(
            `Access Denied: Your account role is "${userRole}", but you are attempting to sign in to the "${role.toUpperCase()}" portal.`
          );
        }
        return {
          token: `token-${registered.user.id}`,
          user: registered.user
        };
      }

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
        hostel: 'Vikramshilla Boys Hostel',
        room: 'V-616',
        bed: 'Bed A',
        department: 'Information Technology',
        year: '2nd Year',
        phone: '1234567890',
        attendanceRate: 88,
        pendingFees: 0,
        emergencyContact: '+91 98220 11223 (Father)',
        address: 'Plot 42, Shivajinagar, Pune, Maharashtra - 411005'
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
 * When Supabase is configured, queries public.complaints table
 */
export async function getComplaints(filters = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(c => ({
          id: c.complaint_code || c.id,
          dbId: c.id,
          studentId: c.student_id,
          studentName: c.student_name || 'Student Resident',
          room: c.room_number || 'Room',
          hostel: c.hostel_name || 'Hostel',
          category: c.category,
          subject: c.subject,
          description: c.description,
          priority: c.priority,
          status: c.status,
          date: c.date,
          resolvedDate: c.resolved_date,
          notes: c.notes
        }));
      }
    } catch (err) {
      console.warn('[Supabase getComplaints Notice]:', err.message);
    }
  }

  await delay(80);
  return [...mockComplaints];
}

/**
 * Create a new complaint in Supabase
 */
export async function createComplaint(complaintData) {
  const complaintCode = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;

  if (isSupabaseConfigured() && complaintData.studentId && complaintData.studentId.length === 36 && complaintData.studentId.includes('-')) {
    try {
      const payload = {
        complaint_code: complaintCode,
        student_id: complaintData.studentId,
        room_number: complaintData.room || null,
        category: complaintData.category || 'Other',
        subject: complaintData.subject,
        description: complaintData.description,
        priority: complaintData.priority || 'Medium',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('complaints')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.complaint_code || data.id,
          dbId: data.id,
          studentId: data.student_id,
          studentName: complaintData.studentName,
          room: data.room_number || complaintData.room,
          hostel: complaintData.hostel,
          category: data.category,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          status: data.status,
          date: data.date,
          notes: data.notes
        };
      }
    } catch (err) {
      console.warn('[Supabase createComplaint Notice]:', err.message);
    }
  }

  await delay(100);
  const newComplaint = {
    id: complaintCode,
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
 */
export async function updateComplaintStatus(id, status, notes = '') {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('complaints')
        .update({
          status,
          notes,
          resolved_date: status === 'Resolved' ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString()
        })
        .or(`complaint_code.eq.${id},id.eq.${id}`);
    } catch (err) {
      console.warn('[Supabase updateComplaintStatus Notice]:', err.message);
    }
  }

  await delay(80);
  return { success: true, id, status, notes };
}

// ==========================================
// 5. NOTICES & ANNOUNCEMENTS
// ==========================================

/**
 * Get all active notices from Supabase
 */
export async function getNotices() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(n => ({
          id: n.notice_code || n.id,
          dbId: n.id,
          title: n.title,
          description: n.description,
          category: n.category,
          priority: n.priority,
          postedBy: n.posted_by,
          date: n.date,
          targetRole: n.target_role
        }));
      }
    } catch (err) {
      console.warn('[Supabase getNotices Notice]:', err.message);
    }
  }

  await delay(80);
  return [...mockNotices];
}

/**
 * Create a notice (Admin / Warden) in Supabase
 */
export async function createNotice(noticeData) {
  const noticeCode = `NOT-${Math.floor(100 + Math.random() * 900)}`;

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        notice_code: noticeCode,
        title: noticeData.title,
        description: noticeData.description,
        category: noticeData.category || 'General',
        priority: noticeData.priority || 'Medium',
        posted_by: noticeData.postedBy || 'Campus Administration',
        date: new Date().toISOString().split('T')[0],
        target_role: noticeData.targetRole || 'All'
      };

      const { data, error } = await supabase
        .from('notices')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.notice_code || data.id,
          dbId: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          postedBy: data.posted_by,
          date: data.date,
          targetRole: data.target_role
        };
      }
    } catch (err) {
      console.warn('[Supabase createNotice Notice]:', err.message);
    }
  }

  await delay(80);
  const newNotice = {
    id: noticeCode,
    date: new Date().toISOString().split('T')[0],
    ...noticeData
  };
  return newNotice;
}

/**
 * Delete a notice
 */
export async function deleteNotice(id) {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('notices')
        .delete()
        .or(`notice_code.eq.${id},id.eq.${id}`);
    } catch (err) {
      console.warn('[Supabase deleteNotice Notice]:', err.message);
    }
  }

  await delay(80);
  return { success: true, id };
}

// ==========================================
// 6. ATTENDANCE MANAGEMENT
// ==========================================

/**
 * Get attendance records from Supabase
 */
export async function getAttendance(date, hostel) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('attendance_records').select('*');
      if (date) query = query.eq('date', date);

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(a => ({
          id: a.id,
          studentId: a.student_id,
          date: a.date,
          status: a.status,
          markedBy: a.marked_by,
          room: a.room_number || 'Room'
        }));
      }
    } catch (err) {
      console.warn('[Supabase getAttendance Notice]:', err.message);
    }
  }

  await delay(80);
  return [...mockAttendanceRecords];
}

/**
 * Save / update attendance records in bulk
 */
export async function markAttendance(payload) {
  await delay(100);
  return { success: true, updatedCount: payload.records?.length || 0 };
}

/**
 * Verify student presence (Face + Geofence) and atomically mark attendance
 */
export async function verifyAttendancePresence(payload) {
  await delay(250);
  return await processAttendanceVerification(payload);
}

// ==========================================
// 7. LEAVE REQUESTS
// ==========================================

/**
 * Get leave requests from Supabase
 */
export async function getLeaveRequests() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(l => ({
          id: l.leave_code || l.id,
          dbId: l.id,
          studentId: l.student_id,
          studentName: l.student_name || 'Resident Student',
          fromDate: l.from_date,
          toDate: l.to_date,
          reason: l.reason,
          emergencyContact: l.emergency_contact,
          status: l.status,
          appliedAt: l.applied_at,
          remarks: l.remarks
        }));
      }
    } catch (err) {
      console.warn('[Supabase getLeaveRequests Notice]:', err.message);
    }
  }

  await delay(80);
  return [...mockLeaveRequests];
}

/**
 * Submit a student leave request in Supabase
 */
export async function submitLeaveRequest(requestData) {
  const leaveCode = `LEV-${Math.floor(100 + Math.random() * 900)}`;

  if (isSupabaseConfigured() && requestData.studentId && requestData.studentId.length === 36 && requestData.studentId.includes('-')) {
    try {
      const payload = {
        leave_code: leaveCode,
        student_id: requestData.studentId,
        from_date: requestData.fromDate,
        to_date: requestData.toDate,
        reason: requestData.reason,
        emergency_contact: requestData.emergencyContact,
        status: 'Pending',
        applied_at: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('leave_requests')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.leave_code || data.id,
          dbId: data.id,
          studentId: data.student_id,
          studentName: requestData.studentName,
          room: requestData.room,
          hostel: requestData.hostel,
          fromDate: data.from_date,
          toDate: data.to_date,
          reason: data.reason,
          emergencyContact: data.emergency_contact,
          status: data.status,
          appliedAt: data.applied_at,
          remarks: data.remarks
        };
      }
    } catch (err) {
      console.warn('[Supabase submitLeaveRequest Notice]:', err.message);
    }
  }

  await delay(100);
  const newRequest = {
    id: leaveCode,
    status: 'Pending',
    appliedAt: new Date().toISOString().split('T')[0],
    remarks: '',
    ...requestData
  };
  return newRequest;
}

/**
 * Approve or reject leave request
 */
export async function reviewLeaveRequest(id, status, remarks = '') {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('leave_requests')
        .update({
          status,
          remarks,
          updated_at: new Date().toISOString()
        })
        .or(`leave_code.eq.${id},id.eq.${id}`);
    } catch (err) {
      console.warn('[Supabase reviewLeaveRequest Notice]:', err.message);
    }
  }

  await delay(80);
  return { success: true, id, status, remarks };
}

// ==========================================
// 8. VISITOR MANAGEMENT
// ==========================================

/**
 * Get visitor entries from Supabase
 */
export async function getVisitors() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(v => ({
          id: v.visitor_code || v.id,
          dbId: v.id,
          studentId: v.student_id,
          visitorName: v.visitor_name,
          relationship: v.relationship,
          phone: v.phone,
          visitDate: v.visit_date,
          visitTime: v.visit_time,
          status: v.status,
          notes: v.notes
        }));
      }
    } catch (err) {
      console.warn('[Supabase getVisitors Notice]:', err.message);
    }
  }

  await delay(80);
  return [...mockVisitors];
}

/**
 * Register a new visitor in Supabase
 */
export async function registerVisitor(visitorData) {
  const visitorCode = `VIS-${Math.floor(100 + Math.random() * 900)}`;

  if (isSupabaseConfigured() && visitorData.studentId && visitorData.studentId.length === 36 && visitorData.studentId.includes('-')) {
    try {
      const payload = {
        visitor_code: visitorCode,
        student_id: visitorData.studentId,
        visitor_name: visitorData.visitorName,
        relationship: visitorData.relationship,
        phone: visitorData.phone,
        visit_date: visitorData.visitDate || new Date().toISOString().split('T')[0],
        visit_time: visitorData.visitTime,
        status: 'Expected',
        notes: visitorData.notes
      };

      const { data, error } = await supabase
        .from('visitors')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.visitor_code || data.id,
          dbId: data.id,
          studentId: data.student_id,
          studentName: visitorData.studentName,
          visitorName: data.visitor_name,
          relationship: data.relationship,
          phone: data.phone,
          visitDate: data.visit_date,
          visitTime: data.visit_time,
          status: data.status,
          notes: data.notes
        };
      }
    } catch (err) {
      console.warn('[Supabase registerVisitor Notice]:', err.message);
    }
  }

  await delay(100);
  const newVisitor = {
    id: visitorCode,
    status: 'Expected',
    ...visitorData
  };
  return newVisitor;
}

// ==========================================
// 9. FEES & REPORTS
// ==========================================

/**
 * Get student fee summary and breakdown from Supabase
 */
export async function getStudentFees(studentId) {
  if (isSupabaseConfigured() && studentId && studentId.length === 36 && studentId.includes('-')) {
    try {
      const { data, error } = await supabase
        .from('fee_records')
        .select('*')
        .eq('student_id', studentId);

      if (!error && Array.isArray(data) && data.length > 0) {
        const totalFees = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const paidItems = data.filter(item => item.status === 'Paid');
        const paidFees = paidItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const pendingFees = totalFees - paidFees;

        return {
          summary: {
            totalFees,
            paidFees,
            pendingFees,
            status: pendingFees === 0 ? 'Paid' : 'Pending'
          },
          breakdown: data.map(item => ({
            id: item.id,
            feeType: item.title,
            amount: Number(item.amount || 0),
            dueDate: item.due_date,
            status: item.status,
            receiptNo: item.receipt_no
          }))
        };
      }
    } catch (err) {
      console.warn('[Supabase getStudentFees Notice]:', err.message);
    }
  }

  await delay(80);
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
