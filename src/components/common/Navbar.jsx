import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Shield, ArrowRight, Menu, X } from 'lucide-react';
import Button from './Button';

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
              HostelSync
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hostel Management System
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          <a href="#home" style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.95rem' }}>Home</a>
          <a href="#about" style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.95rem' }}>About</a>
          <a href="#features" style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.95rem' }}>Features</a>
          <a href="#contact" style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.95rem' }}>Contact</a>
        </nav>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/register')}
            className="desktop-nav"
          >
            Register
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>

          {/* Mobile hamburger toggle */}
          <button
            className="btn-icon mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <a href="#home" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Home</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--slate-800)' }}>About</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Features</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Contact</a>
          <Button
            variant="outline"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
          >
            Create Student Account
          </Button>
          <Button
            variant="primary"
            style={{ width: '100%' }}
            onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
          >
            Login
          </Button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
