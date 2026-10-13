import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, Mail, Phone, Building, BedDouble, Edit2, GraduationCap, MapPin } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function StudentProfile() {
  const { user } = useAuth();
  const { showToast } = useData();

  const [profile, setProfile] = useState({
    name: user?.name || 'Vinay Korde',
    id: user?.id || 'STU-2024-001',
    email: user?.email || 'student@hostel.com',
    phone: user?.phone || '+91 91234 56780',
    department: user?.department || 'Information Technology',
    year: user?.year || '3rd Year',
    hostel: user?.hostel || 'Vikramshilla Boys Hostel',
    room: user?.room || '204',
    bed: user?.bed || 'Bed A',
    emergencyContact: '+91 98220 11223 (Father - Dinesh Korde)',
    address: 'Plot 42, Shivajinagar, Pune, Maharashtra - 411005'
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ ...profile });

  const handleSave = (e) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditOpen(false);
    showToast('Student resident profile updated successfully.', 'success');
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            backgroundColor: 'var(--success-600)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {profile.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {profile.name}
            </h2>
            <span className="badge badge-success">Student Resident</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            {profile.department} • {profile.year}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
            Student Roll ID: {profile.id}
          </div>
        </div>
        <Button variant="outline" icon={Edit2} onClick={() => { setFormData({ ...profile }); setIsEditOpen(true); }}>
          Edit Profile
        </Button>
      </div>

      {/* Info Grid */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
          Hostel Residency & Academic Information
        </h3>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CAMPUS EMAIL</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} color="var(--primary-600)" />
              {profile.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CONTACT MOBILE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={16} color="var(--primary-600)" />
              {profile.phone}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>HOSTEL BLOCK</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={16} color="var(--primary-600)" />
              {profile.hostel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ROOM & BED</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BedDouble size={16} color="var(--primary-600)" />
              Room {profile.room} ({profile.bed})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>DEPARTMENT & YEAR</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {profile.department} • {profile.year}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>EMERGENCY CONTACT</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {profile.emergencyContact}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>PERMANENT RESIDENCE ADDRESS</div>
          <div style={{ color: 'var(--slate-700)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {profile.address}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Profile Details">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Permanent Address</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
