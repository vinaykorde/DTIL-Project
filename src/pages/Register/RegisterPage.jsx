import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  GraduationCap,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Camera,
  RefreshCw,
  Video,
  Sparkles,
  ShieldAlert,
  Building
} from 'lucide-react';
import Button from '../../components/common/Button';
import { analyzeImageQuality, detectFacePresence, loadFaceApiModels } from '../../services/faceVerification';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1 = Details, 2 = Face Registration, 3 = Complete
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    department: 'Information Technology',
    year: '1st Year',
    hostel: 'Vikramshilla Boys Hostel',
    emergencyContact: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredStudent, setRegisteredStudent] = useState(null);

  // Biometric Face Registration States
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [referenceFacePhoto, setReferenceFacePhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceCheckStatus, setFaceCheckStatus] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Information Technology',
    'Computer Science & Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics',
    'Electronics & Telecommunication',
    'Artificial Intelligence & Data Science'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

  const hostels = [
    'Vikramshilla Boys Hostel',
    'Godavari Boys Hostel',
    'Ganga Girls Hostel',
    'Yamuna Girls Hostel',
    'Pending Allocation / To be assigned'
  ];

  // Pre-load biometric neural network models in background
  useEffect(() => {
    loadFaceApiModels()
      .then(loaded => setModelsReady(loaded))
      .catch(err => console.debug('Face models load info:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const isPasswordLongEnough = formData.password.length >= 6;

  // Camera Management
  const startCamera = async () => {
    setError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      setError('Unable to access camera. Please allow camera permissions in your browser to complete face enrollment.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (currentStep === 2 && !referenceFacePhoto) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep]);

  useEffect(() => {
    if (videoRef.current && streamRef.current && isCameraActive) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive, currentStep]);

  // Step 1 Validation -> Proceed to Face Registration
  const handleProceedToFaceEnrollment = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.studentId.trim()) {
      setError('Please provide your Student ID or college roll number.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address (e.g., student@college.edu).');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please provide your contact phone number.');
      return;
    }

    if (!formData.emergencyContact.trim()) {
      setError('Please provide an emergency contact number (parent/guardian).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    // Advance to Step 2: Biometric Face Registration
    setCurrentStep(2);
    setBiometricConsent(true);
  };

  // Face Capture & Quality Validation
  const handleCaptureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    setError('');

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 1. Image Quality Analysis (Lighting & Blur)
    const quality = analyzeImageQuality(canvas);
    if (!quality.valid) {
      setIsCapturing(false);
      setError(quality.message || 'Image quality check failed. Please ensure adequate lighting and hold still.');
      return;
    }

    // 2. Face Presence & Single Face Detection
    const presence = await detectFacePresence(canvas);
    if (presence.error) {
      setIsCapturing(false);
      setError(presence.message || 'Face detection check failed. Please position your face clearly in the camera frame.');
      return;
    }

    // 3. Save Captured Face Data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setReferenceFacePhoto(photoDataUrl);
    stopCamera();
    setIsCapturing(false);
    setFaceCheckStatus({
      valid: true,
      message: 'Face captured successfully and validated for biometric attendance enrollment.'
    });
  };

  const handleRetakeFace = () => {
    setReferenceFacePhoto(null);
    setFaceCheckStatus(null);
    setError('');
    startCamera();
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    setError('');
    setSuccessMessage('');

    if (!referenceFacePhoto) {
      setError('Please capture and enroll your facial reference photo before completing registration.');
      return;
    }

    if (!biometricConsent) {
      setError('Biometric consent is required to register your reference face photo.');
      return;
    }

    try {
      const result = await register({
        name: formData.name,
        studentId: formData.studentId,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        hostel: formData.hostel,
        emergencyContact: formData.emergencyContact,
        password: formData.password,
        referenceFacePhoto: referenceFacePhoto
      });

      setRegisteredStudent(result.user);
      setCurrentStep(3); // Success Screen
      setSuccessMessage('Student account and biometric face profile created successfully!');
    } catch (err) {
      setError(err.message || 'Account registration failed. Please check your details and try again.');
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
        padding: '2.5rem 1.25rem'
      }}
    >
      <div style={{ maxWidth: '580px', width: '100%' }}>
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
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
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
                  marginBottom: '0.75rem',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Building2 size={28} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {currentStep === 3 ? 'Registration Confirmed!' : 'Create Student Account'}
              </h1>
            </Link>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              {currentStep === 1 && 'Step 1 of 2: Personal, Residency & Login Details'}
              {currentStep === 2 && 'Step 2 of 2: Biometric Facial Reference Enrollment'}
              {currentStep === 3 && 'Your student resident account is active & synchronized'}
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          {currentStep < 3 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '0.6rem 1rem',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: currentStep >= 1 ? 'var(--primary-600)' : 'var(--slate-300)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentStep === 1 ? 'var(--primary-700)' : 'var(--slate-600)' }}>
                  Personal Details
                </span>
              </div>
              <div style={{ width: 30, height: 2, backgroundColor: currentStep > 1 ? 'var(--primary-600)' : 'var(--slate-200)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: currentStep === 2 ? 'var(--primary-600)' : 'var(--slate-300)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentStep === 2 ? 'var(--primary-700)' : 'var(--slate-500)' }}>
                  Face Enrollment
                </span>
              </div>
            </div>
          )}

          {/* Account Role Guard Banner */}
          {currentStep === 1 && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: '#065f46'
              }}
            >
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <span>
                <strong>Student Resident Portal:</strong> Registering automatically creates your account in Supabase Authentication and synchronizes your profile with the Admin and Warden dashboards.
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: 'var(--danger-50)',
                color: 'var(--danger-700)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fecaca',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && currentStep !== 3 && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #a7f3d0',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* STEP 1: PERSONAL & RESIDENCY DETAILS */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToFaceEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Full Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Your Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User
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
                    name="name"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Vinay Korde"
                    required
                  />
                </div>
              </div>

              {/* Student ID / Roll Number */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Student ID / College Roll No.</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Unique Identifier</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <GraduationCap
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
                    name="studentId"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="e.g. STU-2024-001"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
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
                    type="email"
                    name="email"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. student@college.edu"
                    required
                  />
                </div>
              </div>

              {/* Contact Phone & Emergency Contact in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Student Mobile Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone
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
                      type="tel"
                      name="phone"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Emergency Contact</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldAlert
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
                      type="tel"
                      name="emergencyContact"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="Parent/Guardian Phone"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Academic Department & Year in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Academic Year</label>
                  <select
                    name="year"
                    className="form-select"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hostel Selection */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Hostel Selection</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Building Allocation</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Building
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--slate-400)',
                      pointerEvents: 'none'
                    }}
                  />
                  <select
                    name="hostel"
                    className="form-select"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.hostel}
                    onChange={handleChange}
                  >
                    {hostels.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Password (min 6)</label>
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
                      name="password"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.2rem' }}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 chars"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Confirm Password</label>
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.2rem' }}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0
                      }}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Indicator */}
              {formData.password && formData.confirmPassword && (
                <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: passwordsMatch ? 'var(--success-600)' : 'var(--danger-600)' }}>
                  {passwordsMatch ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}

              {/* Continue to Face Registration */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={ArrowRight}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Continue to Face Registration
              </Button>
            </form>
          )}

          {/* STEP 2: BIOMETRIC FACE REGISTRATION */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Biometric Notice & Consent */}
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.82rem',
                  color: '#1e40af'
                }}
              >
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                      Hostel Facial Biometric Enrollment
                    </strong>
                    Your reference face photo will be used for daily 10:00 PM hostel night roll-call, GPS presence verification, and gate pass validation.
                  </div>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid #dbeafe',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#1e3a8a'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={biometricConsent}
                    onChange={(e) => setBiometricConsent(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <span>I authorize DTIL Hostel to securely store my facial reference photo for attendance verification.</span>
                </label>
              </div>

              {/* Hidden Canvas for Snapshot Capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Camera Preview / Frozen Photo Surface */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  backgroundColor: '#0f172a',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!referenceFacePhoto ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // Mirror for natural selfie view
                      }}
                    />

                    {/* Oval Face Positioning Guide Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '190px',
                        height: '240px',
                        border: '3px dashed rgba(255, 255, 255, 0.75)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: '12px'
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600
                        }}
                      >
                        Position Face Here
                      </span>
                    </div>

                    {!isCameraActive && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: '#1e293b',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          gap: '0.75rem',
                          padding: '1rem',
                          textAlign: 'center'
                        }}
                      >
                        <Camera size={36} color="var(--primary-400)" />
                        <span style={{ fontSize: '0.85rem' }}>Camera preview is loading...</span>
                        <Button size="sm" variant="secondary" onClick={startCamera}>
                          Enable Camera
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Captured Reference Photo Display */
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={referenceFacePhoto}
                      alt="Enrolled Reference"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <CheckCircle size={14} /> Face Enrolled
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {faceCheckStatus && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{faceCheckStatus.message}</span>
                </div>
              )}

              {/* Capture / Retake Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!referenceFacePhoto ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    icon={Camera}
                    loading={isCapturing}
                    disabled={!isCameraActive || !biometricConsent}
                    onClick={handleCaptureFace}
                    style={{ flex: 1 }}
                  >
                    Capture Reference Face
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    icon={RefreshCw}
                    onClick={handleRetakeFace}
                    style={{ flex: 1 }}
                  >
                    Retake Photo
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    stopCamera();
                    setCurrentStep(1);
                  }}
                >
                  Back
                </Button>
              </div>

              {/* Complete Registration Action */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                icon={Sparkles}
                loading={loading}
                disabled={!referenceFacePhoto || !biometricConsent}
                onClick={handleFinalSubmit}
                style={{
                  width: '100%',
                  backgroundColor: referenceFacePhoto ? '#059669' : undefined,
                  borderColor: referenceFacePhoto ? '#047857' : undefined
                }}
              >
                Complete Student Registration
              </Button>
            </div>
          )}

          {/* STEP 3: REGISTRATION COMPLETED CONFIRMATION */}
          {currentStep === 3 && registeredStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '2px solid #a7f3d0',
                  boxShadow: '0 8px 16px rgba(5, 150, 105, 0.15)'
                }}
              >
                <Check size={36} strokeWidth={3} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  Welcome to DTIL Hostel, {registeredStudent.name}!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.35rem' }}>
                  Your student account and facial biometric reference have been verified and saved to the database.
                </p>
              </div>

              {/* Student Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Student Roll ID:</span>
                  <strong style={{ color: 'var(--primary-700)' }}>{registeredStudent.studentId}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Registered Email:</span>
                  <span style={{ color: 'var(--slate-800)', fontWeight: 600 }}>{registeredStudent.email}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Hostel Building:</span>
                  <span style={{ color: 'var(--slate-800)', fontWeight: 600 }}>{registeredStudent.hostel}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Room & Bed:</span>
                  <span className="badge badge-warning">Pending Assignment</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Face Biometrics:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 700 }}>
                    <CheckCircle size={14} /> Enrolled for Roll-Call
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() => navigate('/student/dashboard')}
                  style={{ width: '100%' }}
                >
                  Enter Student Resident Portal
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  style={{ width: '100%' }}
                >
                  Return to Sign In Page
                </Button>
              </div>
            </div>
          )}

          {/* Divider */}
          {currentStep < 3 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.75rem 0',
                  color: 'var(--slate-300)'
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Already registered?
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              </div>

              {/* Sign In CTA Button */}
              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--slate-50)',
                  color: 'var(--slate-800)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--slate-100)';
                  e.currentTarget.style.borderColor = 'var(--slate-400)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                Sign in to your account <ArrowRight size={16} />
              </Link>
            </>
          )}

          {/* Return Home Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <Link to="/" style={{ color: 'var(--slate-600)', fontWeight: 600, textDecoration: 'none' }}>
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
