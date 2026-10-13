import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Users,
  AlertTriangle,
  CalendarCheck,
  Bell,
  Eye,
  Receipt,
  BarChart3,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Building,
  KeyRound,
  GraduationCap
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BedDouble,
      title: 'Room Management',
      desc: 'Real-time room occupancy tracking, floor layouts, single/double/triple sharing allocation, and maintenance records.',
      color: '#2563eb',
      bgColor: '#eff6ff'
    },
    {
      icon: Users,
      title: 'Student Management',
      desc: 'Comprehensive student resident records, room mapping, parent & emergency contacts, and academic details.',
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      icon: AlertTriangle,
      title: 'Complaint Management',
      desc: '24/7 digital ticketing for electrical, plumbing, Wi-Fi, cleaning and mess issues with real-time resolution workflow.',
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    {
      icon: CalendarCheck,
      title: 'Daily Attendance',
      desc: 'Effortless evening roll-calls, curfew tracking, automatic absentee flags, and student attendance percentage analytics.',
      color: '#8b5cf6',
      bgColor: '#faf5ff'
    },
    {
      icon: Bell,
      title: 'Notices & Announcements',
      desc: 'Instant broadcast of circulars, maintenance schedules, sports meets, and emergency notifications to all residents.',
      color: '#06b6d4',
      bgColor: '#f0fdfa'
    },
    {
      icon: Eye,
      title: 'Visitor Management',
      desc: 'Digital check-in and check-out logs for visiting parents and guests with security verification at campus gates.',
      color: '#ec4899',
      bgColor: '#fdf2f8'
    },
    {
      icon: Receipt,
      title: 'Fee Management',
      desc: 'Transparent hostel rent, mess bills, security deposits, payment status, and downloadable receipts.',
      color: '#14b8a6',
      bgColor: '#f0fdfa'
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Reports',
      desc: 'Data-driven insights into hostel occupancy rates, maintenance turnaround time, and administrative audits.',
      color: '#6366f1',
      bgColor: '#eef2ff'
    }
  ];

  return (
    <div id="home">
      {/* ================= HERO SECTION ================= */}
      <section
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f1f5f9 100%)',
          padding: '4.5rem 1.5rem 5.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            alignItems: 'center',
            gap: '3.5rem'
          }}
          className="hero-grid"
        >
          {/* Left Text */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                border: '1px solid var(--primary-200)'
              }}
            >
              <Sparkles size={16} /> DTIL Academic Project • Next-Gen Campus Living
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: 800,
                color: 'var(--slate-950)',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem'
              }}
            >
              Smart Hostel <span style={{ color: 'var(--primary-600)' }}>Management System</span>
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--slate-600)',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '560px'
              }}
            >
              Manage hostel rooms, students, complaints, attendance, notices and daily hostel activities from one platform.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate('/login')}
              >
                Access Portal Login
              </Button>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Quick trust metrics */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                marginTop: '2.75rem',
                paddingTop: '2rem',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>4</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Hostel Blocks</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>400+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Student Residents</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>99.4%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Grievance Resolution</div>
              </div>
            </div>
          </div>

          {/* Right Hero Illustration / Modern Interactive Card */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xl)',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Building size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                      Vikramshilla Boys Hostel • B-Block
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--slate-500)' }}>
                      Live Status: 92% Occupied • 24 Active Rooms
                    </div>
                  </div>
                </div>
                <span className="badge badge-success">Operational</span>
              </div>

              {/* Sample Room Slots Visual */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room 101</div>
                  <div style={{ fontWeight: 800, color: 'var(--danger-600)', fontSize: '0.95rem' }}>Full</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room 102</div>
                  <div style={{ fontWeight: 800, color: 'var(--warning-600)', fontSize: '0.95rem' }}>1/2 Bed</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room 103</div>
                  <div style={{ fontWeight: 800, color: 'var(--success-600)', fontSize: '0.95rem' }}>Available</div>
                </div>
              </div>

              {/* Interactive Role Quick Launch Preview */}
              <div style={{ background: 'var(--primary-50)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                  Role-Based Smart Access
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={14} /> Admin
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <KeyRound size={14} /> Warden
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <GraduationCap size={14} /> Student
                  </span>
                </div>
              </div>

              {/* Sample Quick Complaint Notification */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-50)',
                    color: 'var(--success-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle size={18} />
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Complaint #CMP-079 Resolved: </span>
                  <span style={{ color: 'var(--slate-500)' }}>Bathroom tap leakage fixed by maintenance staff</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" style={{ padding: '5.5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 4rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}
            >
              Unified Architecture
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--slate-900)' }}>
              Everything You Need To Run Campus Hostels
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--slate-600)', marginTop: '0.75rem' }}>
              Built specifically for college campuses with dedicated workflows for students, wardens, and administrative authorities.
            </p>
          </div>

          <div className="grid-4" style={{ gap: '1.75rem' }}>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: feat.bgColor,
                      color: feat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6, flex: 1 }}>
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section id="about" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--slate-50)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Academic DTIL Project
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1.25rem' }}>
                Bridging Campus Living with Modern Digital Engineering
              </h2>
              <p style={{ color: 'var(--slate-600)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Traditional college hostels struggle with paper-based attendance registers, lost maintenance complaint slips, and cumbersome gate passes.
              </p>
              <p style={{ color: 'var(--slate-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                <strong>HostelSync</strong> delivers a centralized, secure, and responsive web application where all campus stakeholders interact transparently in real-time.
              </p>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Try Demo Portals
              </Button>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
                System Stakeholders
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Administrators</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Overall housing statistics, room allocation audits, fee records, and system settings.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--success-50)', color: 'var(--success-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Hostel Wardens</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Daily attendance, leave sanctioning, visitor approvals, and resolving student issues.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--warning-50)', color: 'var(--warning-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Student Residents</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Room details, raise complaints, track leave status, check attendance & notice board.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.75rem' }}>
            Have Questions About Campus Housing?
          </h2>
          <p style={{ color: 'var(--slate-600)', marginBottom: '2rem' }}>
            Reach out to the Central Hostel Administration office or submit an inquiry.
          </p>

          <div
            style={{
              background: 'var(--slate-50)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Helpline</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>+91 98234 56789</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Support Email</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>hostel-support@college.edu</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Office Hours</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>Mon - Sat: 9 AM - 6 PM</div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
