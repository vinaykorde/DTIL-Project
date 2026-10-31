import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard component that protects role-specific dashboard views.
 * Ensures the user has an active Supabase session and matches the permitted role(s).
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, authInitialized, loading } = useAuth();
  const location = useLocation();

  // 1. Initial auth restoration phase
  if (!authInitialized || loading) {
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

  // 2. Unauthenticated check
  if (!user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect unauthorized user to their own permitted role dashboard
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
}
