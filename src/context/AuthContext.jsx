import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser as apiLogin,
  logoutUser as apiLogout,
  registerStudentAccount as apiRegister,
  resetPasswordForEmail as apiResetPassword,
  updateStudentProfile as apiUpdateProfile,
  fetchStudentProfile as apiFetchProfile
} from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

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
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('dtil_hostel_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dtil_hostel_user');
    }
  }, [user]);

  // Synchronize and restore session from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseSession() {
      if (!isSupabaseConfigured()) {
        setAuthInitialized(true);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!error && session?.user && isMounted) {
          // Fetch fresh, full profile from Supabase
          const profile = await apiFetchProfile(session.user.id);
          if (profile) {
            setUser(profile);
          } else {
            // Fallback from session metadata if profile is not yet read
            setUser(prev => ({
              ...(prev || {}),
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              role: session.user.user_metadata?.role || 'student',
              studentId: session.user.user_metadata?.student_id || session.user.id
            }));
          }
        }
      } catch (err) {
        console.debug('Session check notice:', err.message);
      } finally {
        if (isMounted) setAuthInitialized(true);
      }
    }

    initSupabaseSession();

    // Listen to Supabase auth state changes (sign in, sign out, token refresh)
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const profile = await apiFetchProfile(session.user.id);
            if (profile && isMounted) {
              setUser(profile);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) setUser(null);
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => { isMounted = false; };
  }, []);

  /**
   * Register a new student account
   */
  const register = async (studentData) => {
    setLoading(true);
    try {
      const response = await apiRegister(studentData);
      if (response.user && response.session) {
        setUser(response.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in user
   */
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

  /**
   * Log out user
   */
  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
      localStorage.removeItem('dtil_hostel_user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request password reset
   */
  const resetPassword = async (email) => {
    return await apiResetPassword(email);
  };

  /**
   * Update current user profile
   */
  const updateProfile = async (updateData) => {
    if (!user?.id) throw new Error('No user is currently authenticated.');

    setLoading(true);
    try {
      const res = await apiUpdateProfile(user.id, updateData);
      // Immediately reflect updates in state
      setUser(prev => ({
        ...prev,
        ...updateData,
        phone: updateData.phone ?? prev.phone,
        emergencyContact: updateData.emergencyContact ?? prev.emergencyContact,
        address: updateData.address ?? prev.address
      }));
      return res;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick switch for demo presentation (Admin / Warden / Student)
   */
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
    register,
    login,
    logout,
    resetPassword,
    updateProfile,
    switchRole,
    loading,
    authInitialized,
    isSupabaseConnected: isSupabaseConfigured()
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
