import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  UserPlus,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  Camera,
  RefreshCw,
  Video,
  Upload,
  Key,
  Building,
  BedDouble,
  ShieldCheck
} from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import BatchStudentModal from '../../components/admin/BatchStudentModal';
import { createStudentAccounts, generateStrongPassword } from '../../services/studentCreationService';

export default function Students() {
  const { user } = useAuth();
  const { students, reloadStudents, addStudent, addStudentAccounts, updateStudent, deleteStudent } = useData();

  const isWarden = user?.role === 'warden';
  const wardenHostel = user?.hostel || 'Vikramshilla Boys Hostel';

  const [searchTerm, setSearchTerm] = useState('');
  const [hostelFilter, setHostelFilter] = useState(isWarden ? wardenHostel : 'All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [isReloading, setIsReloading] = useState(false);

  // Automatically refresh directory on mount to guarantee fresh Supabase sync
  useEffect(() => {
    if (reloadStudents) {
      reloadStudents();
    }
  }, []);

  // Modals state
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    password: '',
    phone: '',
    department: 'Computer Science & Engg',
    year: '3rd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: '',
    bed: 'Bed A',
    emergencyContact: '',
    address: '',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'Medium',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    referenceFacePhoto: null
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera for face registration.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg');
      setFormData(prev => ({ ...prev, referenceFacePhoto: photoDataUrl }));
      stopCamera();
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      email: '',
      password: '',
      phone: '',
      department: 'Computer Science & Engg',
      year: '3rd Year',
      hostel: isWarden ? wardenHostel : 'Vikramshilla Boys Hostel',
      room: '',
      bed: 'Bed A',
      status: 'Active',
      emergencyContact: '',
      address: '',
      sleepTime: 'Early',
      studyTime: 'Morning',
      cleanliness: 'Medium',
      foodPreference: 'Vegetarian',
      lightPreference: 'Bright',
      referenceFacePhoto: null
    });
    stopCamera();
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (stu) => {
    setEditStudent(stu);
    const rawRoom = stu.room === 'Unallocated' || stu.room === 'Pending' || stu.room === 'Pending Room' ? '' : (stu.room || '');
    setFormData({
      name: stu.name || '',
      studentId: stu.studentId || stu.id || '',
      email: stu.email || '',
      password: '',
      phone: stu.phone || '',
      department: stu.department || 'Computer Science & Engg',
      year: stu.year || '3rd Year',
      hostel: stu.hostel || (isWarden ? wardenHostel : 'Vikramshilla Boys Hostel'),
      room: rawRoom,
      bed: stu.bed || 'Bed A',
      status: stu.status || (rawRoom ? 'Active' : 'Pending Assignment'),
      emergencyContact: stu.emergencyContact || '',
      address: stu.address || '',
      sleepTime: stu.sleepTime || 'Early',
      studyTime: stu.studyTime || 'Morning',
      cleanliness: stu.cleanliness || 'Medium',
      foodPreference: stu.foodPreference || 'Vegetarian',
      lightPreference: stu.lightPreference || 'Bright',
      referenceFacePhoto: stu.referenceFacePhoto || null
    });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (editStudent) {
      const hasRoom = Boolean(formData.room && formData.room.trim().length > 0 && formData.room.trim().toLowerCase() !== 'pending');
      const assignedStatus = hasRoom
        ? (formData.status === 'Pending Assignment' ? 'Active' : (formData.status || 'Active'))
        : 'Pending Assignment';

      updateStudent(editStudent.id, {
        ...formData,
        room: hasRoom ? formData.room.trim() : 'Unallocated',
        status: assignedStatus
      });
      setEditStudent(null);
      resetForm();
    } else {
      // If a login password is provided, provision in Supabase Auth server-side
      if (formData.password && formData.password.trim().length >= 6) {
        try {
          const sid = formData.studentId?.trim() || `STU-2024-${Math.floor(100 + Math.random() * 900)}`;
          const res = await createStudentAccounts([
            {
              name: formData.name,
              studentId: sid,
              email: formData.email,
              password: formData.password,
              department: formData.department,
              year: formData.year,
              hostel: formData.hostel,
              room: formData.room,
              bed: formData.bed,
              phone: formData.phone
            }
          ]);

          if (res?.results?.[0]?.success) {
            addStudentAccounts(res.results);
            setIsAddOpen(false);
            resetForm();
            return;
          } else if (res?.results?.[0]?.error) {
            alert(`Account creation failed: ${res.results[0].error}`);
            return;
          }
        } catch (err) {
          alert(`Account creation error: ${err.message}`);
          return;
        }
      }

      // Default registration fallback
      addStudent({
        id: formData.studentId || `STU-2024-${Math.floor(100 + Math.random() * 900)}`,
        ...formData
      });
      setIsAddOpen(false);
      resetForm();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this student record from the hostel database?')) {
      deleteStudent(id);
    }
  };

  // Filtered dataset with strict Warden scoping
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.room && String(s.room).toLowerCase().includes(q));

      // Warden can ONLY see students belonging to their hostel
      let matchesHostel = true;
      if (isWarden) {
        matchesHostel = (s.hostel && s.hostel.toLowerCase().trim() === wardenHostel.toLowerCase().trim());
      } else {
        matchesHostel = hostelFilter === 'All' || s.hostel === hostelFilter;
      }

      const matchesDept = deptFilter === 'All' || s.department === deptFilter;
      const matchesYear = yearFilter === 'All' || s.year === yearFilter;

      return matchesSearch && matchesHostel && matchesDept && matchesYear;
    });
  }, [students, searchTerm, hostelFilter, deptFilter, yearFilter, isWarden, wardenHostel]);

  const columns = [
    {
      header: 'Student ID',
      key: 'id',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{row.studentId || row.id}</span>
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{row.name}</span>
            {row.authUserId && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                <Key size={10} /> Auth
              </span>
            )}
            {row.referenceFacePhoto ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: '#047857', backgroundColor: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                ✓ Face Enrolled
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                ✕ Face Missing
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{row.email}</div>
        </div>
      )
    },
    { header: 'Department', key: 'department' },
    { header: 'Year', key: 'year' },
    {
      header: 'Hostel & Room',
      render: (row) => {
        const isPendingRoom = !row.room || row.room === 'Pending' || row.room === 'Unallocated' || row.room === 'Pending Room' || String(row.room).trim() === '';
        const isPendingHostel = !row.hostel || row.hostel === 'Pending' || row.hostel === 'Pending Assignment';
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {isPendingRoom ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a' }}>
                  Pending Room
                </span>
              ) : (
                <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>
                  Room {row.room} {row.bed ? `(${row.bed})` : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: isPendingHostel ? '#b91c1c' : 'var(--slate-500)', marginTop: '2px' }}>
              {isPendingHostel ? 'Pending Hostel Assignment' : row.hostel}
            </div>
          </div>
        );
      }
    },
    { header: 'Contact', key: 'phone' },
    {
      header: 'Status',
      render: (row) => {
        const isPending = !row.room || row.room === 'Pending' || row.room === 'Unallocated' || row.room === 'Pending Room' || row.status === 'Pending Assignment' || !row.hostel;
        if (isPending) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, border: '1px solid #fde68a' }}>
              Pending Assignment
            </span>
          );
        }
        return <StatusBadge status={row.status || 'Active'} size="sm" />;
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <button
            className="btn-icon"
            onClick={() => setViewStudent(row)}
            style={{ color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)' }}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleOpenEdit(row)}
            style={{ color: 'var(--warning-700)', backgroundColor: 'var(--warning-50)' }}
            title="Assign / Edit Details"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleDelete(row.id)}
            style={{ color: 'var(--danger-700)', backgroundColor: 'var(--danger-50)' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div
        className="card flex-mobile-col-start"
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
            {isWarden ? `Student Residents – ${wardenHostel}` : 'Student Resident Directory'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            {isWarden
              ? `Manage student registrations, room allocations, and resident profiles for ${wardenHostel}`
              : 'Manage student registrations, hostel block assignments, and resident profiles across all hostels'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={isReloading}
            onClick={async () => {
              setIsReloading(true);
              try {
                if (reloadStudents) await reloadStudents();
              } finally {
                setIsReloading(false);
              }
            }}
          >
            Sync Directory
          </Button>
          {!isWarden && (
            <Button variant="secondary" icon={Users} onClick={() => setIsBatchOpen(true)}>
              Add Multiple Students
            </Button>
          )}
          <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
            Register Student
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card flex-mobile-col-start"
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '1rem 1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={16} /> Filters:
        </div>

        {/* Hostel Scope / Filter */}
        {isWarden ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bfdbfe'
            }}
          >
            <Building size={15} /> Scope: {wardenHostel}
          </div>
        ) : (
          <select
            className="form-select w-full-mobile"
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
        )}

        {/* Dept Filter */}
        <select
          className="form-select w-full-mobile"
          style={{ width: 'auto', minWidth: '190px' }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="All">All Departments</option>
          <option value="Computer Science & Engg">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Mechanical Engg">Mechanical Engg</option>
          <option value="Electronics & Telecomm">Electronics & Telecomm</option>
          <option value="Civil Engg">Civil Engg</option>
          <option value="Electrical Engg">Electrical Engg</option>
        </select>

        {/* Year Filter */}
        <select
          className="form-select w-full-mobile"
          style={{ width: 'auto', minWidth: '130px' }}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="All">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        {(hostelFilter !== 'All' || deptFilter !== 'All' || yearFilter !== 'All') && (
          <button
            onClick={() => { setHostelFilter('All'); setDeptFilter('All'); setYearFilter('All'); }}
            style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600 }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredStudents}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, student ID, room..."
      />

      {/* ================= MODAL: VIEW STUDENT ================= */}
      <Modal
        isOpen={Boolean(viewStudent)}
        onClose={() => setViewStudent(null)}
        title="Student Resident Profile"
      >
        {viewStudent && (
          <div>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800
                }}
              >
                {viewStudent.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{viewStudent.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>{viewStudent.id} • {viewStudent.department}</div>
                <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={viewStudent.status || 'Active'} size="sm" />
                  {viewStudent.authUserId && (
                    <span style={{ fontSize: '0.68rem', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Key size={10} /> Supabase Auth Linked
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Hostel Block</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.hostel || 'Pending Assignment'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room & Bed</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                  {viewStudent.room && viewStudent.room !== 'Unallocated' && viewStudent.room !== 'Pending'
                    ? `Room ${viewStudent.room} (${viewStudent.bed || 'Bed A'})`
                    : 'Pending Room Allocation'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Year of Study</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.year}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Attendance Record</div>
                <div style={{ fontWeight: 700, color: 'var(--success-700)' }}>{viewStudent.attendanceRate || 88}% Attendance</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Contact Phone</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.phone || 'Not provided'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Parent / Emergency</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.emergencyContact || 'Not provided'}</div>
              </div>
            </div>

            {/* Biometric Face Verification Status Card */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: viewStudent.referenceFacePhoto ? '#f0fdf4' : '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {viewStudent.referenceFacePhoto ? (
                  <img
                    src={viewStudent.referenceFacePhoto}
                    alt="Biometric Reference"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                    ✕
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: viewStudent.referenceFacePhoto ? '#065f46' : '#991b1b' }}>
                    {viewStudent.referenceFacePhoto ? '✓ Biometric Face Registered' : '✕ Biometric Face Missing'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: viewStudent.referenceFacePhoto ? '#047857' : '#b91c1c' }}>
                    {viewStudent.referenceFacePhoto
                      ? 'Face vector enrolled for campus geofenced attendance verification.'
                      : 'Student has not registered a face photo yet.'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.2rem' }}>Permanent Address</div>
              <div style={{ color: 'var(--slate-600)' }}>{viewStudent.address || 'Address registered on admission portal.'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }} className="stack-buttons-mobile">
              <Button variant="secondary" onClick={() => setViewStudent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: ADD / EDIT STUDENT ================= */}
      <Modal
        isOpen={isAddOpen || Boolean(editStudent)}
        onClose={() => { setIsAddOpen(false); setEditStudent(null); }}
        title={editStudent ? 'Edit Student Details' : 'Register New Student'}
      >
        <form onSubmit={handleSaveStudent}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '1rem' }}>Identity Verification</h4>
            
            {!formData.referenceFacePhoto && !isCameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <Camera size={32} color="var(--slate-400)" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>No reference face registered</div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button type="button" variant="secondary" icon={Video} onClick={startCamera}>
                    Open Camera
                  </Button>
                  <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: '#fff' }}>
                    <Upload size={16} />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, referenceFacePhoto: event.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--slate-900)', borderRadius: 'var(--radius-md)' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '320px', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}></video>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button type="button" variant="secondary" onClick={stopCamera}>Cancel</Button>
                  <Button type="button" variant="primary" icon={Camera} onClick={capturePhoto}>Capture Photo</Button>
                </div>
              </div>
            )}

            {formData.referenceFacePhoto && !isCameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <img src={formData.referenceFacePhoto} alt="Reference Face" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem', border: '3px solid var(--primary-500)' }} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button type="button" variant="secondary" icon={RefreshCw} onClick={() => setFormData(prev => ({ ...prev, referenceFacePhoto: null }))}>
                    Retake Photo
                  </Button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.5rem', textAlign: 'center' }}>
              This photo will be used for geo-verified presence checks. Students cannot change this photo themselves.
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student ID (Roll / Reg No.) *</label>
              <input
                type="text"
                className="form-input"
                value={formData.studentId || ''}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
                placeholder="e.g. STU-2024-002"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Address (Login Username) *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="rahul@college.edu"
              />
            </div>
            {!editStudent ? (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Login Password (Supabase Auth)</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, password: generateStrongPassword() }))}
                    style={{ fontSize: '0.72rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password (min 6 chars)"
                  minLength={6}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
            )}
          </div>

          {!editStudent && (
            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Computer Science & Engg">Computer Science & Engg</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engg">Mechanical Engg</option>
                <option value="Electronics & Telecomm">Electronics & Telecomm</option>
                <option value="Civil Engg">Civil Engg</option>
                <option value="Electrical Engg">Electrical Engg</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study *</label>
              <select
                className="form-select"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sleep Time *</label>
              <select className="form-select" value={formData.sleepTime} onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })} required>
                <option value="Early">Early</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Study Time *</label>
              <select className="form-select" value={formData.studyTime} onChange={(e) => setFormData({ ...formData, studyTime: e.target.value })} required>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Cleanliness *</label>
              <select className="form-select" value={formData.cleanliness} onChange={(e) => setFormData({ ...formData, cleanliness: e.target.value })} required>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Food Preference *</label>
              <select className="form-select" value={formData.foodPreference} onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })} required>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Light Preference *</label>
              <select className="form-select" value={formData.lightPreference} onChange={(e) => setFormData({ ...formData, lightPreference: e.target.value })} required>
                <option value="Bright">Bright</option>
                <option value="Dim">Dim</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hostel Block *</label>
              {isWarden ? (
                <input
                  type="text"
                  className="form-input"
                  value={wardenHostel}
                  disabled
                  style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)', fontWeight: 600 }}
                />
              ) : (
                <select
                  className="form-select"
                  value={formData.hostel}
                  onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                  required
                >
                  <option value="Vikramshilla Boys Hostel">Vikramshilla Boys Hostel</option>
                  <option value="Godavari Boys Hostel">Godavari Boys Hostel</option>
                  <option value="Ganga Girls Hostel">Ganga Girls Hostel</option>
                  <option value="Yamuna Girls Hostel">Yamuna Girls Hostel</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g. 204 (leave blank for Pending)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bed Allocation</label>
              <select
                className="form-select"
                value={formData.bed || 'Bed A'}
                onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
              >
                <option value="Bed A">Bed A</option>
                <option value="Bed B">Bed B</option>
                <option value="Bed C">Bed C</option>
                <option value="Bed D">Bed D</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Resident Status</label>
              <select
                className="form-select"
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Pending Assignment">Pending Assignment</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Emergency / Parent Contact</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+91 98220 11223 (Father)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Permanent Residence Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="City, State"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }} className="stack-buttons-mobile">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsAddOpen(false); setEditStudent(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editStudent ? 'Update Student' : 'Save & Allocate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: BATCH STUDENT CREATION ================= */}
      <BatchStudentModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onStudentsCreated={(createdList) => {
          addStudentAccounts(createdList);
        }}
      />
    </div>
  );
}
