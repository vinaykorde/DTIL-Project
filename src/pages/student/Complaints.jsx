import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AlertTriangle, Plus, Filter, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function StudentComplaints() {
  const { user } = useAuth();
  const { complaints, addComplaint } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  const [form, setForm] = useState({
    category: 'Electrical',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  const studentName = user?.name || 'Vinay Korde';
  const roomNumber = user?.room || '204';
  const hostelName = user?.hostel || 'Vikramshilla Boys Hostel';

  const myComplaints = complaints.filter(
    c => c.studentName === studentName || c.room === roomNumber
  );

  const filtered = filterCategory === 'All'
    ? myComplaints
    : myComplaints.filter(c => c.category === filterCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addComplaint({
      studentName,
      studentId: user?.id || 'STU-2024-001',
      room: roomNumber,
      hostel: hostelName,
      category: form.category,
      subject: form.subject,
      description: form.description,
      priority: form.priority
    });
    setIsModalOpen(false);
    setForm({
      category: 'Electrical',
      subject: '',
      description: '',
      priority: 'Medium'
    });
  };

  const categories = ['Electrical', 'Plumbing', 'Cleaning', 'Internet', 'Food', 'Room', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            My Grievance & Maintenance Tickets
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Report hostel issues directly to the warden and maintenance staff
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Raise New Complaint
        </Button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setFilterCategory('All')}
          className={`btn ${filterCategory === 'All' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          All ({myComplaints.length})
        </button>
        {categories.map(cat => {
          const count = myComplaints.filter(c => c.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Complaints List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length > 0 ? (
          filtered.map(c => (
            <div
              key={c.id}
              className="card"
              style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${
                  c.status === 'Resolved'
                    ? 'var(--success-500)'
                    : c.status === 'In Progress'
                    ? 'var(--warning-500)'
                    : 'var(--primary-500)'
                }`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                    #{c.id}
                  </span>
                  <span className="badge badge-neutral">{c.category}</span>
                  <StatusBadge status={c.priority} size="sm" />
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.35rem' }}>
                {c.subject}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                {c.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                <span>Reported on: {c.date}</span>
                {c.resolvedDate && <span style={{ color: 'var(--success-700)', fontWeight: 600 }}>Resolved on: {c.resolvedDate}</span>}
              </div>

              {c.notes && (
                <div style={{ marginTop: '0.75rem', backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Warden Response: </span>
                  <span style={{ color: 'var(--slate-600)' }}>{c.notes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card empty-state">
            <AlertTriangle className="empty-state-icon" size={36} />
            <div className="empty-state-title">No complaints found</div>
            <p style={{ fontSize: '0.85rem' }}>You currently have no complaints under this category.</p>
          </div>
        )}
      </div>

      {/* ================= MODAL: RAISE COMPLAINT ================= */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File Maintenance Complaint">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Electrical">Electrical (Fan, Light, Sockets)</option>
                <option value="Plumbing">Plumbing (Washroom, Tap, Leakage)</option>
                <option value="Cleaning">Cleaning & Corridor Housekeeping</option>
                <option value="Internet">Internet / Wi-Fi Access Point</option>
                <option value="Food">Food / Mess Hygiene</option>
                <option value="Room">Room Door Lock & Furniture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level *</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent (Emergency)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject Headline *</label>
            <input
              type="text"
              className="form-input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Geyser in attached washroom not heating water"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue and timings when your room is accessible for maintenance personnel..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
