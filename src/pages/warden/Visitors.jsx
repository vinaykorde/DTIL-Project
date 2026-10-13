import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Eye, Search, CheckCircle, Clock, ShieldCheck, Phone, Plus } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function WardenVisitors() {
  const { visitors, addVisitor, showToast } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [form, setForm] = useState({
    visitorName: '',
    relationship: 'Parent',
    phone: '',
    studentName: 'Vinay Korde',
    room: '204',
    hostel: 'Vikramshilla Boys Hostel',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '02:30 PM',
    notes: 'Campus visit'
  });

  const handleLogVisitor = async (e) => {
    e.preventDefault();
    await addVisitor(form);
    setIsLogModalOpen(false);
  };

  const handleUpdateVisitorStatus = (visitorId, newStatus) => {
    showToast(`Visitor pass status updated to ${newStatus}`, 'info');
  };

  const filteredVisitors = visitors.filter(
    v => v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.room.includes(searchTerm)
  );

  const columns = [
    { header: 'Pass ID', key: 'id', render: r => <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{r.id}</span> },
    {
      header: 'Visitor Details',
      render: r => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{r.visitorName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{r.relationship} • {r.phone}</div>
        </div>
      )
    },
    {
      header: 'Resident Student & Room',
      render: r => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{r.studentName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Room {r.room} • {r.hostel}</div>
        </div>
      )
    },
    {
      header: 'Visit Schedule',
      render: r => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.visitDate}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{r.visitTime}</div>
        </div>
      )
    },
    { header: 'Purpose', key: 'notes' },
    {
      header: 'Gate Status',
      render: r => <StatusBadge status={r.status} size="sm" />
    },
    {
      header: 'Security Action',
      align: 'right',
      render: r => (
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
          {r.status === 'Expected' && (
            <Button variant="success" size="sm" onClick={() => handleUpdateVisitorStatus(r.id, 'Checked In')}>
              Check In
            </Button>
          )}
          {r.status === 'Checked In' && (
            <Button variant="outline" size="sm" onClick={() => handleUpdateVisitorStatus(r.id, 'Completed')}>
              Check Out
            </Button>
          )}
          {r.status === 'Completed' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Archived</span>
          )}
        </div>
      )
    }
  ];

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
            Campus Gatekeeper & Hostel Visitor Register
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Monitor guest check-ins, parent entries, and verify hostel permissions
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsLogModalOpen(true)}>
          Log Walk-In Visitor
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredVisitors}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search visitor or student..."
      />

      {/* Log Visitor Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Walk-In Visitor at Gate">
        <form onSubmit={handleLogVisitor}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Visitor Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Visitor Phone *</label>
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student Being Visited *</label>
              <input
                type="text"
                className="form-input"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student Room Number *</label>
              <input
                type="text"
                className="form-input"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose of Entry</label>
            <input
              type="text"
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Gate Pass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
