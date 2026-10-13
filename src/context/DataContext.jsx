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
  markAttendance as apiMarkAttendance
} from '../services/api';

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

  const [students, setStudents] = useState(() => loadState('students', mockStudents));
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

  const updateStudent = (id, updatedData) => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...updatedData } : s)));
    showToast(`Student record updated successfully`, 'success');
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

  const updateHostelSettings = (newSettings) => {
    setHostelSettings(prev => ({ ...prev, ...newSettings }));
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
    updateStudent,
    deleteStudent,
    addVisitor,
    recordAttendance,
    addPresenceRecord,
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
