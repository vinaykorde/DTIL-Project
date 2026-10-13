import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as apiLogin, logoutUser as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dtil_hostel_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'warden' && parsed.name?.includes('Sharma')) {
          parsed.name = 'Dr. Satish Sharma';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('dtil_hostel_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dtil_hostel_user');
    }
  }, [user]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const response = await apiLogin(email, password, role);
      setUser(response.user);
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  // Quick switch for demo presentation
  const switchRole = async (newRole) => {
    const defaultEmails = {
      admin: 'admin@hostel.com',
      warden: 'warden@hostel.com',
      student: 'student@hostel.com'
    };
    return await login(defaultEmails[newRole] || 'demo@hostel.com', 'demo123', newRole);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    login,
    logout,
    switchRole,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
