import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Bell, Calendar, User, Search, Filter } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function StudentNotices() {
  const { notices } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredNotices = notices.filter(n => {
    const matchSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'All' || n.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Hostel Notices & Announcements Board
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Official circulars, gate timing updates, sports events, and facilities maintenance alerts
        </p>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Notice Categories</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Discipline">Discipline</option>
            <option value="Events">Events & Sports</option>
            <option value="IT Services">IT & Wi-Fi</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem' }}
            placeholder="Search circulars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notice Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredNotices.map((n) => (
          <div
            key={n.id}
            className="card"
            style={{
              padding: '1.5rem',
              borderLeft: `5px solid ${
                n.priority === 'High'
                  ? 'var(--danger-500)'
                  : n.priority === 'Medium'
                  ? 'var(--warning-500)'
                  : 'var(--primary-500)'
              }`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge-primary">{n.category || 'Announcement'}</span>
                <StatusBadge status={n.priority} size="sm" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> {n.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} /> {n.postedBy}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.4rem' }}>
              {n.title}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              {n.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
