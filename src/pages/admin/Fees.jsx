import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Receipt, CheckCircle, AlertCircle, Search, Download } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';

export default function Fees() {
  const { students } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(
    s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = '₹ 1,89,00,000';
  const totalPending = '₹ 8,45,000';

  const columns = [
    { header: 'Student ID', key: 'id', render: r => <span style={{ fontWeight: 700 }}>{r.id}</span> },
    {
      header: 'Student Name',
      key: 'name',
      render: r => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Room {r.room} • {r.hostel}</div>
        </div>
      )
    },
    { header: 'Hostel Term Fee', render: () => '₹ 45,000' },
    {
      header: 'Pending Balance',
      render: r => (
        <span style={{ fontWeight: 700, color: r.pendingFees > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>
          {r.pendingFees > 0 ? `₹ ${r.pendingFees.toLocaleString()}` : '₹ 0 (Cleared)'}
        </span>
      )
    },
    {
      header: 'Payment Status',
      render: r => (
        <span className={`badge ${r.pendingFees > 0 ? 'badge-warning' : 'badge-success'}`}>
          {r.pendingFees > 0 ? 'Partial Dues' : 'Paid in Full'}
        </span>
      )
    },
    {
      header: 'Receipt',
      align: 'right',
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => alert(`Receipt #${r.id}-RCPT downloaded.`)}>
          Receipt
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            Hostel & Mess Fee Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Monitor student fee remittances, mess dues, and caution deposit registers
          </p>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>TOTAL COLLECTED THIS SEMESTER</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-600)', marginTop: '0.35rem' }}>{totalCollected}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>95.7% collection efficiency</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>OUTSTANDING DUES</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--danger-600)', marginTop: '0.35rem' }}>{totalPending}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Pending across 18 residents</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>MESS ADVANCE RECONCILED</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '0.35rem' }}>100%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>All catering vendor dues settled</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredStudents}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by student name or ID..."
      />
    </div>
  );
}
