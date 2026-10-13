import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, Check, X, Filter, Save, Users } from 'lucide-react';
import Button from '../../components/common/Button';

export default function WardenAttendance() {
  const { students, attendance, recordAttendance } = useData();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHostel, setSelectedHostel] = useState(user?.hostel || 'Vikramshilla Boys Hostel');
  const [selectedRoom, setSelectedRoom] = useState('All');

  // Filter students by selected hostel and room
  const relevantStudents = students.filter(s => {
    const matchHostel = s.hostel === selectedHostel;
    const matchRoom = selectedRoom === 'All' || s.room === selectedRoom;
    return matchHostel && matchRoom;
  });

  // Unique rooms in this hostel
  const roomsInHostel = Array.from(new Set(students.filter(s => s.hostel === selectedHostel).map(s => s.room))).sort();

  // Local state for attendance toggles
  const [attendanceMap, setAttendanceMap] = useState(() => {
    const map = {};
    students.forEach(s => {
      // Find existing status or default to Present
      const existing = attendance.find(a => a.studentId === s.id);
      map[s.id] = existing ? existing.status : 'Present';
    });
    return map;
  });

  const toggleStatus = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    const nextMap = { ...attendanceMap };
    relevantStudents.forEach(s => {
      nextMap[s.id] = status;
    });
    setAttendanceMap(nextMap);
  };

  const handleSaveAttendance = async () => {
    const records = relevantStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      room: s.room,
      hostel: selectedHostel,
      status: attendanceMap[s.id] || 'Present'
    }));

    await recordAttendance({
      date: selectedDate,
      hostel: selectedHostel,
      records
    });
  };

  const presentCount = relevantStudents.filter(s => attendanceMap[s.id] === 'Present').length;
  const absentCount = relevantStudents.filter(s => attendanceMap[s.id] === 'Absent').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
            Daily Night Roll-Call & Curfew Attendance
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Record evening attendance per hostel room and flag curfew violations
          </p>
        </div>
        <Button variant="primary" icon={Save} onClick={handleSaveAttendance}>
          Save Attendance Sheet
        </Button>
      </div>

      {/* Control Bar: Date, Hostel, Room */}
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
              ATTENDANCE DATE
            </label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '160px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
              HOSTEL BLOCK
            </label>
            <select
              className="form-select"
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="Vikramshilla Boys Hostel">Vikramshilla Boys Hostel</option>
              <option value="Godavari Boys Hostel">Godavari Boys Hostel</option>
              <option value="Ganga Girls Hostel">Ganga Girls Hostel</option>
              <option value="Yamuna Girls Hostel">Yamuna Girls Hostel</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.25rem' }}>
              FILTER ROOM
            </label>
            <select
              className="form-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              <option value="All">All Rooms</option>
              {roomsInHostel.map(r => (
                <option key={r} value={r}>Room {r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => markAll('Present')}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--success-700)' }}
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('Absent')}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger-700)' }}
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Attendance Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--primary-600)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>STUDENTS ON ROLL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)' }}>{relevantStudents.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>PRESENT TONIGHT</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success-700)' }}>{presentCount}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ABSENT / UNACCOUNTED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger-700)' }}>{absentCount}</div>
        </div>
      </div>

      {/* Table: Student Name | Room | Status */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Room Number</th>
                <th>Department & Year</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Attendance Action</th>
              </tr>
            </thead>
            <tbody>
              {relevantStudents.map(student => {
                const status = attendanceMap[student.id] || 'Present';
                const isPresent = status === 'Present';

                return (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{student.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{student.phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--slate-800)', fontSize: '0.95rem' }}>
                        Room {student.room}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                      {student.department} • {student.year}
                    </td>
                    <td>
                      <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => toggleStatus(student.id)}
                          className={`btn btn-sm ${isPresent ? 'btn-success' : 'btn-secondary'}`}
                          style={{ minWidth: '85px' }}
                        >
                          <Check size={14} /> Present
                        </button>
                        <button
                          onClick={() => toggleStatus(student.id)}
                          className={`btn btn-sm ${!isPresent ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ minWidth: '85px' }}
                        >
                          <X size={14} /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
