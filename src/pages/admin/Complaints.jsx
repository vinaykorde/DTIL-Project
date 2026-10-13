import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  Calendar,
  MessageSquare
} from 'lucide-react';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function Complaints() {
  const { complaints, updateComplaintStatus } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Status Update Modal
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [notes, setNotes] = useState('');

  const handleOpenStatusModal = (complaint) => {
    setActiveComplaint(complaint);
    setNewStatus(complaint.status);
    setNotes(complaint.notes || '');
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (activeComplaint) {
      updateComplaintStatus(activeComplaint.id, newStatus, notes);
      setActiveComplaint(null);
    }
  };

  const categories = ['Electrical', 'Plumbing', 'Cleaning', 'Internet', 'Food', 'Room', 'Other'];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.room && c.room.includes(searchTerm));

      const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;

      return matchSearch && matchCat && matchStatus && matchPriority;
    });
  }, [complaints, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  const columns = [
    {
      header: 'Complaint ID',
      key: 'id',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{row.id}</span>
    },
    {
      header: 'Student & Room',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{row.studentName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Room {row.room} • {row.hostel}</div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span
          className="badge badge-neutral"
          style={{ fontWeight: 700 }}
        >
          {row.category}
        </span>
      )
    },
    {
      header: 'Subject & Details',
      render: (row) => (
        <div style={{ maxWidth: '320px' }}>
          <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '0.875rem' }}>{row.subject}</div>
          <div style={{ fontSize: '0.775rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.description}
          </div>
        </div>
      )
    },
    {
      header: 'Date Logged',
      render: (row) => <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>{row.date}</span>
    },
    {
      header: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="sm" />
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenStatusModal(row)}
        >
          Update Status
        </Button>
      )
    }
  ];

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
            Hostel Grievance & Complaint Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Track, assign, and resolve student maintenance and facility requests
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setCategoryFilter('All')}
          className={`btn ${categoryFilter === 'All' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          All Categories ({complaints.length})
        </button>
        {categories.map((cat) => {
          const count = complaints.filter(c => c.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`btn ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.5rem'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={16} /> Filters:
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem' }}
            placeholder="Search complaint or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredComplaints}
      />

      {/* ================= MODAL: UPDATE COMPLAINT STATUS ================= */}
      <Modal
        isOpen={Boolean(activeComplaint)}
        onClose={() => setActiveComplaint(null)}
        title="Update Grievance Status"
      >
        {activeComplaint && (
          <form onSubmit={handleSaveStatus}>
            <div style={{ backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem' }}>
                {activeComplaint.subject}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
                {activeComplaint.description}
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                <span>Reported by: <strong>{activeComplaint.studentName}</strong></span>
                <span>Room: <strong>{activeComplaint.room}</strong></span>
                <span>Category: <strong>{activeComplaint.category}</strong></span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Workflow Status *</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Pending">Pending (Awaiting review)</option>
                <option value="In Progress">In Progress (Assigned to technician)</option>
                <option value="Resolved">Resolved (Work completed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Resolution / Maintenance Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter actions taken by maintenance staff or comments for the student..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button type="button" variant="secondary" onClick={() => setActiveComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Status Update
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
