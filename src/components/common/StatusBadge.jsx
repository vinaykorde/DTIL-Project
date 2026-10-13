import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  if (!status) return null;

  const getBadgeClass = (val) => {
    const s = String(val).toLowerCase();
    if (s === 'available' || s === 'resolved' || s === 'approved' || s === 'active' || s === 'present' || s === 'paid' || s === 'completed') {
      return 'badge-success';
    }
    if (s === 'partially occupied' || s === 'in progress' || s === 'pending' || s === 'medium' || s === 'expected') {
      return 'badge-warning';
    }
    if (s === 'full' || s === 'rejected' || s === 'absent' || s === 'high' || s === 'urgent') {
      return 'badge-danger';
    }
    if (s === 'checked in' || s === 'low') {
      return 'badge-info';
    }
    return 'badge-neutral';
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`} style={{ fontSize: size === 'sm' ? '0.7rem' : '0.775rem' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }}></span>
      {status}
    </span>
  );
}
