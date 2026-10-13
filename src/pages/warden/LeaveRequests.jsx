import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PlaneTakeoff, Check, X, Filter, Calendar, Phone, MessageSquare } from 'lucide-react';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function WardenLeaveRequests() {
  const { leaveRequests, updateLeaveStatus } = useData();

  const [filterStatus, setFilterStatus] = useState('All');
  const [remarksModal, setRemarksModal] = useState(null); // { id, action: 'Approved' | 'Rejected' }
  const [remarks, setRemarks] = useState('');

  const filteredLeaves = filterStatus === 'All'
    ? leaveRequests
    : leaveRequests.filter(l => l.status === filterStatus);

  const handleOpenAction = (id, action) => {
    setRemarksModal({ id, action });
    setRemarks(action === 'Approved' ? 'Leave sanctioned with parent verification.' : 'Rejected due to upcoming lab exams / curfew rules.');
  };

  const handleConfirmAction = (e) => {
    e.preventDefault();
    if (remarksModal) {
      updateLeaveStatus(remarksModal.id, remarksModal.action, remarks);
      setRemarksModal(null);
    }
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
            Student Leave & Gate Pass Approval Console
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Review outstation permissions, parent authorization, and issue gate passes
          </p>
        </div>

        {/* Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Requests</option>
          <option value="Pending">Pending Only</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Student / Room</th>
                <th>Leave Duration</th>
                <th>Reason for Leave</th>
                <th>Emergency / Parent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map(leave => (
                <tr key={leave.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{leave.id}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{leave.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Room {leave.room} • {leave.hostel}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {leave.fromDate} → {leave.toDate}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--slate-400)' }}>Applied on {leave.appliedAt}</div>
                  </td>
                  <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: 'var(--slate-700)' }}>
                    {leave.reason}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-800)', fontWeight: 600 }}>
                      {leave.emergencyContact}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={leave.status} size="sm" />
                    {leave.remarks && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
                        {leave.remarks}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {leave.status === 'Pending' ? (
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={X}
                          onClick={() => handleOpenAction(leave.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={() => handleOpenAction(leave.id, 'Approved')}
                        >
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAction(leave.id, leave.status === 'Approved' ? 'Rejected' : 'Approved')}
                      >
                        Modify Status
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks Confirmation Modal */}
      <Modal
        isOpen={Boolean(remarksModal)}
        onClose={() => setRemarksModal(null)}
        title={`${remarksModal?.action} Leave Application`}
      >
        <form onSubmit={handleConfirmAction}>
          <div className="form-group">
            <label className="form-label">Warden Decision Remarks / Condition</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide confirmation notes or instructions for gate security..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setRemarksModal(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={remarksModal?.action === 'Approved' ? 'success' : 'danger'}
            >
              Confirm {remarksModal?.action}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
