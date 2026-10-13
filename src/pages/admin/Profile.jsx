import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, Mail, Phone, Building, ShieldCheck, Edit2, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function AdminProfile() {
  const { user } = useAuth();
  const { showToast } = useData();

  const [profile, setProfile] = useState({
    name: user?.name || 'Prof. V. K. Deshpande',
    id: user?.id || 'ADM-001',
    email: user?.email || 'admin@hostel.com',
    phone: user?.phone || '+91 98765 43210',
    role: 'Central Chief Warden & Director of Student Housing',
    department: user?.department || 'Campus Administration',
    hostel: 'All Hostels (Central Housing Directorate)',
    room: 'Admin Block, Suite 101'
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ ...profile });

  const handleSave = (e) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditOpen(false);
    showToast('Administrator profile updated successfully.', 'success');
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
            backgroundColor: 'var(--primary-600)',
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
            <span className="badge badge-primary">Administrator</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            {profile.role}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
            Employee ID: {profile.id}
          </div>
        </div>
        <Button variant="outline" icon={Edit2} onClick={() => { setFormData({ ...profile }); setIsEditOpen(true); }}>
          Edit Profile
        </Button>
      </div>

      {/* Profile Details Grid */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
          Administrative Credentials & Contact Info
        </h3>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>OFFICIAL EMAIL</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} color="var(--primary-600)" />
              {profile.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>CONTACT PHONE</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={16} color="var(--primary-600)" />
              {profile.phone}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>DEPARTMENT</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {profile.department}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>HOSTEL JURISDICTION</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {profile.hostel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>DIRECTORATE OFFICE / CABIN</div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {profile.room}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>SECURITY CLEARANCE</div>
            <div style={{ fontWeight: 700, color: 'var(--success-700)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={16} /> Level 3 (Super Admin)
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Administrator Profile">
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
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Directorate Office Location</label>
            <input
              type="text"
              className="form-input"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
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
