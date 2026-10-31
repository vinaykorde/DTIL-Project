import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  BedDouble,
  Building,
  CalendarCheck,
  Receipt,
  AlertTriangle,
  Plus,
  Users,
  Bell,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  Camera, 
  MapPin, 
  Map, 
  Navigation,
  CheckCircle2, 
  XCircle, 
  RefreshCw
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { analyzeImageQuality, detectFacePresence, loadFaceApiModels } from '../../services/faceVerification';
import { getCurrentDeviceLocation, getRefinedDeviceLocation } from '../../services/geolocationService';

export default function StudentDashboard() {
  const { user, switchRole } = useAuth();
  const { complaints, notices, addComplaint, students, hostelSettings, verifyAndRecordPresence } = useData();
  const navigate = useNavigate();

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: 'Internet',
    subject: '',
    description: ''
  });

  // Presence Verification State & Retry Handling
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [presenceStep, setPresenceStep] = useState('CAPTURE'); // CAPTURE, PROCESSING, RESULT
  const [presenceResult, setPresenceResult] = useState(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [locationProgressMessage, setLocationProgressMessage] = useState(null);
  
  // Real-time verification checklist status for display
  const [stepIndicators, setStepIndicators] = useState({
    cameraReady: false,
    selfieCaptured: false,
    imageQuality: 'pending', // 'pending' | 'success' | 'failed'
    locationDetected: 'pending',
    accuracyCheck: 'pending',
    geofenceCheck: 'pending',
    faceVerification: 'pending',
    finalAttendance: 'pending'
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Pre-load biometric models in background when dashboard mounts
  useEffect(() => {
    loadFaceApiModels().catch(err => console.warn('Biometric model pre-load info:', err));
  }, []);

  const startPresenceCamera = async () => {
    setIsCameraReady(false);
    setIsPresenceModalOpen(true);
    setPresenceStep('CAPTURE');
    setPresenceResult(null);
    setStepIndicators({
      cameraReady: false,
      selfieCaptured: false,
      imageQuality: 'pending',
      locationDetected: 'pending',
      accuracyCheck: 'pending',
      geofenceCheck: 'pending',
      faceVerification: 'pending',
      finalAttendance: 'pending'
    });

    // Make sure models are loaded or loading
    loadFaceApiModels().catch(err => console.warn('Model load info on camera start:', err));

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPresenceResult({
        success: false,
        title: 'CAMERA UNAVAILABLE',
        errorCode: 'CAMERA_UNAVAILABLE',
        message: 'Camera permission is required or camera device is unavailable. Please enable camera access in your browser settings.',
        details: { failureStep: 'Camera Hardware' },
        indicators: { cameraReady: false, selfieCaptured: false, finalAttendance: 'failed' }
      });
      setPresenceStep('RESULT');
    }
  };
  
  const stopPresenceCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  };

  useEffect(() => {
    if (videoRef.current && stream && presenceStep === 'CAPTURE') {
      videoRef.current.srcObject = stream;
    }
  }, [stream, presenceStep]);

  const verifyPresence = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Verify video stream readiness
    if (video.readyState < 2 || video.videoWidth === 0) {
      setPresenceResult({
        success: false,
        title: 'CAMERA NOT READY',
        errorCode: 'CAMERA_NOT_READY',
        message: 'Camera stream is still initializing. Please hold steady and try again.',
        details: { failureStep: 'Camera Hardware' },
        indicators: { cameraReady: false, selfieCaptured: false, finalAttendance: 'failed' }
      });
      setPresenceStep('RESULT');
      return;
    }

    // 1. Capture live frame to canvas
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.90);

    stopPresenceCamera();
    setPresenceStep('PROCESSING');
    setStepIndicators(prev => ({ ...prev, selfieCaptured: true }));

    // 2. Perform Image Quality Analysis (Blur & Brightness)
    const qualityResult = analyzeImageQuality(canvas);
    if (!qualityResult.valid) {
      setStepIndicators(prev => ({ ...prev, imageQuality: 'failed' }));
      const qualityTitle = qualityResult.error === 'IMAGE_TOO_DARK' ? 'IMAGE TOO DARK'
        : qualityResult.error === 'IMAGE_TOO_BRIGHT' ? 'IMAGE TOO BRIGHT'
        : qualityResult.error === 'EMPTY_IMAGE' ? 'EMPTY CAMERA FRAME'
        : 'IMAGE BLURRY';

      setPresenceResult({
        success: false,
        title: qualityTitle,
        errorCode: qualityResult.error,
        message: qualityResult.message,
        details: {
          brightness: qualityResult.metrics?.brightness,
          blurScore: qualityResult.metrics?.blurScore,
          failureStep: 'Image Quality'
        },
        indicators: {
          cameraReady: true,
          selfieCaptured: true,
          imageQuality: 'failed',
          locationDetected: 'skipped',
          faceVerification: 'skipped',
          geofenceCheck: 'skipped',
          finalAttendance: 'failed'
        }
      });
      setPresenceStep('RESULT');
      return;
    }
    setStepIndicators(prev => ({ ...prev, imageQuality: 'success' }));

    // 3. Face Presence Check in Selfie
    const facePresence = await detectFacePresence(canvas);
    if (facePresence.error) {
      const faceTitle = facePresence.error === 'MULTIPLE_FACES_DETECTED'
        ? 'MULTIPLE FACES DETECTED'
        : 'NO FACE DETECTED';

      setPresenceResult({
        success: false,
        title: faceTitle,
        errorCode: facePresence.error,
        message: facePresence.message || (facePresence.error === 'MULTIPLE_FACES_DETECTED'
          ? `Multiple faces detected (${facePresence.faceCount}). Please ensure only you are visible in the photo.`
          : 'No face detected in the photo. Please center your face in the camera.'),
        details: {
          faceCount: facePresence.faceCount,
          failureStep: 'Face Presence Detection'
        },
        indicators: {
          cameraReady: true,
          selfieCaptured: true,
          imageQuality: 'success',
          faceDetected: false,
          faceVerification: 'failed',
          finalAttendance: 'failed'
        }
      });
      setPresenceStep('RESULT');
      return;
    }

    // 4. Retrieve Fresh Device Coordinates from Geolocation API with progressive accuracy refinement
    setStepIndicators(prev => ({ ...prev, locationDetected: 'processing' }));
    setLocationProgressMessage('Connecting to device GPS...');
    const maxAllowedAccuracy = hostelSettings?.maxAccuracy || 50;

    const locationResp = await getRefinedDeviceLocation({
      maxAccuracy: maxAllowedAccuracy,
      timeoutMs: 8000,
      onProgress: (status) => {
        setLocationProgressMessage(status.message);
      }
    });

    if (!locationResp.success) {
      setStepIndicators(prev => ({ ...prev, locationDetected: 'failed' }));
      setLocationProgressMessage(null);
      setPresenceResult({
        success: false,
        title: locationResp.error === 'PERMISSION_DENIED'
          ? 'LOCATION PERMISSION DENIED'
          : (locationResp.error === 'TIMEOUT' ? 'LOCATION REQUEST TIMED OUT' : 'LOCATION DETECTION FAILED'),
        errorCode: locationResp.error,
        message: locationResp.message,
        details: {
          locationError: locationResp.error,
          failureStep: 'Location Acquisition',
          failureReason: locationResp.message
        },
        indicators: {
          cameraReady: true,
          selfieCaptured: true,
          imageQuality: 'success',
          faceDetected: true,
          locationDetected: 'failed',
          accuracyCheck: 'failed',
          geofenceCheck: 'failed',
          faceVerification: 'skipped',
          finalAttendance: 'failed'
        }
      });
      setPresenceStep('RESULT');
      return;
    }

    setStepIndicators(prev => ({ ...prev, locationDetected: 'success' }));
    setLocationProgressMessage(null);

    // 5. Submit to Backend Verification Service for Final Atomic Validation
    const authenticatedStudentId = user?.id || 'STU-2024-001';
    const backendResult = await verifyAndRecordPresence({
      studentId: authenticatedStudentId,
      liveImage: photoDataUrl,
      locationData: {
        latitude: locationResp.coords.latitude,
        longitude: locationResp.coords.longitude,
        accuracy: locationResp.coords.accuracy,
        timestamp: locationResp.timestamp
      },
      currentUser: user
    });

    const isSuccess = backendResult.success;
    const presenceRec = backendResult.presenceRecord || {};

    let resultTitle = 'ATTENDANCE VERIFICATION FAILED';
    if (isSuccess) {
      resultTitle = backendResult.duplicate ? 'ATTENDANCE ALREADY RECORDED' : 'PRESENCE & ATTENDANCE VERIFIED';
    } else {
      if (backendResult.error === 'NO_REFERENCE_FACE') {
        resultTitle = 'REFERENCE PHOTO MISSING';
      } else if (backendResult.error === 'INVALID_REFERENCE_FACE') {
        resultTitle = 'INVALID REFERENCE PHOTO';
      } else if (backendResult.error === 'NO_FACE_DETECTED') {
        resultTitle = 'NO FACE DETECTED';
      } else if (backendResult.error === 'MULTIPLE_FACES_DETECTED') {
        resultTitle = 'MULTIPLE FACES DETECTED';
      } else if (backendResult.error === 'FACE_MISMATCH') {
        resultTitle = 'FACE VERIFICATION MISMATCH';
      } else if (backendResult.error === 'SERVICE_NOT_CONFIGURED' || backendResult.error === 'SERVICE_ERROR') {
        resultTitle = 'VERIFICATION SERVICE UNAVAILABLE';
      } else if (backendResult.error === 'POOR_ACCURACY' || backendResult.error === 'ACCURACY_TOO_LOW') {
        resultTitle = 'LOCATION ACCURACY INSUFFICIENT';
      } else if (backendResult.error === 'OUTSIDE_GEOFENCE') {
        resultTitle = 'OUTSIDE HOSTEL GEOFENCE';
      }
    }

    let faceMatchText = '✕ Failed';
    if (isSuccess || presenceRec.faceMatchStatus === 'VERIFIED') {
      faceMatchText = '✓ Verified';
    } else if (backendResult.error === 'NO_REFERENCE_FACE' || presenceRec.faceMatchStatus === 'NO_REFERENCE') {
      faceMatchText = '✕ Reference Missing';
    } else if (backendResult.error === 'INVALID_REFERENCE_FACE') {
      faceMatchText = '✕ Invalid Reference';
    } else if (backendResult.error === 'NO_FACE_DETECTED') {
      faceMatchText = '✕ No Face Detected';
    } else if (backendResult.error === 'MULTIPLE_FACES_DETECTED') {
      faceMatchText = '✕ Multiple Faces';
    } else if (backendResult.error === 'FACE_MISMATCH') {
      faceMatchText = '✕ Face Mismatch';
    } else if (backendResult.error === 'SERVICE_NOT_CONFIGURED' || presenceRec.faceMatchStatus === 'SERVICE_NOT_CONFIGURED') {
      faceMatchText = '✕ Service Unavailable';
    } else if (presenceRec.faceMatchStatus === 'SKIPPED') {
      faceMatchText = '○ Not Evaluated';
    }

    setPresenceResult({
      success: isSuccess,
      duplicate: backendResult.duplicate,
      title: resultTitle,
      errorCode: backendResult.error,
      message: backendResult.message,
      details: {
        studentName: user?.name || user?.email?.split('@')[0] || 'Student Resident',
        studentId: authenticatedStudentId,
        faceMatch: faceMatchText,
        locationStatus: presenceRec.locationStatus === 'INSIDE' ? 'Inside Hostel' : (presenceRec.locationStatus === 'ACCURACY_POOR' ? 'Accuracy Insufficient' : 'Outside Hostel'),
        distance: presenceRec.distanceFromHostel,
        accuracy: presenceRec.locationAccuracy,
        timestamp: presenceRec.timestamp || new Date().toISOString(),
        finalStatus: isSuccess ? 'Present' : 'Rejected',
        failureReason: presenceRec.failureReason || backendResult.message
      },
      indicators: {
        cameraReady: true,
        selfieCaptured: true,
        imageQuality: 'success',
        locationDetected: 'success',
        accuracyCheck: presenceRec.locationStatus === 'ACCURACY_POOR' ? 'failed' : 'success',
        geofenceCheck: presenceRec.locationStatus === 'INSIDE' ? 'success' : 'failed',
        faceVerification: (isSuccess || presenceRec.faceMatchStatus === 'VERIFIED') ? 'success' : (presenceRec.faceMatchStatus === 'SKIPPED' ? 'skipped' : 'failed'),
        finalAttendance: isSuccess ? 'success' : 'failed'
      }
    });

    setPresenceStep('RESULT');
  };

  const studentName = user?.name || user?.email?.split('@')[0] || 'Student Resident';
  const userInitials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const roomNumber = user?.room || 'Unallocated';
  const hostelName = user?.hostel || 'Awaiting Allocation';
  const bedName = user?.bed || 'Unallocated';
  const floor = roomNumber !== 'Unallocated' && !isNaN(parseInt(roomNumber[0])) ? `${roomNumber[0]}th Floor` : 'Floor Assigned Upon Allocation';
  const roomType = 'Double Sharing';
  const attendanceRate = user?.attendanceRate ?? 100;
  const pendingFees = user?.pendingFees ?? 0;

  // Student specific complaints
  const myComplaints = complaints.filter(
    c => (user?.id && c.studentId === user.id) ||
         (user?.studentId && c.studentId === user.studentId) ||
         c.studentName === studentName ||
         (roomNumber !== 'Unallocated' && c.room === roomNumber)
  );
  const openComplaintsCount = myComplaints.filter(c => c.status !== 'Resolved').length;

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();

    // AI Priority Determination
    const text = (complaintForm.subject + ' ' + complaintForm.description).toLowerCase();
    let determinedPriority = 'Medium';
    if (text.match(/\b(fire|emergency|urgent|immediate|sparking|short circuit|blood|danger|burst|severe)\b/)) {
      determinedPriority = 'Urgent';
    } else if (text.match(/\b(leak|broken|stuck|not working|no power|critical|fast|water|power|electricity)\b/)) {
      determinedPriority = 'High';
    } else if (text.match(/\b(cleaning|dustbin|sweep|dirty|slow|maintenance|upgrade)\b/)) {
      determinedPriority = 'Low';
    }

    await addComplaint({
      studentName,
      studentId: user?.id || 'STU-2024-001',
      room: roomNumber,
      hostel: hostelName,
      category: complaintForm.category,
      subject: complaintForm.subject,
      description: complaintForm.description,
      priority: determinedPriority
    });
    setIsComplaintModalOpen(false);
    setComplaintForm({
      category: 'Internet',
      subject: '',
      description: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, fontWeight: 700 }}>
            Student Resident Portal
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
            Welcome, {studentName}!
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            {hostelName} • {roomNumber === 'Unallocated' ? 'Room Pending Allocation' : `Room ${roomNumber}`} • {user?.department || 'Information Technology'} ({user?.year || '1st Year'})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="md"
            icon={MapPin}
            onClick={startPresenceCamera}
            style={{ backgroundColor: '#ffffff', color: '#047857', border: 'none' }}
          >
            Mark My Presence
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={() => setIsComplaintModalOpen(true)}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }}
          >
            Raise Complaint
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/student/leave-request')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Six Key Dashboard Cards */}
      <div className="grid-auto">
        <DashboardCard
          title="Room Number"
          value={roomNumber}
          icon={BedDouble}
          color="#2563eb"
          bgColor="#eff6ff"
          subtext={bedName === 'Unallocated' ? 'Awaiting Room Allocation' : `${bedName} (Allotted)`}
          onClick={() => navigate('/student/my-room')}
        />
        <DashboardCard
          title="Hostel Name"
          value={hostelName}
          icon={Building}
          color="#8b5cf6"
          bgColor="#faf5ff"
          subtext="Campus Housing"
        />
        <DashboardCard
          title="Room Type"
          value="Double"
          icon={Users}
          color="#06b6d4"
          bgColor="#f0fdfa"
          subtext="2-Person Occupancy"
        />
        <DashboardCard
          title="Attendance"
          value={`${attendanceRate}%`}
          icon={CalendarCheck}
          color="#10b981"
          bgColor="#ecfdf5"
          trend="Good standing"
          onClick={() => navigate('/student/attendance')}
        />
        <DashboardCard
          title="Pending Fees"
          value={pendingFees === 0 ? '₹ 0' : `₹ ${pendingFees}`}
          icon={Receipt}
          color="#10b981"
          bgColor="#ecfdf5"
          subtext={pendingFees === 0 ? 'All semester dues cleared' : 'Payment pending'}
          onClick={() => navigate('/student/fees')}
        />
        <DashboardCard
          title="Open Complaints"
          value={openComplaintsCount}
          icon={AlertTriangle}
          color={openComplaintsCount > 0 ? '#f59e0b' : '#10b981'}
          bgColor={openComplaintsCount > 0 ? '#fffbeb' : '#ecfdf5'}
          subtext={openComplaintsCount > 0 ? 'Under review' : 'No active tickets'}
          onClick={() => navigate('/student/complaints')}
        />
      </div>

      {/* "My Room" Section & Roommates */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BedDouble size={20} color="var(--primary-600)" />
                My Room Allotment
              </div>
              <div className="card-subtitle">
                {roomNumber === 'Unallocated' ? 'Allocation In Progress' : `Room ${roomNumber}, ${floor}`}
              </div>
            </div>
            <span className="badge badge-primary">Double Sharing</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Hostel</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{hostelName}</div>
            </div>
            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Floor</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{floor}</div>
            </div>
            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Assigned Bed</div>
              <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{bedName}</div>
            </div>
            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Amenities</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Wi-Fi, AC, Attached Bath</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.75rem' }}>
              Roommates in Room {roomNumber}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {userInitials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>{studentName} (You)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{bedName} • {user?.department || 'Department'} ({user?.year || '1st Year'})</div>
                  </div>
                </div>
                <span className="badge badge-success">You</span>
              </div>

              {roomNumber !== 'Unallocated' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--slate-200)', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                      AV
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>Aditya Verma</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Bed B • CSE 3rd Year</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>+91 91234 56781</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Complaints Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertTriangle size={20} color="var(--warning-600)" />
                My Complaints & Grievances
              </div>
              <div className="card-subtitle">Track status of raised issues</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setIsComplaintModalOpen(true)}
            >
              Raise Complaint
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myComplaints.length > 0 ? (
              myComplaints.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--slate-50)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      #{c.id} • {c.category}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                    {c.subject}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    {c.description}
                  </div>
                  {c.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-700)', marginTop: '0.4rem', fontWeight: 600 }}>
                      Warden Update: {c.notes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <AlertTriangle className="empty-state-icon" size={32} />
                <div className="empty-state-title">No complaints filed</div>
                <p style={{ fontSize: '0.85rem' }}>Have an issue with Wi-Fi, electricity, or plumbing? Click "Raise Complaint" above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notices Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Bell size={20} color="var(--primary-600)" />
              Hostel Notice Board
            </div>
            <div className="card-subtitle">Official announcements and maintenance circulars</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/notices')}>
            View All Notices
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {notices.slice(0, 3).map(n => (
            <div
              key={n.id}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--slate-50)',
                borderLeft: `4px solid ${n.priority === 'High' ? 'var(--danger-500)' : 'var(--primary-500)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{n.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{n.date}</span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.35rem' }}>
                {n.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                {n.description}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.75rem' }}>
                Posted by: {n.postedBy}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: RAISE COMPLAINT ================= */}
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Raise Maintenance Grievance"
      >
        <form onSubmit={handleComplaintSubmit}>
          <div className="form-group">
            <label className="form-label">Complaint Category *</label>
            <select
              className="form-select"
              value={complaintForm.category}
              onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
            >
              <option value="Electrical">Electrical (Fan, Lights, Switches)</option>
              <option value="Plumbing">Plumbing (Tap, Flush, Washroom)</option>
              <option value="Cleaning">Cleaning & Housekeeping</option>
              <option value="Internet">Internet / Wi-Fi Network</option>
              <option value="Food">Food & Mess Hygiene</option>
              <option value="Room">Room Furniture & Door Lock</option>
              <option value="Other">Other Issues</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text"
              className="form-input"
              value={complaintForm.subject}
              onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
              placeholder="e.g. Wi-Fi router keeps disconnecting after 8 PM"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              placeholder="Explain the issue clearly so maintenance technicians bring appropriate tools..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsComplaintModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>
      {/* ================= MODAL: PRESENCE VERIFICATION ================= */}
      <Modal
        isOpen={isPresenceModalOpen}
        onClose={() => {
          stopPresenceCamera();
          setIsPresenceModalOpen(false);
        }}
        title="HOSTEL PRESENCE VERIFICATION"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '300px' }}>
          
          {presenceStep === 'CAPTURE' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--slate-800)' }}>
                Step 1: Take Live Selfie
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.4 }}>
                Position your face directly in the frame with good lighting and look straight at the camera.
              </p>
              <div style={{ width: '100%', maxWidth: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--slate-900)', position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  onCanPlay={() => setIsCameraReady(true)}
                  style={{ width: '100%', display: 'block' }}
                ></video>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }}>
                  <Camera size={14} /> Camera: {isCameraReady ? '✓ Live Ready' : 'Initializing...'}
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                <Button variant="secondary" onClick={() => { stopPresenceCamera(); setIsPresenceModalOpen(false); }} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button variant="primary" icon={Camera} onClick={verifyPresence} disabled={!isCameraReady} style={{ flex: 1 }}>
                  {isCameraReady ? 'Capture & Continue' : 'Camera Initializing...'}
                </Button>
              </div>
            </div>
          )}

          {presenceStep === 'PROCESSING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
              <RefreshCw className="spin" size={42} color="var(--primary-600)" style={{ marginBottom: '1.25rem' }} />
              <div style={{ width: '100%', maxWidth: '380px', backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Verification Checklist
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>1. Camera Hardware:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>✓ Ready</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>2. Live Selfie:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>✓ Captured</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>3. Image Quality & Lighting:</span>
                  <span style={{ fontWeight: 600, color: stepIndicators.imageQuality === 'success' ? 'var(--success-600)' : 'var(--slate-400)' }}>
                    {stepIndicators.imageQuality === 'success' ? '✓ Passed' : 'Analyzing...'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>4. Device Location (GPS):</span>
                  <span style={{ fontWeight: 600, color: stepIndicators.locationDetected === 'success' ? 'var(--success-600)' : 'var(--primary-600)' }}>
                    {locationProgressMessage || (stepIndicators.locationDetected === 'success' ? '✓ Acquired' : 'Detecting...')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>5. Face Biometrics:</span>
                  <span style={{ fontWeight: 600, color: 'var(--slate-400)' }}>Verifying...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>6. Hostel Geofence:</span>
                  <span style={{ fontWeight: 600, color: 'var(--slate-400)' }}>Calculating...</span>
                </div>
              </div>
            </div>
          )}

          {presenceStep === 'RESULT' && presenceResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div style={{ 
                width: 60, height: 60, borderRadius: '50%', 
                backgroundColor: presenceResult.success ? 'var(--success-100)' : 'var(--danger-100)',
                color: presenceResult.success ? 'var(--success-600)' : 'var(--danger-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                {presenceResult.success ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: presenceResult.success ? 'var(--success-700)' : 'var(--danger-700)', textAlign: 'center', marginBottom: '0.35rem' }}>
                {presenceResult.success ? '✓ ' : '✕ '} {presenceResult.title}
              </h3>
              
              <p style={{ color: 'var(--slate-600)', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.4 }}>
                {presenceResult.message}
              </p>

              {/* Status Indicators Breakdown Checklist */}
              <div style={{ width: '100%', backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Verification Diagnostics
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Camera:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success-600)' }}>✓ Ready</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Selfie:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success-600)' }}>✓ Captured</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Face Match:</span>
                    <span style={{
                      fontWeight: 700,
                      color: (presenceResult.indicators?.faceVerification === 'success' || presenceResult.details?.faceMatch?.startsWith('✓'))
                        ? 'var(--success-600)'
                        : (presenceResult.details?.faceMatch?.startsWith('○') ? 'var(--slate-500)' : 'var(--danger-600)')
                    }}>
                      {presenceResult.details?.faceMatch || (presenceResult.indicators?.faceVerification === 'success' ? '✓ Verified' : '✕ Failed')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Location:</span>
                    <span style={{
                      fontWeight: 700,
                      color: presenceResult.indicators?.geofenceCheck === 'success' ? 'var(--success-600)' : 'var(--danger-600)'
                    }}>
                      {presenceResult.indicators?.geofenceCheck === 'success' ? '✓ Inside' : '✕ Outside / Failed'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>GPS Accuracy:</span>
                    <span style={{
                      fontWeight: 700,
                      color: presenceResult.indicators?.accuracyCheck === 'failed' ? 'var(--danger-600)' : 'var(--slate-800)'
                    }}>
                      {presenceResult.details?.accuracy !== undefined && presenceResult.details?.accuracy !== null ? `±${presenceResult.details.accuracy} m` : 'N/A'}
                      {presenceResult.indicators?.accuracyCheck === 'failed' && ' (Max allowed: 50 m)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Distance:</span>
                    <span style={{
                      fontWeight: 700,
                      color: presenceResult.indicators?.geofenceCheck === 'failed' ? 'var(--danger-600)' : 'var(--slate-800)'
                    }}>
                      {presenceResult.details?.distance !== undefined && presenceResult.details?.distance !== null
                        ? (presenceResult.details.distance > 1000
                            ? `${(presenceResult.details.distance / 1000).toFixed(2)} km`
                            : `${presenceResult.details.distance} m`)
                        : 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', paddingTop: '0.3rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Final Attendance Result:</span>
                    <span style={{
                      fontWeight: 800,
                      color: presenceResult.success ? 'var(--success-700)' : 'var(--danger-700)'
                    }}>
                      {presenceResult.success ? '✓ MARKED PRESENT' : '✕ NOT MARKED'}
                    </span>
                  </div>
                </div>

                {presenceResult.details?.failureReason && !presenceResult.success && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', backgroundColor: 'var(--danger-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-100)', color: 'var(--danger-800)', fontSize: '0.8rem' }}>
                    <strong>Details:</strong> {presenceResult.details.failureReason}
                  </div>
                )}
              </div>

              {/* Action Callout if Location Accuracy is Insufficient */}
              {(presenceResult.errorCode === 'POOR_ACCURACY' || presenceResult.indicators?.accuracyCheck === 'failed') && !presenceResult.success && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#1e40af' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📍 Location Signal Guidance</div>
                  <div style={{ lineHeight: 1.4 }}>
                    Your device reported GPS accuracy is <strong>±{presenceResult.details?.accuracy || 63} m</strong>, which exceeds the required <strong>50 m</strong> limit (your distance was {presenceResult.details?.distance || 38} m from hostel).
                    Please move near a window or step outdoors for direct sky visibility, then click <strong>Try Again</strong> to get a refined GPS reading.
                  </div>
                </div>
              )}

              {/* Action Callout if Face Mismatches */}
              {presenceResult.errorCode === 'FACE_MISMATCH' && !presenceResult.success && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#991b1b' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ Face Biometrics Advice</div>
                  <div style={{ lineHeight: 1.4 }}>
                    Your captured face does not match the registered student reference photo.
                    Please look directly at the camera in a well-lit area without headwear, glasses, or shadows. If your registered reference face photo is outdated or incorrect, please have the Warden update it.
                  </div>
                </div>
              )}

              {/* Action Callout if No Face Detected */}
              {presenceResult.errorCode === 'NO_FACE_DETECTED' && !presenceResult.success && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#92400e' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>💡 Face Positioning Guidance</div>
                  <div style={{ lineHeight: 1.4 }}>
                    No face was detected in the selfie. Please ensure you are facing the camera directly, center your face in the oval frame, and ensure the room is well lit.
                  </div>
                </div>
              )}

              {/* Action Callout if Multiple Faces Detected */}
              {presenceResult.errorCode === 'MULTIPLE_FACES_DETECTED' && !presenceResult.success && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#991b1b' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>👥 Multiple Faces Detected</div>
                  <div style={{ lineHeight: 1.4 }}>
                    Multiple faces were detected in the selfie. Only you should be in front of the camera when marking presence.
                  </div>
                </div>
              )}

              {/* Action Callout if Outside Geofence */}
              {presenceResult.errorCode === 'OUTSIDE_GEOFENCE' && !presenceResult.success && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#991b1b' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📍 Geofence Boundary Check</div>
                  <div style={{ lineHeight: 1.4 }}>
                    You are currently <strong>{presenceResult.details?.distance ? (presenceResult.details.distance > 1000 ? `${(presenceResult.details.distance / 1000).toFixed(2)} km` : `${presenceResult.details.distance} m`) : ''}</strong> away from the hostel. Presence verification is only permitted within the {hostelSettings?.radius || 100} m boundary.
                  </div>
                </div>
              )}

              {/* Action Callout if Reference Face is Missing */}
              {presenceResult.errorCode === 'NO_REFERENCE_FACE' && (
                <div style={{ width: '100%', marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: '#92400e' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📌 Action Required: Warden Face Enrollment</div>
                  <div style={{ lineHeight: 1.4, marginBottom: '0.65rem' }}>
                    Your trusted reference photo has not been enrolled by the Warden yet. A registered reference face is required for biometric presence verification.
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      stopPresenceCamera();
                      setIsPresenceModalOpen(false);
                      await switchRole('warden');
                      navigate('/warden/students');
                    }}
                    style={{ fontSize: '0.78rem', fontWeight: 700, borderColor: '#d97706', color: '#92400e' }}
                  >
                    Switch to Warden to Enroll Face Photo →
                  </Button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                {presenceResult.success ? (
                  <Button variant="primary" onClick={() => setIsPresenceModalOpen(false)} style={{ width: '100%' }}>
                    Done
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setIsPresenceModalOpen(false)} style={{ flex: 1 }}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={startPresenceCamera}
                      style={{ flex: 1 }}
                    >
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </Modal>

    </div>
  );
}
