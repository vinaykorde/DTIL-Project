import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  BedDouble,
  Plus,
  Filter,
  Users,
  CheckCircle,
  Building,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function Rooms() {
  const { rooms, addRoom } = useData();

  const [hostelFilter, setHostelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Room Form
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '1st Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    amenities: 'Wi-Fi, Attached Bath, Study Table'
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const amenitiesArr = newRoom.amenities
      ? newRoom.amenities.split(',').map(a => a.trim())
      : ['Wi-Fi', 'Attached Bath'];

    await addRoom({
      roomNumber: newRoom.roomNumber,
      hostel: newRoom.hostel,
      floor: newRoom.floor,
      roomType: newRoom.roomType,
      capacity: Number(newRoom.capacity),
      amenities: amenitiesArr
    });

    setIsAddOpen(false);
    setNewRoom({
      roomNumber: '',
      hostel: 'Vikramshilla Boys Hostel',
      floor: '1st Floor',
      roomType: 'Double Sharing',
      capacity: 2,
      amenities: 'Wi-Fi, Attached Bath, Study Table'
    });
  };

  const filteredRooms = rooms.filter(r => {
    const matchSearch = r.roomNumber.includes(searchTerm) || r.hostel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchHostel = hostelFilter === 'All' || r.hostel === hostelFilter;
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchHostel && matchStatus;
  });

  // Calculate stats
  const totalCount = rooms.length;
  const availableCount = rooms.filter(r => r.status === 'Available').length;
  const partialCount = rooms.filter(r => r.status === 'Partially Occupied').length;
  const fullCount = rooms.filter(r => r.status === 'Full').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header Card */}
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
            Hostel Room Inventory & Allocation
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Real-time visual map of capacity, occupancy status, and amenities
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsAddOpen(true)}>
          Add Room
        </Button>
      </div>

      {/* Summary Filter Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--primary-600)',
            backgroundColor: statusFilter === 'All' ? 'var(--primary-50)' : '#ffffff'
          }}
          onClick={() => setStatusFilter('All')}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Total Rooms</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>{totalCount}</div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--success-500)',
            backgroundColor: statusFilter === 'Available' ? 'var(--success-50)' : '#ffffff'
          }}
          onClick={() => setStatusFilter('Available')}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Available (Vacant)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-700)' }}>{availableCount}</div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--warning-500)',
            backgroundColor: statusFilter === 'Partially Occupied' ? 'var(--warning-50)' : '#ffffff'
          }}
          onClick={() => setStatusFilter('Partially Occupied')}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Partially Occupied</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning-700)' }}>{partialCount}</div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--danger-500)',
            backgroundColor: statusFilter === 'Full' ? 'var(--danger-50)' : '#ffffff'
          }}
          onClick={() => setStatusFilter('Full')}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Full Capacity</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-700)' }}>{fullCount}</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={16} /> Block:
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
          >
            <option value="All">All Hostels</option>
            <option value="Vikramshilla Boys Hostel">Vikramshilla Boys Hostel</option>
            <option value="Godavari Boys Hostel">Godavari Boys Hostel</option>
            <option value="Ganga Girls Hostel">Ganga Girls Hostel</option>
            <option value="Yamuna Girls Hostel">Yamuna Girls Hostel</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem' }}
            placeholder="Search room no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Visual Room Cards Grid */}
      <div className="grid-auto">
        {filteredRooms.map((room) => {
          const availableSlots = room.capacity - room.occupied;
          return (
            <div
              key={room.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${
                  room.status === 'Available'
                    ? 'var(--success-500)'
                    : room.status === 'Full'
                    ? 'var(--danger-500)'
                    : 'var(--warning-500)'
                }`,
                position: 'relative'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                      {room.floor}
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      Room {room.roomNumber}
                    </h3>
                  </div>
                  <StatusBadge status={room.status} size="sm" />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
                  <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {room.hostel}
                </div>

                {/* Capacity & Occupancy Meter */}
                <div
                  style={{
                    backgroundColor: 'var(--slate-50)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--slate-600)' }}>{room.roomType}</span>
                    <span style={{ color: 'var(--slate-900)' }}>
                      {room.occupied} / {room.capacity} Occupied
                    </span>
                  </div>

                  {/* Bed Progress Dots */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {Array.from({ length: room.capacity }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            idx < room.occupied ? 'var(--primary-600)' : 'var(--slate-200)'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ fontSize: '0.725rem', color: availableSlots > 0 ? 'var(--success-700)' : 'var(--slate-400)', marginTop: '0.35rem', fontWeight: 600 }}>
                    {availableSlots > 0 ? `${availableSlots} bed(s) available` : 'No vacant beds'}
                  </div>
                </div>

                {/* Occupants list */}
                {room.occupants && room.occupants.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
                      Current Residents:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {room.occupants.map((occ, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary-500)' }} />
                          {occ}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities tags */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {room.amenities &&
                  room.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--slate-100)',
                        color: 'var(--slate-600)'
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: ADD ROOM ================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Hostel Room">
        <form onSubmit={handleAddSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 208"
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Floor *</label>
              <select
                className="form-select"
                value={newRoom.floor}
                onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Hostel Block *</label>
              <select
                className="form-select"
                value={newRoom.hostel}
                onChange={(e) => setNewRoom({ ...newRoom, hostel: e.target.value })}
              >
                <option value="Vikramshilla Boys Hostel">Vikramshilla Boys Hostel</option>
                <option value="Godavari Boys Hostel">Godavari Boys Hostel</option>
                <option value="Ganga Girls Hostel">Ganga Girls Hostel</option>
                <option value="Yamuna Girls Hostel">Yamuna Girls Hostel</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Room Type *</label>
              <select
                className="form-select"
                value={newRoom.roomType}
                onChange={(e) => {
                  const type = e.target.value;
                  const cap = type.includes('Single') ? 1 : type.includes('Double') ? 2 : 3;
                  setNewRoom({ ...newRoom, roomType: type, capacity: cap });
                }}
              >
                <option value="Single Room">Single Room (1 Bed)</option>
                <option value="Double Sharing">Double Sharing (2 Beds)</option>
                <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Room Amenities (comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={newRoom.amenities}
              onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
              placeholder="e.g. Wi-Fi, Attached Bath, Balcony, Study Table"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Room
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
