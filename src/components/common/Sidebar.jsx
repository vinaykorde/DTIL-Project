import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Building,
  AlertTriangle,
  Receipt,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  User,
  CalendarCheck,
  PlaneTakeoff,
  Eye,
  ShieldCheck,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const currentRole = role;
    await logout();
    if (currentRole === 'admin') {
      navigate('/admin-access');
    } else if (currentRole === 'warden') {
      navigate('/warden-access');
    } else {
      navigate('/login');
    }
  };

  // Nav configurations for each role
  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Rooms', path: '/admin/rooms', icon: BedDouble },
    { label: 'Complaints', path: '/admin/complaints', icon: AlertTriangle },
    { label: 'Fees Management', path: '/admin/fees', icon: Receipt },
    { label: 'Notices', path: '/admin/notices', icon: Bell },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Profile', path: '/admin/profile', icon: User },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const studentNav = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/student/profile', icon: User },
    { label: 'My Room', path: '/student/my-room', icon: BedDouble },
    { label: 'Complaints', path: '/student/complaints', icon: AlertTriangle },
    { label: 'Notices', path: '/student/notices', icon: Bell },
    { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
    { label: 'Fees & Dues', path: '/student/fees', icon: Receipt },
    { label: 'Visitors', path: '/student/visitors', icon: Eye },
    { label: 'Leave Request', path: '/student/leave-request', icon: PlaneTakeoff }
  ];

  const wardenNav = [
    { label: 'Dashboard', path: '/warden/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/warden/students', icon: Users },
    { label: 'Rooms', path: '/warden/rooms', icon: BedDouble },
    { label: 'Attendance', path: '/warden/attendance', icon: CalendarCheck },
    { label: 'Complaints', path: '/warden/complaints', icon: AlertTriangle },
    { label: 'Leave Requests', path: '/warden/leave-requests', icon: PlaneTakeoff },
    { label: 'Visitors', path: '/warden/visitors', icon: Eye },
    { label: 'Notices', path: '/warden/notices', icon: Bell },
    { label: 'Reports', path: '/warden/reports', icon: BarChart3 },
    { label: 'Profile', path: '/warden/profile', icon: User }
  ];

  const navItems = role === 'admin' ? adminNav : role === 'warden' ? wardenNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 900
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#ffffff',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 950,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          transition: 'transform var(--transition-normal)',
          transform: isOpen ? 'translateX(0)' : undefined
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        {/* Header Branding */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                HostelSync
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {role ? `${role.toUpperCase()} PORTAL` : 'MANAGEMENT'}
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{ color: 'var(--slate-400)', display: 'none' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Mini Profile Badge */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: role === 'admin' ? '#3b82f6' : role === 'warden' ? '#10b981' : '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--slate-400)', textTransform: 'capitalize' }}>
              {role} {user?.room ? `• Room ${user.room}` : ''}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--slate-400)', padding: '0 0.75rem 0.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            Main Menu
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth <= 1024 && onClose) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#ffffff' : 'var(--slate-400)',
                      backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                      transition: 'all var(--transition-fast)'
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '1rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#f87171',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar-open {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
}
