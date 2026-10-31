import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  GraduationCap,
  Building,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Mail,
  Check,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' | 'student' | 'warden'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [error, setError] = useState('');

  const { login, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail);
      setForgotMessage(res.message || 'Password reset instructions sent. Please check your inbox.');
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const roles = [
    {
      id: 'admin',
      title: 'ADMIN',
      icon: ShieldCheck,
      description: 'Manage the complete hostel system',
      badge: 'Full Access',
      defaultEmail: 'admin@hostel.com',
      color: '#2563eb',
      bgLight: '#eff6ff'
    },
    {
      id: 'student',
      title: 'STUDENT',
      icon: GraduationCap,
      description: 'Access your hostel information and services',
      badge: 'Resident Access',
      defaultEmail: 'student@hostel.com',
      color: '#059669',
      bgLight: '#ecfdf5'
    },
    {
      id: 'warden',
      title: 'WARDEN',
      icon: Building,
      description: 'Manage hostel activities and student issues',
      badge: 'Hostel Supervisor',
      defaultEmail: 'warden@hostel.com',
      color: '#d97706',
      bgLight: '#fffbeb'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    // Pre-populate with demo email for easy evaluation
    const roleObj = roles.find(r => r.id === roleId);
    if (roleObj) {
      setEmail(roleObj.defaultEmail);
      setPassword('demo123');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email / username and password.');
      return;
    }

    try {
      await login(email, password, selectedRole);
      // Navigate to respective dashboard
      navigate(`/${selectedRole}/dashboard`);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem'
      }}
    >
      <div
        style={{
          maxWidth: selectedRole ? '480px' : '860px',
          width: '100%',
          transition: 'max-width 300ms ease'
        }}
      >
        {/* Card Surface */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-600)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Building size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Hostel Management System
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              College Student Housing • DTIL Academic Project
            </p>
          </div>

          {/* ================= STEP 1: ROLE SELECTION ================= */}
          {!selectedRole ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Select Your Portal Role
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  Choose your respective responsibility to continue to authentication
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.5rem'
                }}
              >
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      style={{
                        border: '2px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.75rem 1.25rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        position: 'relative',
                        backgroundColor: '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = r.color;
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: r.bgLight,
                          color: r.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1rem'
                        }}
                      >
                        <Icon size={28} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {r.title}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                        {r.description}
                      </p>
                      <div style={{ marginTop: '1rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: r.bgLight,
                            color: r.color,
                            border: `1px solid ${r.color}33`,
                            fontWeight: 700
                          }}
                        >
                          Select Role →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* New Student Registration Banner */}
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px dashed var(--primary-300)',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                    New Student Resident?
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.15rem' }}>
                    Create your personal hostel student account in less than 2 minutes
                  </div>
                </div>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <UserPlus size={16} /> Register as Student
                </Link>
              </div>

              {/* Demo Notice */}
              <div
                style={{
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--slate-600)'
                }}
              >
                <Sparkles size={16} color="var(--primary-600)" />
                <span>Presentation Mode active: Click any card to preview the full role workflow.</span>
              </div>
            </div>
          ) : (
            /* ================= STEP 2: LOGIN FORM ================= */
            <div>
              {/* Top Banner with "Change Role" */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--slate-50)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Logging in as:</span>
                  <span
                    style={{
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: roles.find(r => r.id === selectedRole)?.color
                    }}
                  >
                    {selectedRole}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--primary-600)',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={14} /> Change Role
                </button>
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--danger-50)',
                    color: 'var(--danger-700)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecaca',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                {/* Email Input */}
                <div className="form-group">
                  <label className="form-label">Email / Username</label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-400)'
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@hostel.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Input with Show/Hide */}
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-400)'
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer'
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--primary-600)' }}
                    />
                    <span style={{ color: 'var(--slate-700)' }}>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotMessage('');
                      setForgotError('');
                      setForgotModalOpen(true);
                    }}
                    style={{ color: 'var(--primary-600)', fontWeight: 600 }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  style={{ width: '100%' }}
                >
                  Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </Button>

                {/* Amazon-style Account Creation CTA for Students */}
                {selectedRole === 'student' && (
                  <>
                    <div style={{ position: 'relative', textAlign: 'center', margin: '1.75rem 0 1rem' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: 'var(--border-subtle)'
                        }}
                      />
                      <span
                        style={{
                          position: 'relative',
                          backgroundColor: '#ffffff',
                          padding: '0 0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--slate-500)',
                          fontWeight: 600
                        }}
                      >
                        New to HostelSync?
                      </span>
                    </div>

                    <Link
                      to="/register"
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <UserPlus size={16} /> Create your Student Account
                    </Link>
                  </>
                )}

                {/* Quick Demo Credentials Reminder */}
                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.775rem',
                    color: 'var(--slate-600)'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--slate-800)' }}>
                    Demo Credentials (pre-loaded):
                  </div>
                  <div>Email: <strong>{roles.find(r => r.id === selectedRole)?.defaultEmail}</strong></div>
                  <div>Password: <strong>demo123</strong> (any password works)</div>
                </div>
              </form>
            </div>
          )}

          {/* Forgot Password Modal */}
          <Modal
            isOpen={forgotModalOpen}
            onClose={() => setForgotModalOpen(false)}
            title="Reset Your Password"
          >
            <form onSubmit={handleForgotSubmit}>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Enter your registered student or staff email address. We will send a secure password recovery link to your inbox.
              </p>

              {forgotError && (
                <div
                  style={{
                    backgroundColor: 'var(--danger-50)',
                    color: 'var(--danger-700)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecaca',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={16} /> {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div
                  style={{
                    backgroundColor: 'var(--success-50)',
                    color: 'var(--success-700)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle2 size={16} /> {forgotMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--slate-400)'
                    }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@college.edu"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={forgotLoading}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          </Modal>

          {/* Footer Navigation Link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            <a href="/" style={{ color: 'var(--slate-600)', fontWeight: 600 }}>
              ← Return to Landing Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
