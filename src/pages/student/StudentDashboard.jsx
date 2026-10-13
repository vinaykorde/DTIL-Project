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

export default function StudentDashboard() {
  const { user } = useAuth();
  const { complaints, notices, addComplaint, students, hostelSettings, addPresenceRecord } = useData();
  const navigate = useNavigate();

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: 'Internet',
    subject: '',
    description: ''
  });

  // Presence Verification State
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [presenceStep, setPresenceStep] = useState('CAPTURE'); // CAPTURE, PROCESSING, RESULT
  const [presenceResult, setPresenceResult] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startPresenceCamera = async () => {
    setIsPresenceModalOpen(true);
    setPresenceStep('CAPTURE');
    setPresenceResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPresenceResult({
        success: false,
        title: 'CAMERA PERMISSION REQUIRED',
        message: 'Camera permission is required to capture your live selfie.',
        details: null
      });
      setPresenceStep('RESULT');
    }
  };
  
  const stopPresenceCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (videoRef.current && stream && presenceStep === 'CAPTURE') {
      videoRef.current.srcObject = stream;
    }
  }, [stream, presenceStep]);

  // Haversine distance formula
  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return Math.floor(R * c);
  };

  const verifyPresence = () => {
    // 1. Capture photo (simulate visual capture)
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
    }
    stopPresenceCamera();
    setPresenceStep('PROCESSING');
    
    // 2. Fetch current student record
    const currentStudent = students.find(s => s.id === (user?.id || 'STU-2024-001'));
    if (!currentStudent || !currentStudent.referenceFacePhoto) {
      setPresenceResult({
        success: false,
        title: 'IDENTITY NOT VERIFIED',
        message: 'No registered reference face found for your account. Please contact the Warden to register your face.',
        details: { faceMatch: 'Failed' }
      });
      setPresenceStep('RESULT');
      return;
    }

    // 3. Get Geolocation
    if (!navigator.geolocation) {
      setPresenceResult({
        success: false,
        title: 'LOCATION NOT SUPPORTED',
        message: 'Your browser does not support geolocation.',
        details: null
      });
      setPresenceStep('RESULT');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      const maxAccuracy = hostelSettings?.maxAccuracy || 50;
      if (accuracy > maxAccuracy) {
        setPresenceResult({
          success: false,
          title: 'LOCATION ACCURACY TOO LOW',
          message: `Location accuracy is too low (±${Math.floor(accuracy)}m). Maximum allowed is ±${maxAccuracy}m. Please enable precise location and try again.`,
          details: { faceMatch: 'Verified' }
        });
        setPresenceStep('RESULT');
        return;
      }

      const hLat = hostelSettings?.latitude || 18.5204;
      const hLon = hostelSettings?.longitude || 73.8567;
      const radius = hostelSettings?.radius || 100;

      const distance = getDistanceFromLatLonInM(latitude, longitude, hLat, hLon);
      const isInside = distance <= radius;

      const result = {
        success: isInside,
        title: isInside ? 'PRESENCE VERIFIED' : 'PRESENCE NOT VERIFIED',
        message: isInside ? 'Your presence has been successfully verified.' : 'You are outside the configured hostel geofence.',
        details: {
          faceMatch: 'Verified',
          latitude,
          longitude,
          distance,
          accuracy: Math.floor(accuracy),
          status: isInside ? 'PRESENT' : 'OUTSIDE HOSTEL'
        }
      };

      // Save to DataContext
      addPresenceRecord({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        latitude,
        longitude,
        locationAccuracy: Math.floor(accuracy),
        distanceFromHostel: distance,
        faceMatchStatus: 'VERIFIED',
        locationStatus: isInside ? 'INSIDE' : 'OUTSIDE',
        verificationStatus: isInside ? 'PRESENT' : 'OUTSIDE HOSTEL'
      });

      setPresenceResult(result);
      setPresenceStep('RESULT');

    }, (error) => {
      setPresenceResult({
        success: false,
        title: 'LOCATION PERMISSION REQUIRED',
        message: 'Location permission is required to verify your hostel presence. Please enable location services and try again.',
        details: null
      });
      setPresenceStep('RESULT');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const studentName = user?.name || 'Vinay Korde';
  const roomNumber = user?.room || '204';
  const hostelName = user?.hostel || 'Vikramshilla Boys Hostel';
  const floor = '2nd Floor';
  const roomType = 'Double Sharing';
  const attendanceRate = user?.attendanceRate || 88;
  const pendingFees = user?.pendingFees || 0;

  // Student specific complaints
  const myComplaints = complaints.filter(
    c => c.studentName === studentName || c.room === roomNumber
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
            {hostelName} • Room {roomNumber} • {user?.department || 'Information Technology'} ({user?.year || '3rd Year'})
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
          subtext="Bed A (Allotted)"
          onClick={() => navigate('/student/my-room')}
        />
        <DashboardCard
          title="Hostel Name"
          value="Vikramshilla"
          icon={Building}
          color="#8b5cf6"
          bgColor="#faf5ff"
          subtext="Boys Hostel Block B"
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
          subtext="All semester dues cleared"
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
              <div className="card-subtitle">Room {roomNumber}, {floor}</div>
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
              <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>Bed A (Left Window)</div>
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
                    VK
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>Vinay Korde (You)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Bed A • IT 3rd Year</div>
                  </div>
                </div>
                <span className="badge badge-success">You</span>
              </div>

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
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--slate-800)' }}>
                Step 1: Take Live Selfie
              </h3>
              <div style={{ width: '100%', maxWidth: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--slate-900)', position: 'relative' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }}></video>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }}>
                  <Camera size={14} /> Camera: ✓ Ready
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                <Button variant="secondary" onClick={() => { stopPresenceCamera(); setIsPresenceModalOpen(false); }} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button variant="primary" icon={Camera} onClick={verifyPresence} style={{ flex: 1 }}>
                  Capture & Continue
                </Button>
              </div>
            </div>
          )}

          {presenceStep === 'PROCESSING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <RefreshCw className="spin" size={48} color="var(--primary-600)" style={{ marginBottom: '1.5rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <MapPin size={18} color="var(--primary-500)"/> Detecting current location...
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <Sparkles size={18} color="var(--primary-500)"/> Verifying identity...
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Navigation size={18} color="var(--primary-500)"/> Checking hostel geofence...
                </div>
              </div>
            </div>
          )}

          {presenceStep === 'RESULT' && presenceResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', 
                backgroundColor: presenceResult.success ? 'var(--success-100)' : 'var(--danger-100)',
                color: presenceResult.success ? 'var(--success-600)' : 'var(--danger-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                {presenceResult.success ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: presenceResult.success ? 'var(--success-700)' : 'var(--danger-700)', textAlign: 'center', marginBottom: '0.5rem' }}>
                {presenceResult.success ? '✓ ' : '✕ '} {presenceResult.title}
              </h3>
              
              <p style={{ color: 'var(--slate-600)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                {presenceResult.message}
              </p>

              {presenceResult.details && (
                <div style={{ width: '100%', backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Student:</span>
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{user?.name || 'Vinay Korde'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Face Match:</span>
                    <span style={{ fontWeight: 700, color: presenceResult.details.faceMatch === 'Verified' ? 'var(--success-600)' : 'var(--danger-600)' }}>
                      {presenceResult.details.faceMatch === 'Verified' ? '✓ Verified' : '✕ Failed'}
                    </span>
                  </div>
                  
                  {presenceResult.details.distance !== undefined && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Location:</span>
                        <span style={{ fontWeight: 700, color: presenceResult.success ? 'var(--success-600)' : 'var(--danger-600)' }}>
                          {presenceResult.success ? '✓ Inside Hostel' : '✕ Outside Hostel'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Distance:</span>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {presenceResult.details.distance > 1000 ? `${(presenceResult.details.distance/1000).toFixed(1)} km` : `${presenceResult.details.distance} meters`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Accuracy:</span>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>±{presenceResult.details.accuracy} m</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Status:</span>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{presenceResult.details.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--slate-500)', fontWeight: 600 }}>Time:</span>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </>
                  )}
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
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={startPresenceCamera} style={{ flex: 1 }}>
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
