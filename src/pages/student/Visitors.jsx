import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Eye, Plus, Calendar, Clock, Phone, UserCheck, Shield } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function StudentVisitors() {
  const { user } = useAuth();
  const { visitors, addVisitor } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    visitorName: '',
    relationship: 'Parent',
    phone: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '04:00 PM',
    notes: 'Visiting to deliver essentials'
  });

  const studentName = user?.name || user?.email?.split('@')[0] || 'Student Resident';
  const myVisitors = visitors.filter(
    v => (user?.id && v.studentId === user.id) ||
         (user?.studentId && v.studentId === user.studentId) ||
         v.studentName === studentName
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addVisitor({
      studentName,
      studentId: user?.id || user?.studentId || 'STU-2024-001',
      room: user?.room || 'Unallocated',
      hostel: user?.hostel || 'Awaiting Allocation',
      visitorName: form.visitorName,
      relationship: form.relationship,
      phone: form.phone,
      visitDate: form.visitDate,
      visitTime: form.visitTime,
      notes: form.notes
    });
    setIsModalOpen(false);
    setForm({
      visitorName: '',
      relationship: 'Parent',
      phone: '',
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: '04:00 PM',
      notes: 'Visiting to deliver essentials'
    });
  };

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
            Visitor Registration & Campus Gate Passes
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Pre-register visiting parents and guardians for seamless security entry
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Register Expected Visitor
        </Button>
      </div>

      {/* Visitor Log Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Registered Visitor Log</div>
            <div className="card-subtitle">Verified by Security Guard & Vikramshilla Hostel Warden</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Relationship</th>
                <th>Contact Phone</th>
                <th>Expected Date & Time</th>
                <th>Gate Security Status</th>
                <th>Purpose / Notes</th>
              </tr>
            </thead>
            <tbody>
              {myVisitors.length > 0 ? (
                myVisitors.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{v.visitorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Pass #{v.id}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{v.relationship}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-700)' }}>{v.phone}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{v.visitDate}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{v.visitTime}</div>
                    </td>
                    <td>
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>{v.notes || 'Family visit'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
                    No visitors registered yet. Click "Register Expected Visitor" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: REGISTER VISITOR ================= */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Visiting Guest / Parent">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Visitor's Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={form.visitorName}
              onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
              placeholder="e.g. Mr. Dinesh Korde"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Relationship to Student *</label>
              <select
                className="form-select"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother / Sister">Brother / Sister</option>
                <option value="Guardian">Local Guardian</option>
                <option value="Relative">Relative</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visitor's Phone Number *</label>
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98220 11223"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Visit Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Arrival Time *</label>
              <input
                type="text"
                className="form-input"
                value={form.visitTime}
                onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                placeholder="e.g. 04:30 PM"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose of Visit</label>
            <input
              type="text"
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Delivering study laptop and winter clothing"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Visitor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
