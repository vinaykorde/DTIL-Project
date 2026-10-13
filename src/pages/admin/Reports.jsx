import React from 'react';
import { useData } from '../../context/DataContext';
import { BarChart3, Download, TrendingUp, Users, AlertTriangle, Calendar, FileText } from 'lucide-react';
import Button from '../../components/common/Button';

export default function Reports() {
  const { students, rooms, complaints, attendance } = useData();

  const handleExport = (type) => {
    alert(`Demo Action: Exporting ${type} report as CSV/PDF. In production, this generates a downloadable spreadsheet from backend analytics.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
            Housing Analytics & Audit Reports
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Consolidated operational data, turnover metrics, and resident compliance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleExport('Complete Monthly')}>
            Export Audit CSV
          </Button>
          <Button variant="primary" size="sm" icon={FileText} onClick={() => handleExport('Executive Summary')}>
            Print Executive Summary
          </Button>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid-3">
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>AVERAGE OCCUPANCY</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '0.35rem' }}>84.2%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-600)', fontWeight: 600, marginTop: '0.25rem' }}>
            +4.1% compared to last semester
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>GRIEVANCE RESOLUTION TIME</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-600)', marginTop: '0.35rem' }}>18.4 hrs</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Average turnaround across 81 tickets
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>ATTENDANCE COMPLIANCE</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: '0.35rem' }}>91.8%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Average night roll-call compliance
          </div>
        </div>
      </div>

      {/* Reports Breakdown Cards */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--slate-900)' }}>
            Hostel Block Summary Breakdown
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hostel Block</th>
                  <th>Capacity</th>
                  <th>Occupied</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Vikramshilla Boys Hostel', cap: 90, occ: 84, rate: '93%' },
                  { name: 'Godavari Boys Hostel', cap: 80, occ: 68, rate: '85%' },
                  { name: 'Ganga Girls Hostel', cap: 100, occ: 90, rate: '90%' },
                  { name: 'Yamuna Girls Hostel', cap: 70, occ: 52, rate: '74%' }
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>{row.cap} beds</td>
                    <td>{row.occ} beds</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--slate-900)' }}>
            Available Downloadable Reports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { title: 'Student Resident Master Roster', desc: 'Full student directory with room allocations and parent contacts', format: 'CSV • 420 KB' },
              { title: 'Monthly Maintenance & Repair Audit', desc: 'Resolved complaints, parts requisition, and turnaround metrics', format: 'PDF • 1.2 MB' },
              { title: 'Night Curfew & Attendance Audit Log', desc: 'Daily roll call compliance, leaves approved, and late-entry logs', format: 'Excel • 850 KB' },
              { title: 'Hostel Fee Collection & Arrears', desc: 'Summary of paid rent, pending mess balances, and caution money', format: 'PDF • 600 KB' }
            ].map((rep, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--slate-900)' }}>{rep.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{rep.desc}</div>
                </div>
                <Button variant="outline" size="sm" icon={Download} onClick={() => handleExport(rep.title)}>
                  {rep.format.split(' • ')[0]}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
