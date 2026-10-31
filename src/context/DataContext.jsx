import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  mockStudents,
  mockRooms,
  mockComplaints,
  mockNotices,
  mockLeaveRequests,
  mockVisitors,
  mockAttendanceRecords,
  mockHostelSettings,
  mockPresenceRecords
} from '../data/mockData';
import {
  createComplaint as apiCreateComplaint,
  updateComplaintStatus as apiUpdateComplaintStatus,
  submitLeaveRequest as apiSubmitLeave,
  reviewLeaveRequest as apiReviewLeave,
  createNotice as apiCreateNotice,
  deleteNotice as apiDeleteNotice,
  createRoom as apiCreateRoom,
  registerVisitor as apiRegisterVisitor,
  markAttendance as apiMarkAttendance,
  getComplaints,
  getNotices,
  getLeaveRequests,
  getVisitors,
  verifyAttendancePresence,
  getRegisteredAccounts,
  saveRegisteredAccount
} from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Helper to load from localStorage or default
  const loadState = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(`dtil_${key}`);
      if (!item) return defaultValue;
      const parsed = JSON.parse(item);
      // Migrate previous mock references
      const serialized = JSON.stringify(parsed)
        .replace(/Dr\.\s*R\.\s*Sharma/g, 'Dr. Satish Sharma')
        .replace(/Ramesh/g, 'Dinesh');
      return JSON.parse(serialized);
    } catch {
      return defaultValue;
    }
  };

  // Load students by merging local persistent store and initial mock dataset
  const getInitialStudents = () => {
    const base = loadState('students', mockStudents);
    const registered = getRegisteredAccounts().map(a => a.user).filter(Boolean);
    const existingIds = new Set(base.map(s => s.id));
    const existingEmails = new Set(base.map(s => s.email?.toLowerCase()));
    const toAdd = registered.filter(r => !existingIds.has(r.id) && !existingEmails.has(r.email?.toLowerCase()));
    return [...toAdd, ...base];
  };

  const [students, setStudents] = useState(getInitialStudents);
  const [rooms, setRooms] = useState(() => loadState('rooms', mockRooms));
  const [complaints, setComplaints] = useState(() => loadState('complaints', mockComplaints));
  const [notices, setNotices] = useState(() => loadState('notices', mockNotices));
  const [leaveRequests, setLeaveRequests] = useState(() => loadState('leave_requests', mockLeaveRequests));
  const [visitors, setVisitors] = useState(() => loadState('visitors', mockVisitors));
  const [attendance, setAttendance] = useState(() => loadState('attendance', mockAttendanceRecords));
  const [hostelSettings, setHostelSettings] = useState(() => loadState('hostel_settings', mockHostelSettings));
  const [presenceRecords, setPresenceRecords] = useState(() => loadState('presence_records', mockPresenceRecords));
  const [toastMessage, setToastMessage] = useState(null);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('dtil_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('dtil_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem('dtil_complaints', JSON.stringify(complaints)); }, [complaints]);
  useEffect(() => { localStorage.setItem('dtil_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('dtil_leave_requests', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('dtil_visitors', JSON.stringify(visitors)); }, [visitors]);
  useEffect(() => { localStorage.setItem('dtil_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('dtil_hostel_settings', JSON.stringify(hostelSettings)); }, [hostelSettings]);
  useEffect(() => { localStorage.setItem('dtil_presence_records', JSON.stringify(presenceRecords)); }, [presenceRecords]);

  // Comprehensive Student Directory Reload (Supabase + Local Registered Accounts + Directory)
  const reloadStudents = async () => {
    // 1. Registered accounts store
    const registeredList = getRegisteredAccounts().map(a => a.user).filter(Boolean);

    // 2. Fetch live profiles from Supabase if configured
    let supabaseStudents = [];
    if (isSupabaseConfigured()) {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (!error && Array.isArray(profiles) && profiles.length > 0) {
          supabaseStudents = profiles.map(p => ({
            id: p.student_id || p.id,
            authUserId: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone || '',
            department: p.department || 'Information Technology',
            year: p.year || '1st Year',
            hostel: p.hostel || (p.hostel_id ? 'Assigned Hostel' : 'Pending Assignment'),
            room: p.room || (p.room_id ? 'Assigned Room' : 'Unallocated'),
            bed: p.bed || 'Unallocated',
            status: p.status || 'Active',
            emergencyContact: p.emergency_contact || '',
            attendanceRate: p.attendance_rate ?? 100,
            pendingFees: p.pending_fees ?? 0,
            referenceFacePhoto: p.reference_face_photo_path || null
          }));
        }
      } catch (sErr) {
        console.debug('Supabase profiles query notice:', sErr.message);
      }
    }

    setStudents(prev => {
      const merged = [...prev];
      const indexMap = new Map();
      merged.forEach((s, idx) => {
        if (s.id) indexMap.set(s.id, idx);
        if (s.authUserId) indexMap.set(s.authUserId, idx);
        if (s.email) indexMap.set(s.email.toLowerCase(), idx);
      });

      // Merge registeredList (highest priority for new user registrations)
      registeredList.forEach(reg => {
        const key = reg.id || reg.studentId;
        const emailKey = reg.email?.toLowerCase();
        const targetIdx = indexMap.get(key) ?? (emailKey ? indexMap.get(emailKey) : undefined);
        const item = {
          id: reg.studentId || reg.id,
          authUserId: reg.authUserId || reg.id,
          name: reg.name,
          email: reg.email,
          phone: reg.phone || '',
          department: reg.department || 'Information Technology',
          year: reg.year || '1st Year',
          hostel: reg.hostel || 'Pending Assignment',
          room: reg.room || 'Unallocated',
          bed: reg.bed || 'Unallocated',
          status: reg.status || 'Active',
          emergencyContact: reg.emergencyContact || '',
          attendanceRate: reg.attendanceRate ?? 100,
          pendingFees: reg.pendingFees ?? 0,
          referenceFacePhoto: reg.referenceFacePhoto || null
        };

        if (targetIdx !== undefined) {
          merged[targetIdx] = { ...merged[targetIdx], ...item };
        } else {
          merged.unshift(item);
          indexMap.set(key, 0);
          if (emailKey) indexMap.set(emailKey, 0);
        }
      });

      // Merge supabaseStudents
      supabaseStudents.forEach(sup => {
        const key = sup.id;
        const emailKey = sup.email?.toLowerCase();
        const targetIdx = indexMap.get(key) ?? (emailKey ? indexMap.get(emailKey) : undefined);
        if (targetIdx !== undefined) {
          merged[targetIdx] = { ...merged[targetIdx], ...sup };
        } else {
          merged.unshift(sup);
          indexMap.set(key, 0);
          if (emailKey) indexMap.set(emailKey, 0);
        }
      });

      return merged;
    });
  };

  // Synchronize student records and activities from Supabase when connected
  useEffect(() => {
    let isMounted = true;

    // Initial student synchronization
    reloadStudents();

    // Listen to real-time events for instant student synchronization across tabs & components
    const handleSync = () => {
      if (isMounted) reloadStudents();
    };

    window.addEventListener('dtil_student_registered', handleSync);
    window.addEventListener('dtil_student_updated', handleSync);
    window.addEventListener('storage', handleSync);

    async function syncSupabaseData() {
      if (!isSupabaseConfigured()) return;
      try {
        // Hydrate live notices, complaints, leaves, and visitors from Supabase
        const [liveNotices, liveComplaints, liveLeaves, liveVisitors] = await Promise.all([
          getNotices().catch(() => null),
          getComplaints().catch(() => null),
          getLeaveRequests().catch(() => null),
          getVisitors().catch(() => null)
        ]);

        if (isMounted) {
          if (Array.isArray(liveNotices) && liveNotices.length > 0) {
            setNotices(prev => {
              const liveIds = new Set(liveNotices.map(n => n.id));
              const nonDuplicatePrev = prev.filter(p => !liveIds.has(p.id));
              return [...liveNotices, ...nonDuplicatePrev];
            });
          }
          if (Array.isArray(liveComplaints) && liveComplaints.length > 0) {
            setComplaints(prev => {
              const liveIds = new Set(liveComplaints.map(c => c.id));
              const nonDuplicatePrev = prev.filter(p => !liveIds.has(p.id));
              return [...liveComplaints, ...nonDuplicatePrev];
            });
          }
          if (Array.isArray(liveLeaves) && liveLeaves.length > 0) {
            setLeaveRequests(prev => {
              const liveIds = new Set(liveLeaves.map(l => l.id));
              const nonDuplicatePrev = prev.filter(p => !liveIds.has(p.id));
              return [...liveLeaves, ...nonDuplicatePrev];
            });
          }
          if (Array.isArray(liveVisitors) && liveVisitors.length > 0) {
            setVisitors(prev => {
              const liveIds = new Set(liveVisitors.map(v => v.id));
              const nonDuplicatePrev = prev.filter(p => !liveIds.has(p.id));
              return [...liveVisitors, ...nonDuplicatePrev];
            });
          }
        }
      } catch (err) {
        console.debug('Supabase sync note:', err.message);
      }
    }

    syncSupabaseData();
    return () => {
      isMounted = false;
      window.removeEventListener('dtil_student_registered', handleSync);
      window.removeEventListener('dtil_student_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Complaint actions
  const addComplaint = async (complaintData) => {
    const newComplaint = await apiCreateComplaint(complaintData);
    setComplaints(prev => [newComplaint, ...prev]);
    showToast(`Complaint #${newComplaint.id} registered successfully!`, 'success');
    return newComplaint;
  };

  const updateComplaintStatus = async (id, status, notes) => {
    await apiUpdateComplaintStatus(id, status, notes);
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, status, notes: notes || c.notes, resolvedDate: status === 'Resolved' ? new Date().toISOString().split('T')[0] : c.resolvedDate } : c))
    );
    showToast(`Complaint status updated to "${status}"`, 'info');
  };

  // Leave request actions
  const addLeaveRequest = async (requestData) => {
    const newRequest = await apiSubmitLeave(requestData);
    setLeaveRequests(prev => [newRequest, ...prev]);
    showToast('Leave request submitted successfully for Warden review!', 'success');
    return newRequest;
  };

  const updateLeaveStatus = async (id, status, remarks) => {
    await apiReviewLeave(id, status, remarks);
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status, remarks: remarks || l.remarks } : l))
    );
    showToast(`Leave request marked as "${status}"`, status === 'Approved' ? 'success' : 'warning');
  };

  // Notice actions
  const addNotice = async (noticeData) => {
    const newNotice = await apiCreateNotice(noticeData);
    setNotices(prev => [newNotice, ...prev]);
    showToast('Notice published successfully on the board!', 'success');
    return newNotice;
  };

  const deleteNotice = async (id) => {
    await apiDeleteNotice(id);
    setNotices(prev => prev.filter(n => n.id !== id));
    showToast('Notice removed from the board', 'info');
  };

  // Room actions
  const addRoom = async (roomData) => {
    const newRoom = await apiCreateRoom(roomData);
    setRooms(prev => [...prev, newRoom]);
    showToast(`Room ${newRoom.roomNumber} created in ${newRoom.hostel}!`, 'success');
    return newRoom;
  };

  // Student actions
  const addStudent = (studentData) => {
    const newStudent = {
      id: `STU-2024-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Active',
      attendanceRate: 100,
      pendingFees: 0,
      ...studentData
    };
    setStudents(prev => [newStudent, ...prev]);
    showToast(`Student ${newStudent.name} registered successfully!`, 'success');
  };

  const updateStudent = async (id, updatedData) => {
    // 1. Update React state
    setStudents(prev => prev.map(s => (s.id === id || s.authUserId === id ? { ...s, ...updatedData } : s)));

    // 2. Update dtil_students in localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('dtil_students') || '[]');
      const updatedList = saved.map(s => (s.id === id || s.authUserId === id ? { ...s, ...updatedData } : s));
      localStorage.setItem('dtil_students', JSON.stringify(updatedList));
    } catch (e) {
      console.debug('LocalStorage updateStudent notice:', e);
    }

    // 3. Update dtil_registered_accounts if present
    try {
      const accounts = getRegisteredAccounts();
      const matched = accounts.find(a => a.user?.id === id || a.user?.studentId === id || a.user?.authUserId === id || a.email?.toLowerCase() === updatedData.email?.toLowerCase());
      if (matched && matched.user) {
        matched.user = { ...matched.user, ...updatedData };
        saveRegisteredAccount(matched);
      }
    } catch (e) {
      console.debug('Registered account update notice:', e);
    }

    // 4. Update currently logged in student profile if matching
    try {
      const curr = JSON.parse(localStorage.getItem('dtil_hostel_user') || 'null');
      if (curr && (curr.id === id || curr.studentId === id || curr.authUserId === id || curr.email?.toLowerCase() === updatedData.email?.toLowerCase())) {
        const mergedUser = { ...curr, ...updatedData };
        localStorage.setItem('dtil_hostel_user', JSON.stringify(mergedUser));
      }
    } catch (e) {
      console.debug('Current user update notice:', e);
    }

    // 5. Try updating Supabase profiles table if connected
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('profiles')
          .update({
            hostel: updatedData.hostel,
            room: updatedData.room,
            bed: updatedData.bed,
            status: updatedData.status,
            phone: updatedData.phone,
            emergency_contact: updatedData.emergencyContact,
            updated_at: new Date().toISOString()
          })
          .or(`student_id.eq.${id},id.eq.${id}`);
      } catch (err) {
        console.debug('Supabase profile update notice:', err.message);
      }
    }

    // 6. Notify all open views across application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dtil_student_updated', { detail: { id, ...updatedData } }));
    }
    showToast(`Student record updated successfully`, 'success');
  };

  const addStudentAccounts = (newAccounts) => {
    if (!Array.isArray(newAccounts) || newAccounts.length === 0) return;
    const formatted = newAccounts.map(acc => ({
      id: acc.studentId || acc.student_id || acc.id || `STU-2024-${Math.floor(100 + Math.random() * 900)}`,
      authUserId: acc.userId || acc.authUserId || null,
      name: acc.name,
      email: acc.email,
      phone: acc.phone || '',
      department: acc.department || 'Information Technology',
      year: acc.year || '1st Year',
      hostel: acc.hostel || 'Vikramshilla Boys Hostel',
      room: acc.room || '201',
      bed: acc.bed || 'Bed A',
      status: acc.status || 'Active',
      attendanceRate: 100,
      pendingFees: 0,
      referenceFacePhoto: null
    }));

    setStudents(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const existingEmails = new Set(prev.map(s => s.email?.toLowerCase()));
      const uniqueNew = formatted.filter(f => !existingIds.has(f.id) && !existingEmails.has(f.email?.toLowerCase()));
      return [...uniqueNew, ...prev];
    });

    showToast(`Added ${newAccounts.length} new student account(s) to directory.`, 'success');
  };

  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast(`Student record deleted`, 'warning');
  };

  // Visitor actions
  const addVisitor = async (visitorData) => {
    const newVisitor = await apiRegisterVisitor(visitorData);
    setVisitors(prev => [newVisitor, ...prev]);
    showToast(`Visitor ${newVisitor.visitorName} logged successfully!`, 'success');
    return newVisitor;
  };

  // Attendance actions
  const recordAttendance = async (payload) => {
    await apiMarkAttendance(payload);
    // Merge or update records
    setAttendance(prev => {
      const recordsMap = new Map();
      prev.forEach(r => recordsMap.set(`${r.studentId}_${r.date}`, r));
      payload.records.forEach(r => {
        recordsMap.set(`${r.studentId}_${payload.date}`, {
          ...r,
          date: payload.date,
          hostel: payload.hostel
        });
      });
      return Array.from(recordsMap.values());
    });
    showToast(`Attendance saved for ${payload.records.length} students.`, 'success');
  };

  // Presence and Settings actions
  const addPresenceRecord = (record) => {
    const newRecord = {
      id: `PR-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...record
    };
    setPresenceRecords(prev => [newRecord, ...prev]);
    showToast('Presence verification saved.', record.verificationStatus === 'PRESENT' ? 'success' : 'warning');
    return newRecord;
  };

  const verifyAndRecordPresence = async ({ studentId, liveImage, locationData, currentUser }) => {
    const result = await verifyAttendancePresence({
      studentId,
      liveImage,
      locationData,
      hostelSettings,
      students,
      attendanceRecords: attendance,
      currentUser
    });

    if (result.presenceRecord) {
      setPresenceRecords(prev => [result.presenceRecord, ...prev]);
    }

    if (result.success && result.attendanceRecord && !result.duplicate) {
      setAttendance(prev => {
        const dateStr = result.attendanceRecord.date;
        const recStudentId = result.attendanceRecord.studentId || studentId;
        const filtered = prev.filter(a => !(a.studentId === recStudentId && a.date === dateStr));
        return [result.attendanceRecord, ...filtered];
      });
      showToast('Attendance verified and marked successfully!', 'success');

      // Attempt to save to Supabase attendance tables
      if (isSupabaseConfigured()) {
        const stuObj = students.find(s => s.id === studentId || s.studentId === studentId || s.authUserId === studentId);
        const studentUuid = stuObj?.authUserId || (studentId && studentId.includes('-') && studentId.length === 36 ? studentId : null);
        if (studentUuid) {
          try {
            supabase.from('attendance_records').upsert({
              student_id: studentUuid,
              room_number: result.attendanceRecord.room || 'General',
              date: result.attendanceRecord.date,
              status: 'Present',
              marked_by: 'SYSTEM_VERIFIED'
            }, { onConflict: 'student_id,date' }).then(({ error }) => {
              if (error) console.debug('Supabase attendance sync notice:', error.message);
            });

            if (result.presenceRecord) {
              supabase.from('presence_records').insert({
                student_id: studentUuid,
                latitude: result.presenceRecord.latitude,
                longitude: result.presenceRecord.longitude,
                location_accuracy: result.presenceRecord.locationAccuracy,
                distance_from_hostel: result.presenceRecord.distanceFromHostel,
                face_match_status: result.presenceRecord.faceMatchStatus,
                location_status: result.presenceRecord.locationStatus,
                verification_status: result.presenceRecord.verificationStatus,
                failure_reason: result.presenceRecord.failureReason
              }).then(({ error }) => {
                if (error) console.debug('Supabase presence sync notice:', error.message);
              });
            }
          } catch (err) {
            console.debug('Supabase attendance write notice:', err.message);
          }
        }
      }
    } else if (result.success && result.duplicate) {
      showToast('Attendance was already marked for today.', 'info');
    } else {
      showToast(result.message || 'Verification failed.', 'warning');
    }

    return result;
  };

  const updateHostelSettings = (newSettings) => {
    setHostelSettings(prev => ({
      ...prev,
      ...newSettings,
      latitude: Number(newSettings.latitude !== undefined ? newSettings.latitude : prev.latitude),
      longitude: Number(newSettings.longitude !== undefined ? newSettings.longitude : prev.longitude),
      radius: Number(newSettings.radius !== undefined ? newSettings.radius : prev.radius),
      maxAccuracy: Number(newSettings.maxAccuracy !== undefined ? newSettings.maxAccuracy : prev.maxAccuracy)
    }));
    showToast('Hostel location settings updated.', 'success');
  };

  // Reset to initial mock dataset
  const resetToMockData = () => {
    setStudents(mockStudents);
    setRooms(mockRooms);
    setComplaints(mockComplaints);
    setNotices(mockNotices);
    setLeaveRequests(mockLeaveRequests);
    setVisitors(mockVisitors);
    setAttendance(mockAttendanceRecords);
    setHostelSettings(mockHostelSettings);
    setPresenceRecords(mockPresenceRecords);
    showToast('System data reset to initial mock dataset.', 'info');
  };

  const value = {
    students,
    reloadStudents,
    rooms,
    complaints,
    notices,
    leaveRequests,
    visitors,
    attendance,
    hostelSettings,
    presenceRecords,
    toastMessage,
    showToast,
    addComplaint,
    updateComplaintStatus,
    addLeaveRequest,
    updateLeaveStatus,
    addNotice,
    deleteNotice,
    addRoom,
    addStudent,
    addStudentAccounts,
    updateStudent,
    deleteStudent,
    addVisitor,
    recordAttendance,
    addPresenceRecord,
    verifyAndRecordPresence,
    updateHostelSettings,
    resetToMockData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
