import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Menu, Bell, RefreshCw, UserCheck, Shield } from 'lucide-react';
import Toast from '../common/Toast';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, switchRole } = useAuth();
  const { resetToMockData } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = async (e) => {
    const newRole = e.target.value;
    if (newRole !== role) {
      await switchRole(newRole);
      navigate(`/${newRole}/dashboard`);
    }
  };

  // Human friendly page title from pathname
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const page = parts[1].replace('-', ' ');
      return page.charAt(0).toUpperCase() + page.slice(1);
    }
    return 'Dashboard';
  };

  return (
    <div className="dashboard-wrapper">
      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header
          style={{
            height: 'var(--topbar-height)',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 80,
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-icon"
              style={{ display: 'none', color: 'var(--slate-700)' }}
              id="mobile-hamburger-btn"
              aria-label="Open navigation sidebar"
            >
              <Menu size={22} />
            </button>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                {role} Portal
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right: Quick Demo Controls & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Quick Demo Role Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--slate-100)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--slate-200)'
              }}
              title="Quickly preview as different roles for DTIL presentation"
            >
              <UserCheck size={16} color="var(--primary-600)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }} className="hide-on-mobile">
                Role:
              </span>
              <select
                value={role || 'student'}
                onChange={handleRoleSwitch}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--slate-800)',
                  cursor: 'pointer',
                  outline: 'none',
                  textTransform: 'capitalize'
                }}
              >
                <option value="admin">Admin</option>
                <option value="student">Student</option>
                <option value="warden">Warden</option>
              </select>
            </div>

            {/* Reset Demo Data helper */}
            <button
              onClick={resetToMockData}
              className="btn-icon"
              title="Reset mock data to fresh demo state"
              style={{ color: 'var(--slate-500)' }}
            >
              <RefreshCw size={17} />
            </button>

            {/* User Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              <div className="hide-on-mobile" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                  {role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      {/* Global Action Toasts */}
      <Toast />

      <style>{`
        @media (max-width: 1024px) {
          #mobile-hamburger-btn {
            display: inline-flex !important;
          }
        }
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
