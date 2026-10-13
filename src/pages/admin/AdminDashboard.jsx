import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Users,
  BedDouble,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';

export default function AdminDashboard() {
  const { students, rooms, complaints, notices } = useData();
  const navigate = useNavigate();

  // Dynamic calculations
  const totalStudents = students.length;
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.occupied > 0).length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const totalWardens = 4;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Category counts for complaints
  const categories = ['Electrical', 'Plumbing', 'Cleaning', 'Internet', 'Food', 'Room', 'Other'];
  const complaintCounts = categories.map(cat => ({
    name: cat,
    count: complaints.filter(c => c.category === cat).length
  }));

  const recentComplaints = complaints.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, fontWeight: 700 }}>
            Central Administration Console
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
            Campus Housing Master Overview
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            4 Hostels Active • {totalStudents} Residents Enrolled • {occupancyRate}% Overall Occupancy
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/admin/rooms')}
            style={{ backgroundColor: '#ffffff', color: '#1e40af', border: 'none' }}
          >
            Manage Rooms
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/admin/notices')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Post Notice
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid-auto">
        <DashboardCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="#2563eb"
          bgColor="#eff6ff"
          trend="+12 this semester"
          onClick={() => navigate('/admin/students')}
        />
        <DashboardCard
          title="Total Rooms"
          value={totalRooms}
          icon={BedDouble}
          color="#8b5cf6"
          bgColor="#faf5ff"
          subtext="Across 4 hostel blocks"
          onClick={() => navigate('/admin/rooms')}
        />
        <DashboardCard
          title="Occupied Rooms"
          value={occupiedRooms}
          icon={DoorClosed}
          color="#f59e0b"
          bgColor="#fffbeb"
          trend={`${occupancyRate}% Capacity`}
        />
        <DashboardCard
          title="Available Rooms"
          value={availableRooms}
          icon={DoorOpen}
          color="#10b981"
          bgColor="#ecfdf5"
          subtext="Ready for allocation"
        />
        <DashboardCard
          title="Pending Complaints"
          value={pendingComplaints}
          icon={AlertTriangle}
          color="#ef4444"
          bgColor="#fef2f2"
          subtext="Requires resolution"
          onClick={() => navigate('/admin/complaints')}
        />
        <DashboardCard
          title="Total Wardens"
          value={totalWardens}
          icon={Building}
          color="#06b6d4"
          bgColor="#f0fdfa"
          subtext="Assigned supervisors"
        />
      </div>

      {/* Analytics & Visual Breakdown Grid */}
      <div className="grid-2">
        {/* Room Occupancy Visualizer */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BedDouble size={20} color="var(--primary-600)" />
                Room Occupancy Rate
              </div>
              <div className="card-subtitle">Real-time capacity utilization across blocks</div>
            </div>
            <span className="badge badge-primary">{occupancyRate}% Full</span>
          </div>

          {/* Custom Visual Progress Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                height: 16,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--slate-100)',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  width: `${occupancyRate}%`,
                  backgroundColor: 'var(--primary-600)',
                  transition: 'width 500ms ease'
                }}
                title={`Occupied: ${occupiedRooms}`}
              />
              <div
                style={{
                  width: `${100 - occupancyRate}%`,
                  backgroundColor: 'var(--success-500)',
                  transition: 'width 500ms ease'
                }}
                title={`Available: ${availableRooms}`}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--slate-500)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary-600)' }}></span>
                Occupied: {occupiedRooms} rooms
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--success-500)' }}></span>
                Available: {availableRooms} rooms
              </span>
            </div>
          </div>

          {/* Breakdown per Hostel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'Vikramshilla Boys Hostel', rooms: '45 Rooms', rate: 94 },
              { name: 'Godavari Boys Hostel', rooms: '40 Rooms', rate: 85 },
              { name: 'Ganga Girls Hostel', rooms: '50 Rooms', rate: 90 },
              { name: 'Yamuna Girls Hostel', rooms: '35 Rooms', rate: 74 }
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-800)' }}>{h.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{h.rooms}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-700)' }}>{h.rate}%</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--slate-400)' }}>Occupancy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints Distribution by Category */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertTriangle size={20} color="var(--warning-600)" />
                Complaints by Category
              </div>
              <div className="card-subtitle">Active maintenance and service tickets</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/complaints')}>
              View All
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {complaintCounts.map((cat, idx) => {
              const maxCount = Math.max(...complaintCounts.map(c => c.count), 1);
              const pct = (cat.count / maxCount) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{cat.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{cat.count} tickets</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: 'var(--slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: cat.name === 'Electrical' ? '#ef4444' : cat.name === 'Internet' ? '#3b82f6' : cat.name === 'Plumbing' ? '#06b6d4' : '#f59e0b',
                        borderRadius: 'var(--radius-full)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Complaints & Recent Activities */}
      <div className="grid-2">
        {/* Recent Complaints Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Complaints</div>
              <div className="card-subtitle">Latest student reported issues</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/complaints')}>
              Manage
            </Button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student / Room</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{c.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Room {c.room} • {c.hostel}</div>
                    </td>
                    <td><span className="badge badge-neutral">{c.category}</span></td>
                    <td><StatusBadge status={c.priority} size="sm" /></td>
                    <td><StatusBadge status={c.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Activity size={20} color="var(--primary-600)" />
                Recent Activities
              </div>
              <div className="card-subtitle">Audit log of system actions</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { title: 'Leave Request Approved', detail: 'Warden Dr. Satish Sharma approved leave for Rohan Mehta (Room 101)', time: '10 mins ago', color: '#10b981' },
              { title: 'New Grievance Raised', detail: 'Vinay Korde filed Internet connectivity issue in Room 204', time: '45 mins ago', color: '#f59e0b' },
              { title: 'Morning Attendance Logged', detail: '94% residents recorded present for Vikramshilla Boys Hostel', time: '2 hours ago', color: '#2563eb' },
              { title: 'Notice Broadcasted', detail: 'Maintenance & Water Tank Cleaning schedule published', time: '4 hours ago', color: '#8b5cf6' },
              { title: 'Room Cleaned & Available', detail: 'Room 206 sanitized and opened for double sharing', time: '1 day ago', color: '#10b981' }
            ].map((act, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: act.color,
                    marginTop: '6px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>{act.title}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--slate-400)' }}>{act.time}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.15rem' }}>{act.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
