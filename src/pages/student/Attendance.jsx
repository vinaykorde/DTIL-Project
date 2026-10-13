import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const rate = user?.attendanceRate || 88;

  // Mock calendar log for current month
  const days = [
    { date: '2026-09-01', status: 'Present', time: '09:45 PM' },
    { date: '2026-09-02', status: 'Present', time: '09:50 PM' },
    { date: '2026-09-03', status: 'Present', time: '09:30 PM' },
    { date: '2026-09-04', status: 'Present', time: '09:55 PM' },
    { date: '2026-09-05', status: 'Approved Leave', time: 'Authorized Pass' },
    { date: '2026-09-06', status: 'Approved Leave', time: 'Authorized Pass' },
    { date: '2026-09-07', status: 'Present', time: '09:40 PM' },
    { date: '2026-09-08', status: 'Absent', time: 'Curfew Violation' },
    { date: '2026-09-09', status: 'Present', time: '09:35 PM' },
    { date: '2026-09-10', status: 'Present', time: '09:48 PM' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Hostel Night Attendance & Curfew Record
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Daily 10:00 PM warden roll-call audit log and attendance standing
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="card" style={{ borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>CUMULATIVE ATTENDANCE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            {rate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Minimum required for hostel retention: 75%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>DAYS PRESENT THIS MONTH</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '0.25rem' }}>
            8 / 10
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Roll-calls verified by Warden Dr. Satish Sharma
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>AUTHORIZED LEAVES</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: '0.25rem' }}>
            2 Days
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Approved via student leave pass
          </div>
        </div>
      </div>

      {/* Daily Attendance History */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">September 2026 Daily Roll-Call Log</div>
            <div className="card-subtitle">Daily verification timestamp at Vikramshilla Boys Hostel</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Night Roll-Call Status</th>
                <th>Check-in Verification</th>
                <th>Curfew Compliance</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{d.date}</td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === 'Present'
                          ? 'badge-success'
                          : d.status === 'Approved Leave'
                          ? 'badge-info'
                          : 'badge-danger'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>{d.time}</td>
                  <td>
                    {d.status === 'Present' ? (
                      <span style={{ color: 'var(--success-700)', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={15} /> Within 10 PM Curfew
                      </span>
                    ) : d.status === 'Approved Leave' ? (
                      <span style={{ color: 'var(--info-700)', fontSize: '0.825rem', fontWeight: 600 }}>
                        Warden Approved Outstation
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger-700)', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <XCircle size={15} /> Unexcused Absence
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
