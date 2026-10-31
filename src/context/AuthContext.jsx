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

export const DEMO_ADMIN_PROFILE = {
  id: 'ADM-001',
  authUserId: 'ADM-001',
  studentId: 'ADM-001',
  name: 'Prof. V. K. Deshpande',
  role: 'admin',
  email: 'admin@hostel.com',
  designation: 'Central Chief Warden & Director of Student Housing',
  department: 'Campus Administration',
  phone: '+91 98765 43210',
  status: 'Active'
};

export const DEMO_WARDEN_PROFILE = {
  id: 'W101',
  authUserId: 'W101',
  studentId: 'W101',
  name: 'Dr. Satish Sharma',
  role: 'warden',
  email: 'warden@hostel.com',
  hostel: 'Vikramshilla Boys Hostel',
  department: 'Mechanical Engineering Dept.',
  phone: '+91 98234 56789',
  designation: 'Resident Hostel Warden',
  status: 'Active'
};

function getInitialUser() {
  try {
    if (typeof window !== 'undefined') {
      const pathname = (window.location.pathname || '').toLowerCase();
      const isAdminPath = pathname.includes('admin-access') || pathname.includes('/admin');
      const isWardenPath = pathname.includes('warden-access') || pathname.includes('/warden');

      if (isAdminPath) {
        localStorage.setItem('dtil_hostel_user', JSON.stringify(DEMO_ADMIN_PROFILE));
        return DEMO_ADMIN_PROFILE;
      }
      if (isWardenPath) {
        localStorage.setItem('dtil_hostel_user', JSON.stringify(DEMO_WARDEN_PROFILE));
        return DEMO_WARDEN_PROFILE;
      }

      const saved = localStorage.getItem('dtil_hostel_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Prevent demo staff sessions from leaking into public student portals
        if (parsed.role === 'admin' || parsed.role === 'warden') {
          return null;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.debug('Error reading initial user:', e);
  }
  return null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(() => Boolean(getInitialUser()));

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
        } else if (!session?.user && isMounted) {
          // Preserve demonstration admin or warden session if active or requested
          const pathname = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
          const isAdminPath = pathname.includes('admin-access') || pathname.includes('/admin');
          const isWardenPath = pathname.includes('warden-access') || pathname.includes('/warden');

          if (isAdminPath) {
            setUser(DEMO_ADMIN_PROFILE);
            return;
          }
          if (isWardenPath) {
            setUser(DEMO_WARDEN_PROFILE);
            return;
          }

          const saved = localStorage.getItem('dtil_hostel_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && (parsed.role === 'admin' || parsed.role === 'warden')) {
                // If visitor is on public student routes, clear lingering demo staff sessions
                localStorage.removeItem('dtil_hostel_user');
                setUser(null);
                return;
              }
              if (parsed && parsed.role === 'student') {
                setUser(parsed);
                return;
              }
            } catch (e) {
              // ignore parse errors
            }
          }
          setUser(null);
          localStorage.removeItem('dtil_hostel_user');
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
          if (isMounted) {
            const saved = localStorage.getItem('dtil_hostel_user');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed?.role === 'admin' || parsed?.role === 'warden') {
                  return; // preserve demo session
                }
              } catch (e) {}
            }
            setUser(null);
            localStorage.removeItem('dtil_hostel_user');
          }
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
    } catch (e) {
      console.debug('Logout notice:', e.message);
    } finally {
      setUser(null);
      localStorage.removeItem('dtil_hostel_user');
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
   * Demonstration link-only access activator for Admin and Warden dashboards
   */
  const loginAsRole = (demoRole) => {
    if (demoRole === 'admin') {
      setUser(DEMO_ADMIN_PROFILE);
      setAuthInitialized(true);
      setLoading(false);
      localStorage.setItem('dtil_hostel_user', JSON.stringify(DEMO_ADMIN_PROFILE));
      return DEMO_ADMIN_PROFILE;
    } else if (demoRole === 'warden') {
      setUser(DEMO_WARDEN_PROFILE);
      setAuthInitialized(true);
      setLoading(false);
      localStorage.setItem('dtil_hostel_user', JSON.stringify(DEMO_WARDEN_PROFILE));
      return DEMO_WARDEN_PROFILE;
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    register,
    login,
    loginAsRole,
    logout,
    resetPassword,
    updateProfile,
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
