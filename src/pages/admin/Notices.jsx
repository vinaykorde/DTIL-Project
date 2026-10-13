import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Bell, Plus, Trash2, Calendar, User, Pin, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function Notices() {
  const { notices, addNotice, deleteNotice } = useData();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    postedBy: 'Chief Warden Office',
    targetRole: 'All'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addNotice(form);
    setIsAddOpen(false);
    setForm({
      title: '',
      description: '',
      category: 'General',
      priority: 'Medium',
      postedBy: 'Chief Warden Office',
      targetRole: 'All'
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this notice?')) {
      deleteNotice(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
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
            Official Hostel Notice Bulletin
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Publish announcements, maintenance circulars, and emergency alerts
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsAddOpen(true)}>
          Publish Notice
        </Button>
      </div>

      {/* Notices Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="card"
            style={{
              padding: '1.5rem',
              borderLeft: `5px solid ${
                notice.priority === 'High'
                  ? 'var(--danger-500)'
                  : notice.priority === 'Medium'
                  ? 'var(--warning-500)'
                  : 'var(--primary-500)'
              }`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{notice.category || 'General'}</span>
                <StatusBadge status={notice.priority} size="sm" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {notice.date}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={13} /> {notice.postedBy}
                </span>
              </div>

              <button
                onClick={() => handleDelete(notice.id)}
                className="btn-icon"
                style={{ color: 'var(--danger-600)', backgroundColor: 'var(--danger-50)' }}
                title="Delete Notice"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              {notice.title}
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              {notice.description}
            </p>
          </div>
        ))}
      </div>

      {/* ================= MODAL: ADD NOTICE ================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Publish Official Notice">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Notice Headline *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Water Tank Maintenance Schedule"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="General">General Announcement</option>
                <option value="Maintenance">Maintenance & Facilities</option>
                <option value="Discipline">Discipline & Curfew</option>
                <option value="Events">Cultural & Sports Events</option>
                <option value="Mess">Mess & Canteen</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level *</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Low">Low Priority (Routine Info)</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority (Urgent Action)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notice Body / Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide complete instructions, dates, timings, and contact personnel..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Issuing Authority / Posted By</label>
            <input
              type="text"
              className="form-input"
              value={form.postedBy}
              onChange={(e) => setForm({ ...form, postedBy: e.target.value })}
              placeholder="e.g. Chief Warden Office"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
