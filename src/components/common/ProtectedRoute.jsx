import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard component that protects role-specific dashboard views.
 * Ensures the user has an active session and matches the permitted role(s).
 * For link-only demonstration access (admin/warden), auto-provisions access seamlessly.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, authInitialized, loading, loginAsRole } = useAuth();
  const location = useLocation();

  // 1. Initial auth restoration phase
  // If user is already established, skip the waiting spinner immediately
  if ((!authInitialized || loading) && !user) {
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
          Authenticating session...
        </span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Active user / role resolution with localStorage fallback
  const activeUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('dtil_hostel_user') || 'null');
    } catch {
      return null;
    }
  })();
  const activeRole = activeUser?.role || role;

  // 3. Unauthenticated handling:
  // For demonstration admin and warden access, auto-provision and render immediately without redirects
  if (!activeUser || !activeRole) {
    if (allowedRoles?.includes('admin')) {
      loginAsRole('admin');
      return children;
    }
    if (allowedRoles?.includes('warden')) {
      loginAsRole('warden');
      return children;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    // Redirect unauthorized user to their own permitted role dashboard
    return <Navigate to={`/${activeRole}/dashboard`} replace />;
  }

  return children;
}


