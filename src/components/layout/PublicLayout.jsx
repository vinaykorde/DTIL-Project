import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../common/Navbar';
import { Building2, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* College Hostel Footer */}
      <footer
        style={{
          backgroundColor: 'var(--slate-900)',
          color: 'var(--slate-400)',
          padding: '3.5rem 1.5rem 2rem',
          borderTop: '1px solid var(--slate-800)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building2 size={20} />
              </div>
              <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem' }}>HostelSync</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-400)', lineHeight: 1.6 }}>
              A state-of-the-art campus housing management system designed for colleges and universities. Developed for DTIL academic project.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Portals</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/login" style={{ color: 'var(--slate-400)' }}>Student Housing Portal</Link></li>
              <li><Link to="/login" style={{ color: 'var(--slate-400)' }}>Hostel Warden Console</Link></li>
              <li><Link to="/login" style={{ color: 'var(--slate-400)' }}>Campus Administrator</Link></li>
              <li><a href="#features" style={{ color: 'var(--slate-400)' }}>Hostel Amenities & Rules</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>System Capabilities</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li>Instant Room Allocation Tracking</li>
              <li>24/7 Digital Grievance Redressal</li>
              <li>Automated Attendance & Leave Passes</li>
              <li>Gatekeeper Visitor Verification</li>
            </ul>
          </div>

          {/* Campus Contact */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Hostel Office</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--primary-400)" />
                <span>Central Campus, Student Housing Block A</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--primary-400)" />
                <span>+91 (020) 2550-7000</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--primary-400)" />
                <span>hosteloffice@college.edu</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.825rem'
          }}
        >
          <div>
            © 2026 HostelSync - College Hostel Management System. DTIL Project.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Built with React & modern web standards.
          </div>
        </div>
      </footer>
    </div>
  );
}
