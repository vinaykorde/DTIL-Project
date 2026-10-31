import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PlaneTakeoff, Plus, Calendar, CheckCircle2, Clock, XCircle, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function StudentLeaveRequest() {
  const { user } = useAuth();
  const { leaveRequests, addLeaveRequest } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    emergencyContact: user?.emergencyContact || user?.phone || ''
  });

  const studentName = user?.name || user?.email?.split('@')[0] || 'Student Resident';
  const myLeaves = leaveRequests.filter(
    l => (user?.id && l.studentId === user.id) ||
         (user?.studentId && l.studentId === user.studentId) ||
         l.studentName === studentName
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addLeaveRequest({
      studentName,
      studentId: user?.id || user?.studentId || 'STU-2024-001',
      room: user?.room || 'Unallocated',
      hostel: user?.hostel || 'Awaiting Allocation',
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason,
      emergencyContact: form.emergencyContact
    });
    setIsModalOpen(false);
    setForm({
      fromDate: '',
      toDate: '',
      reason: '',
      emergencyContact: user?.emergencyContact || user?.phone || ''
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
            Outstation & Weekend Leave Pass Applications
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Apply for hostel gate permission to visit home or academic conferences
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Apply For Leave Pass
        </Button>
      </div>

      {/* Status Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Leave Request History & Gate Pass Status</div>
            <div className="card-subtitle">Verified by Vikramshilla Hostel Warden office</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Leave Duration</th>
                <th>Reason</th>
                <th>Emergency Contact</th>
                <th>Status</th>
                <th>Warden Remarks</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length > 0 ? (
                myLeaves.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{l.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                        {l.fromDate} → {l.toDate}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Applied on {l.appliedAt}</div>
                    </td>
                    <td style={{ maxWidth: '280px', color: 'var(--slate-700)', fontSize: '0.875rem' }}>
                      {l.reason}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                      {l.emergencyContact}
                    </td>
                    <td>
                      <StatusBadge status={l.status} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>
                      {l.remarks || 'Under review'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--slate-500)' }}>
                    No leave requests submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: LEAVE REQUEST FORM ================= */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Hostel Leave Application">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">From Date (Departure) *</label>
              <input
                type="date"
                className="form-input"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">To Date (Return to Hostel) *</label>
              <input
                type="date"
                className="form-input"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Leaving Hostel *</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Attending sister's wedding ceremony in Pune with family..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parent / Emergency Contact Number *</label>
            <input
              type="text"
              className="form-input"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit For Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
