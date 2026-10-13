import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BedDouble, Building, Users, CheckCircle, Shield, Wifi, Wind, Bath, Lamp, Phone, Mail } from 'lucide-react';

export default function MyRoom() {
  const { user } = useAuth();

  const roomNumber = user?.room || '204';
  const hostelName = user?.hostel || 'Vikramshilla Boys Hostel';

  const roomDetails = {
    hostel: hostelName,
    roomNumber: roomNumber,
    floor: '2nd Floor, East Wing',
    roomType: 'Double Sharing (2 Beds)',
    capacity: 2,
    allottedBed: 'Bed A (Window Side)',
    amenities: [
      { name: 'High-speed Wi-Fi 6', icon: Wifi },
      { name: 'Split Air Conditioner', icon: Wind },
      { name: 'Attached Washroom & Geyser', icon: Bath },
      { name: 'Dual Study Desks with Lamps', icon: Lamp }
    ],
    roommates: [
      {
        name: 'Vinay Korde (You)',
        rollNo: 'STU-2024-001',
        dept: 'Information Technology',
        year: '3rd Year',
        bed: 'Bed A',
        phone: '+91 91234 56780',
        email: 'student@hostel.com'
      },
      {
        name: 'Aditya Verma',
        rollNo: 'STU-2024-002',
        dept: 'Computer Science & Engg',
        year: '3rd Year',
        bed: 'Bed B',
        phone: '+91 91234 56781',
        email: 'aditya.v@college.edu'
      }
    ],
    warden: {
      name: 'Dr. Satish Sharma',
      role: 'Head Hostel Warden',
      phone: '+91 98234 56789',
      cabin: 'Ground Floor Warden Office, Vikramshilla Hostel',
      email: 'warden@hostel.com'
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
              Allotment Details
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Room {roomNumber} • {hostelName}
            </h2>
          </div>
          <span className="badge badge-success">Allotment Active</span>
        </div>
      </div>

      {/* Grid: Details & Amenities */}
      <div className="grid-2">
        {/* Specifications */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
            Room Specifications
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>HOSTEL BLOCK</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>{roomDetails.hostel}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>FLOOR LOCATION</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>{roomDetails.floor}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ROOM TYPE</div>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>{roomDetails.roomType}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>YOUR ALLOTTED BED</div>
              <div style={{ fontWeight: 700, color: 'var(--primary-700)', marginTop: '0.2rem' }}>{roomDetails.allottedBed}</div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.75rem' }}>
              Room Amenities Included:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {roomDetails.amenities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--slate-700)', background: 'var(--slate-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <Icon size={16} color="var(--primary-600)" />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assigned Warden Info */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
            Assigned Block Warden
          </h3>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: 'var(--warning-50)',
                color: 'var(--warning-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem'
              }}
            >
              SS
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                {roomDetails.warden.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                {roomDetails.warden.role}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-700)' }}>
              <Phone size={16} color="var(--primary-600)" />
              <span>{roomDetails.warden.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-700)' }}>
              <Mail size={16} color="var(--primary-600)" />
              <span>{roomDetails.warden.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-700)' }}>
              <Building size={16} color="var(--primary-600)" />
              <span>{roomDetails.warden.cabin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roommates Directory */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
          Room Occupants & Roommates
        </h3>

        <div className="grid-2">
          {roomDetails.roommates.map((rm, i) => (
            <div
              key={i}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: rm.bed === 'Bed A' ? 'var(--primary-100)' : 'var(--slate-200)',
                  color: rm.bed === 'Bed A' ? 'var(--primary-700)' : 'var(--slate-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}
              >
                {rm.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>{rm.name}</span>
                  <span className="badge badge-primary">{rm.bed}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{rm.rollNo} • {rm.dept}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>{rm.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
