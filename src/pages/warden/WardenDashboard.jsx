import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlaneTakeoff,
  Eye,
  ArrowRight,
  Clock,
  CalendarCheck,
  Check,
  X,
  MapPin,
  Map,
  Camera
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import RoommateCompatibility from '../../components/warden/RoommateCompatibility';

export default function WardenDashboard() {
  const { students, complaints, leaveRequests, visitors, attendance, updateLeaveStatus, presenceRecords } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const wardenHostel = user?.hostel || 'Vikramshilla Boys Hostel';

  // Stats calculation
  const totalHostelStudents = students.filter(s => s.hostel === wardenHostel).length || students.length;
  const presentToday = attendance.filter(a => a.status === 'Present').length;
  const absentToday = attendance.filter(a => a.status === 'Absent').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;
  const visitorsToday = visitors.length;

  const recentLeaves = leaveRequests.slice(0, 3);
  const recentComplaints = complaints.slice(0, 3);
  const recentVisitors = visitors.slice(0, 3);
  const recentPresence = presenceRecords.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
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
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, fontWeight: 700 }}>
            Hostel Warden Console
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
            Daily Resident Operations
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            {wardenHostel} • {totalHostelStudents} Enrolled Students • Roll-call ready
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="md"
            icon={CalendarCheck}
            onClick={() => navigate('/warden/attendance')}
            style={{ backgroundColor: '#ffffff', color: '#b45309', border: 'none' }}
          >
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/warden/leave-requests')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            Review Leaves ({pendingLeaves})
          </Button>
        </div>
      </div>

      {/* Six Primary Metric Cards */}
      <div className="grid-auto">
        <DashboardCard
          title="Total Students"
          value={totalHostelStudents}
          icon={Users}
          color="#2563eb"
          bgColor="#eff6ff"
          subtext="Under your supervision"
          onClick={() => navigate('/warden/students')}
        />
        <DashboardCard
          title="Present Today"
          value={presentToday}
          icon={CheckCircle2}
          color="#10b981"
          bgColor="#ecfdf5"
          trend="Roll-call verified"
        />
        <DashboardCard
          title="Absent Today"
          value={absentToday}
          icon={XCircle}
          color="#ef4444"
          bgColor="#fef2f2"
          subtext="Requires curfew follow-up"
        />
        <DashboardCard
          title="Pending Complaints"
          value={pendingComplaints}
          icon={AlertTriangle}
          color="#f59e0b"
          bgColor="#fffbeb"
          subtext="Maintenance tickets"
          onClick={() => navigate('/warden/complaints')}
        />
        <DashboardCard
          title="Leave Requests"
          value={pendingLeaves}
          icon={PlaneTakeoff}
          color="#8b5cf6"
          bgColor="#faf5ff"
          trend={`${pendingLeaves} await approval`}
          onClick={() => navigate('/warden/leave-requests')}
        />
        <DashboardCard
          title="Visitors Today"
          value={visitorsToday}
          icon={Eye}
          color="#06b6d4"
          bgColor="#f0fdfa"
          subtext="Gate security verified"
          onClick={() => navigate('/warden/visitors')}
        />
      </div>

      {/* Section 0: Geofenced Presence Monitor */}
      <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <MapPin size={20} color="#10b981" />
              Live Geo + Face Presence
            </div>
            <div className="card-subtitle">Real-time student self-verification logs</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Distance</th>
                <th>Location</th>
                <th>Face Match</th>
                <th>Final Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentPresence.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '2rem' }}>
                    No presence records found for today.
                  </td>
                </tr>
              ) : (
                recentPresence.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>{record.studentName}</td>
                    <td>
                      {record.distanceFromHostel > 1000 
                        ? `${(record.distanceFromHostel/1000).toFixed(1)} km` 
                        : `${record.distanceFromHostel} m`}
                    </td>
                    <td>
                      <StatusBadge 
                        status={record.locationStatus === 'INSIDE' ? 'Approved' : 'Rejected'} 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <StatusBadge 
                        status={record.faceMatchStatus === 'VERIFIED' ? 'Approved' : 'Rejected'} 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <StatusBadge 
                        status={record.verificationStatus === 'PRESENT' ? 'Present' : 'Absent'} 
                        size="sm" 
                      />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                      {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 1: Recent Complaints & Pending Leave Approvals */}
      <div className="grid-2">
        {/* Leave Requests with 1-Click Approval */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <PlaneTakeoff size={20} color="var(--primary-600)" />
                Pending Leave Applications
              </div>
              <div className="card-subtitle">Student outstation and weekend passes</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/warden/leave-requests')}>
              View All
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentLeaves.map(l => (
              <div
                key={l.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                      {l.studentName}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginLeft: '6px' }}>
                      (Room {l.room})
                    </span>
                  </div>
                  <StatusBadge status={l.status} size="sm" />
                </div>

                <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginBottom: '0.6rem' }}>
                  <strong>{l.fromDate} → {l.toDate}</strong> • {l.reason}
                </div>

                {l.status === 'Pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={() => updateLeaveStatus(l.id, 'Rejected', 'Curfew restriction')}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={Check}
                      onClick={() => updateLeaveStatus(l.id, 'Approved', 'Approved by warden')}
                    >
                      Approve Pass
                    </Button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'right' }}>
                    Processed: {l.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertTriangle size={20} color="var(--warning-600)" />
                Recent Maintenance Complaints
              </div>
              <div className="card-subtitle">Active student reported grievances</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/warden/complaints')}>
              Manage Tickets
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentComplaints.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                    #{c.id} • Room {c.room} ({c.category})
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                  {c.subject}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                  {c.studentName} • Priority: <strong>{c.priority}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Today's Attendance Summary & Recent Visitors */}
      <div className="grid-2">
        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <CalendarCheck size={20} color="var(--primary-600)" />
                Today's Roll-Call Status
              </div>
              <div className="card-subtitle">10:00 PM evening curfew log</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/warden/attendance')}>
              Open Attendance Sheet
            </Button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 5).map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.studentName}</td>
                    <td>Room {a.room}</td>
                    <td>
                      <StatusBadge status={a.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Visitors */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Eye size={20} color="var(--primary-600)" />
                Campus Gate Visitors
              </div>
              <div className="card-subtitle">Visiting parents and approved guests</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/warden/visitors')}>
              Visitor Register
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentVisitors.map(v => (
              <div
                key={v.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                    {v.visitorName} ({v.relationship})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    Visiting: {v.studentName} (Room {v.room})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={v.status} size="sm" />
                  <div style={{ fontSize: '0.725rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
                    {v.visitTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Roommate Compatibility */}
      <RoommateCompatibility />
    </div>
  );
}
