import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { fetchStudentProfile } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Building,
  BedDouble,
  Edit2,
  GraduationCap,
  MapPin,
  ShieldAlert,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useData();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Editable fields form state
  const [formData, setFormData] = useState({
    phone: '',
    emergencyContact: '',
    address: '',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'High',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Looking'
  });

  // Sync profile state with auth user
  useEffect(() => {
    setProfile(user);
  }, [user]);

  // Load fresh profile on mount or when user.id changes
  useEffect(() => {
    let isMounted = true;

    async function loadFreshProfile() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const remoteProfile = await fetchStudentProfile(user.id);
        if (remoteProfile && isMounted) {
          setProfile(remoteProfile);
          setFormData({
            phone: remoteProfile.phone || user?.phone || '',
            emergencyContact: remoteProfile.emergencyContact || user?.emergencyContact || '',
            address: remoteProfile.address || user?.address || '',
            sleepTime: remoteProfile.sleepTime || user?.sleepTime || 'Early',
            studyTime: remoteProfile.studyTime || user?.studyTime || 'Morning',
            cleanliness: remoteProfile.cleanliness || user?.cleanliness || 'High',
            foodPreference: remoteProfile.foodPreference || user?.foodPreference || 'Vegetarian',
            lightPreference: remoteProfile.lightPreference || user?.lightPreference || 'Bright',
            roommateStatus: remoteProfile.roommateStatus || user?.roommateStatus || 'Looking'
          });
        }
      } catch (err) {
        console.warn('Failed to load fresh profile:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (user) {
      setFormData({
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || '',
        address: user.address || '',
        sleepTime: user.sleepTime || 'Early',
        studyTime: user.studyTime || 'Morning',
        cleanliness: user.cleanliness || 'High',
        foodPreference: user.foodPreference || 'Vegetarian',
        lightPreference: user.lightPreference || 'Bright',
        roommateStatus: user.roommateStatus || 'Looking'
      });
      loadFreshProfile();
    }

    return () => { isMounted = false; };
  }, [user?.id]);

  // Real-time synchronization when Admin or Warden updates student room/bed/hostel
  useEffect(() => {
    const handleStudentUpdated = async (e) => {
      const detail = e.detail;
      if (!user?.id) return;
      const uid = user.id;
      const sRoll = user.studentId || user.student_id;
      if (
        detail?.id === uid ||
        detail?.id === sRoll ||
        (user.email && detail?.updates?.email === user.email)
      ) {
        try {
          const fresh = await fetchStudentProfile(uid);
          if (fresh) {
            setProfile(fresh);
          } else if (detail?.updates) {
            setProfile(prev => ({ ...(prev || {}), ...detail.updates }));
          }
        } catch {
          if (detail?.updates) {
            setProfile(prev => ({ ...(prev || {}), ...detail.updates }));
          }
        }
      }
    };

    window.addEventListener('dtil_student_updated', handleStudentUpdated);
    return () => window.removeEventListener('dtil_student_updated', handleStudentUpdated);
  }, [user?.id, user?.studentId, user?.email]);

  const handleOpenEdit = () => {
    setSaveError('');
    setFormData({
      phone: user?.phone || '',
      emergencyContact: user?.emergencyContact || '',
      address: user?.address || '',
      sleepTime: user?.sleepTime || 'Early',
      studyTime: user?.studyTime || 'Morning',
      cleanliness: user?.cleanliness || 'High',
      foodPreference: user?.foodPreference || 'Vegetarian',
      lightPreference: user?.lightPreference || 'Bright',
      roommateStatus: user?.roommateStatus || 'Looking'
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveLoading(true);

    try {
      await updateProfile(formData);
      setIsEditOpen(false);
      if (showToast) {
        showToast('Profile information permanently saved.', 'success');
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const activeUser = profile || user;
  const studentName = activeUser?.name || activeUser?.email?.split('@')[0] || 'Student Resident';
  const studentInitial = studentName.charAt(0).toUpperCase();
  const studentId = activeUser?.studentId || activeUser?.student_id || activeUser?.id || 'Pending Allocation';
  const studentEmail = activeUser?.email || 'N/A';
  const studentPhone = activeUser?.phone || 'Not provided';
  const studentDept = activeUser?.department || 'Information Technology';
  const studentYear = activeUser?.year || '1st Year';
  const studentHostel = activeUser?.hostel || 'Pending Assignment';
  const studentRoom = activeUser?.room || 'Unallocated';
  const studentBed = activeUser?.bed || 'Unallocated';
  const emergencyContact = activeUser?.emergencyContact || 'Not provided yet';
  const residentAddress = activeUser?.address || 'Not provided yet';
  const referenceFacePhoto = activeUser?.referenceFacePhoto || activeUser?.reference_face_photo_path || null;

  const isRoomPending = !studentRoom || studentRoom === 'Unallocated' || studentRoom === 'Pending' || studentRoom === 'Pending Room';
  const isHostelPending = !studentHostel || studentHostel === 'Pending Assignment' || studentHostel === 'Awaiting Allocation' || studentHostel === 'Pending';

  return (
    <div style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '2rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 800,
            boxShadow: '0 8px 16px rgba(5, 150, 105, 0.25)',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          {referenceFacePhoto ? (
            <img
              src={referenceFacePhoto}
              alt={studentName}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            studentInitial
          )}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {studentName}
            </h2>
            <span className="badge badge-success">Active Resident</span>
            {referenceFacePhoto ? (
              <span style={{ fontSize: '0.72rem', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                ✓ Face Enrolled
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fecaca' }}>
                ✕ Face Missing
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <GraduationCap size={16} color="var(--primary-600)" />
            <span>{studentDept} • {studentYear}</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
            Student Roll ID: <strong style={{ color: 'var(--slate-700)' }}>{studentId}</strong>
          </div>
        </div>

        <Button
          variant="outline"
          icon={Edit2}
          onClick={handleOpenEdit}
          disabled={loading}
        >
          Edit Profile
        </Button>
      </div>

      {/* Primary Residency & Academic Information Grid */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
          Hostel Residency & Academic Information
        </h3>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CAMPUS EMAIL</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} color="var(--primary-600)" />
              {studentEmail}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CONTACT MOBILE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={16} color="var(--primary-600)" />
              {studentPhone}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>HOSTEL BLOCK</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={16} color="var(--primary-600)" />
              {isHostelPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a' }}>
                  Pending Allocation
                </span>
              ) : (
                studentHostel
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ROOM & BED</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BedDouble size={16} color="var(--primary-600)" />
              {isRoomPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a' }}>
                  Pending Allocation
                </span>
              ) : (
                `Room ${studentRoom} (${studentBed})`
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>DEPARTMENT & YEAR</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {studentDept} • {studentYear}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>EMERGENCY CONTACT</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} color="var(--danger-600)" />
              {emergencyContact}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>PERMANENT RESIDENCE ADDRESS</div>
          <div style={{ color: 'var(--slate-700)', marginTop: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <MapPin size={16} color="var(--slate-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{residentAddress}</span>
          </div>
        </div>
      </div>

      {/* Dedicated Biometric Face Registration Status Card */}
      <div className="card" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={20} color="var(--primary-600)" />
              Biometric Face Registration Status
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Reference facial biometric model for geofenced hostel presence and attendance verification
            </p>
          </div>
          <div>
            {referenceFacePhoto ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={16} /> Face Enrolled ✓
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c', backgroundColor: '#fef2f2', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #fecaca' }}>
                <AlertCircle size={16} /> Pending Enrollment ✕
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--slate-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {referenceFacePhoto ? (
            <img
              src={referenceFacePhoto}
              alt="Registered Reference Face"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #059669',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
              }}
            />
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.5rem'
              }}
            >
              ✕
            </div>
          )}

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.95rem' }}>
              {referenceFacePhoto ? 'Biometric Face Model Active' : 'No Reference Biometric Face Stored'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
              {referenceFacePhoto
                ? 'Your face enrollment is linked to your student account. The attendance verification engine uses this reference photo to match your live selfie and verify presence inside the hostel geofence.'
                : 'You have not registered your face. Live attendance verification requires an enrolled reference biometric photo.'}
            </div>
          </div>
        </div>
      </div>

      {/* Roommate & Lifestyle Preferences */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
          Roommate Matching & Lifestyle Preferences
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
          These preferences are used by the smart roommate recommendation algorithm.
        </p>

        <div className="grid-3" style={{ gap: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>SLEEP SCHEDULE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.sleepTime || 'Early'} Sleeper
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>STUDY HABIT</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.studyTime || 'Morning'} Study
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CLEANLINESS</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.cleanliness || 'High'} Cleanliness
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>FOOD PREFERENCE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.foodPreference || 'Vegetarian'}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>LIGHT PREFERENCE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.lightPreference || 'Bright'}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ROOMMATE STATUS</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
              {user?.roommateStatus || 'Looking'}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Personal Information">
        <form onSubmit={handleSave}>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
            Academic fields (Hostel, Room, Roll ID) are managed by Administration. You may update your contact information, emergency phone, and lifestyle preferences.
          </p>

          {saveError && (
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
              <AlertCircle size={16} /> {saveError}
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+91 98220 11223 (Father)"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Permanent Residence Address</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full home address with city, state, and pin code"
              required
            />
          </div>

          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--slate-800)' }}>
              Lifestyle & Roommate Preferences
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Sleep Schedule</label>
                <select
                  className="form-select"
                  value={formData.sleepTime}
                  onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                >
                  <option value="Early">Early (Before 11 PM)</option>
                  <option value="Late">Night Owl (After 12 AM)</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Study Schedule</label>
                <select
                  className="form-select"
                  value={formData.studyTime}
                  onChange={(e) => setFormData({ ...formData, studyTime: e.target.value })}
                >
                  <option value="Morning">Morning</option>
                  <option value="Night">Late Night</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cleanliness Preference</label>
                <select
                  className="form-select"
                  value={formData.cleanliness}
                  onChange={(e) => setFormData({ ...formData, cleanliness: e.target.value })}
                >
                  <option value="High">Very Neat & Tidy</option>
                  <option value="Medium">Moderate</option>
                  <option value="Relaxed">Casual / Relaxed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food Preference</label>
                <select
                  className="form-select"
                  value={formData.foodPreference}
                  onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })}
                >
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Any">No Preference</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={saveLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

