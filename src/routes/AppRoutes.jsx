import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminStudents from '../pages/admin/Students';
import AdminRooms from '../pages/admin/Rooms';
import AdminComplaints from '../pages/admin/Complaints';
import AdminFees from '../pages/admin/Fees';
import AdminNotices from '../pages/admin/Notices';
import AdminReports from '../pages/admin/Reports';
import AdminSettings from '../pages/admin/Settings';
import AdminProfile from '../pages/admin/Profile';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/Profile';
import StudentMyRoom from '../pages/student/MyRoom';
import StudentComplaints from '../pages/student/Complaints';
import StudentAttendance from '../pages/student/Attendance';
import StudentFees from '../pages/student/Fees';
import StudentNotices from '../pages/student/Notices';
import StudentLeaveRequest from '../pages/student/LeaveRequest';
import StudentVisitors from '../pages/student/Visitors';

// Warden Pages
import WardenDashboard from '../pages/warden/WardenDashboard';
import WardenStudents from '../pages/warden/Students';
import WardenRooms from '../pages/warden/Rooms';
import WardenAttendance from '../pages/warden/Attendance';
import WardenComplaints from '../pages/warden/Complaints';
import WardenLeaveRequests from '../pages/warden/LeaveRequests';
import WardenVisitors from '../pages/warden/Visitors';
import WardenNotices from '../pages/warden/Notices';
import WardenReports from '../pages/warden/Reports';
import WardenProfile from '../pages/warden/Profile';

/**
 * Direct demonstration access handler for Admin & Warden dashboards.
 * Immediately activates the requested role session and navigates directly
 * to the dashboard without showing a login form or asking for credentials.
 */
function DirectAccessHandler({ role, target }) {
  const { loginAsRole } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    loginAsRole(role);
    navigate(target, { replace: true });
  }, [role, target, loginAsRole, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--slate-50, #f8fafc)',
        gap: '1rem',
        fontFamily: 'var(--font-sans, sans-serif)'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--slate-200, #e2e8f0)',
          borderTopColor: 'var(--primary-600, #2563eb)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <span style={{ color: 'var(--slate-600, #475569)', fontSize: '0.875rem', fontWeight: 600 }}>
        Opening {role.toUpperCase()} Dashboard...
      </span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Public Student Login & Registration */}
      <Route path="/login" element={<LoginPage fixedRole="student" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/signup" element={<RegisterPage />} />

      {/* Direct Demonstration Access Routes */}
      <Route
        path="/admin-access"
        element={<DirectAccessHandler role="admin" target="/admin/dashboard" />}
      />
      <Route
        path="/warden-access"
        element={<DirectAccessHandler role="warden" target="/warden/dashboard" />}
      />

      {/* Admin Portal (Strictly Admin only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Student Portal (Strictly Student only) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="my-room" element={<StudentMyRoom />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="leave-request" element={<StudentLeaveRequest />} />
        <Route path="visitors" element={<StudentVisitors />} />
      </Route>

      {/* Warden Portal (Strictly Warden only) */}
      <Route
        path="/warden"
        element={
          <ProtectedRoute allowedRoles={['warden']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/warden/dashboard" replace />} />
        <Route path="dashboard" element={<WardenDashboard />} />
        <Route path="students" element={<WardenStudents />} />
        <Route path="rooms" element={<WardenRooms />} />
        <Route path="attendance" element={<WardenAttendance />} />
        <Route path="complaints" element={<WardenComplaints />} />
        <Route path="leave-requests" element={<WardenLeaveRequests />} />
        <Route path="visitors" element={<WardenVisitors />} />
        <Route path="notices" element={<WardenNotices />} />
        <Route path="reports" element={<WardenReports />} />
        <Route path="profile" element={<WardenProfile />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
