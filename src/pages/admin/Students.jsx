import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Video
} from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [hostelFilter, setHostelFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  // Modals state
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      email: '',
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
    stopCamera();
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (stu) => {
    setEditStudent(stu);
    setFormData({
      name: stu.name,
      email: stu.email,
      phone: stu.phone,
      department: stu.department,
      year: stu.year,
      hostel: stu.hostel,
      room: stu.room,
      bed: stu.bed || 'Bed A',
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

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (editStudent) {
      updateStudent(editStudent.id, formData);
      setEditStudent(null);
    } else {
      addStudent(formData);
      setIsAddOpen(false);
    }
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this student record from the hostel database?')) {
      deleteStudent(id);
    }
  };

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.room && s.room.includes(searchTerm));

      const matchesHostel = hostelFilter === 'All' || s.hostel === hostelFilter;
      const matchesDept = deptFilter === 'All' || s.department === deptFilter;
      const matchesYear = yearFilter === 'All' || s.year === yearFilter;

      return matchesSearch && matchesHostel && matchesDept && matchesYear;
    });
  }, [students, searchTerm, hostelFilter, deptFilter, yearFilter]);

  const columns = [
    {
      header: 'Student ID',
      key: 'id',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{row.id}</span>
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{row.email}</div>
        </div>
      )
    },
    { header: 'Department', key: 'department' },
    { header: 'Year', key: 'year' },
    {
      header: 'Hostel & Room',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Room {row.room}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{row.hostel}</div>
        </div>
      )
    },
    { header: 'Contact', key: 'phone' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'Active'} size="sm" />
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
            title="Edit"
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
            Student Resident Directory
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Manage student registrations, hostel block assignments, and resident profiles
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
          Register Student
        </Button>
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

        {/* Hostel Filter */}
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
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={viewStudent.status || 'Active'} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Hostel Block</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.hostel}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room & Bed</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Room {viewStudent.room} ({viewStudent.bed || 'Bed A'})</div>
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
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Parent / Emergency</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{viewStudent.emergencyContact || '+91 98220 11223'}</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <Camera size={32} color="var(--slate-400)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>No reference face registered</div>
                <Button type="button" variant="secondary" icon={Video} onClick={startCamera}>
                  Open Camera
                </Button>
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="rahul@college.edu"
              />
            </div>
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
          </div>

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
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input
                type="text"
                className="form-input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
                placeholder="e.g. 204"
              />
            </div>
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
    </div>
  );
}
