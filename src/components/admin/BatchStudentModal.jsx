import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Key,
  ShieldCheck,
  Building
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  generateStrongPassword,
  validateStudent,
  checkBatchInternalDuplicates,
  createStudentAccounts
} from '../../services/studentCreationService';

const DEFAULT_HOSTEL = 'Vikramshilla Boys Hostel';
const DEFAULT_DEPT = 'Information Technology';
const DEFAULT_YEAR = '1st Year';

export default function BatchStudentModal({ isOpen, onClose, onStudentsCreated }) {
  const [mode, setMode] = useState('table'); // 'table' | 'csv'
  const [csvText, setCsvText] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdSummary, setCreatedSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initial rows
  const [rows, setRows] = useState([
    {
      id: 1,
      name: '',
      studentId: '',
      email: '',
      password: generateStrongPassword(),
      department: DEFAULT_DEPT,
      year: DEFAULT_YEAR,
      hostel: DEFAULT_HOSTEL,
      room: '201',
      bed: 'Bed A'
    }
  ]);

  const handleAddRow = () => {
    const nextId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows(prev => [
      ...prev,
      {
        id: nextId,
        name: '',
        studentId: '',
        email: '',
        password: generateStrongPassword(),
        department: DEFAULT_DEPT,
        year: DEFAULT_YEAR,
        hostel: DEFAULT_HOSTEL,
        room: '',
        bed: 'Bed A'
      }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleGenerateAllPasswords = () => {
    setRows(prev =>
      prev.map(r => ({ ...r, password: generateStrongPassword() }))
    );
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // CSV parsing
  const handleParseCsv = () => {
    setErrorMessage('');
    if (!csvText.trim()) {
      setErrorMessage('Please paste at least one line of student details.');
      return;
    }

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedRows = [];

    lines.forEach((line, idx) => {
      // Split by comma or tab
      const parts = line.split(/[,\t]+/).map(p => p.trim());
      if (parts.length >= 3) {
        const [name, studentId, email, password, hostel, room, dept, year] = parts;
        parsedRows.push({
          id: idx + 1,
          name: name || '',
          studentId: studentId || '',
          email: email || '',
          password: password || generateStrongPassword(),
          hostel: hostel || DEFAULT_HOSTEL,
          room: room || '201',
          bed: 'Bed A',
          department: dept || DEFAULT_DEPT,
          year: year || DEFAULT_YEAR
        });
      }
    });

    if (parsedRows.length === 0) {
      setErrorMessage('Could not parse student records. Expected format: Full Name, Student ID, Email, Password');
      return;
    }

    setRows(parsedRows);
    setMode('table');
  };

  // Submit batch creation to server-side endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Check client validation
    const internalDup = checkBatchInternalDuplicates(rows);
    if (internalDup.hasDuplicates) {
      setErrorMessage(internalDup.duplicateDetails.join('\n'));
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const val = validateStudent(rows[i]);
      if (!val.valid) {
        setErrorMessage(`Student #${i + 1} (${rows[i].name || 'Unnamed'}): ${val.errors.join(' ')}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await createStudentAccounts(rows);

      if (response && response.results) {
        const successes = response.results.filter(r => r.success);
        setCreatedSummary({
          results: response.results,
          successCount: successes.length,
          failureCount: response.results.length - successes.length,
          message: response.message,
          hasServiceKey: response.hasServiceKey
        });

        // Add to parent DataContext
        if (successes.length > 0 && typeof onStudentsCreated === 'function') {
          onStudentsCreated(successes);
        }
      } else {
        throw new Error(response.message || 'Unexpected response from account creation server.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create student accounts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdSummary) return;
    const lines = createdSummary.results
      .filter(r => r.success)
      .map(r => {
        const originalRow = rows.find(row => (row.studentId || row.student_id) === r.studentId || row.email === r.email);
        const pass = originalRow?.password || '(Provided during setup)';
        return `Name: ${r.name} | ID: ${r.studentId} | Email: ${r.email} | Password: ${pass} | Role: student`;
      });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetAndClose = () => {
    setCreatedSummary(null);
    setErrorMessage('');
    setRows([
      {
        id: 1,
        name: '',
        studentId: '',
        email: '',
        password: generateStrongPassword(),
        department: DEFAULT_DEPT,
        year: DEFAULT_YEAR,
        hostel: DEFAULT_HOSTEL,
        room: '201',
        bed: 'Bed A'
      }
    ]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Create Student User Accounts (Supabase Auth)"
      maxWidth="940px"
    >
      {/* If creation was completed, show success credential report */}
      {createdSummary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: createdSummary.failureCount === 0 ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${createdSummary.failureCount === 0 ? '#a7f3d0' : '#fde68a'}`,
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}
          >
            <CheckCircle2 size={24} color={createdSummary.failureCount === 0 ? '#059669' : '#d97706'} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
                Account Creation Complete
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                {createdSummary.message}
              </p>
              {!createdSummary.hasServiceKey && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#b45309' }}>
                  ℹ️ Note: Created via Supabase Auth signup. If email confirmation is enabled in your Supabase project, students must verify their email before logging in. To enable instant login without confirmation, add <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>.
                </div>
              )}
            </div>
          </div>

          {/* Credentials Summary Table */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--slate-50)',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                Provisioned Accounts ({createdSummary.successCount})
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopyCredentials}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials List'}
              </Button>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--slate-100)', textAlign: 'left', color: 'var(--slate-600)' }}>
                    <th style={{ padding: '0.6rem 1rem' }}>Student ID</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Email / Username</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Password</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {createdSummary.results.map((res, i) => {
                    const rowData = rows.find(r => (r.studentId || r.student_id) === res.studentId || r.email === res.email);
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: res.success ? '#ffffff' : '#fef2f2'
                        }}
                      >
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                          {res.studentId || '—'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 600, color: 'var(--slate-900)' }}>
                          {res.name}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--slate-700)' }}>
                          {res.email}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', color: 'var(--slate-800)' }}>
                          {rowData?.password || '••••••••'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem' }}>
                          {res.success ? (
                            <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={14} /> Created
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                              {res.error || 'Failed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="primary" onClick={handleResetAndClose}>
              Done & View in Directory
            </Button>
          </div>
        </div>
      ) : (
        /* Form Entry View */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Info Banner */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              backgroundColor: '#eff6ff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bfdbfe',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}
          >
            <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.45 }}>
              <strong>Secure Server-Side Provisioning:</strong> Each student will receive a unique Supabase Auth login account and a linked row in the <code>profiles</code> table with the <strong>student</strong> role. Passwords and credentials are encrypted on the server.
            </div>
          </div>

          {/* Mode Switch Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--slate-100)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => setMode('table')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: mode === 'table' ? '#ffffff' : 'transparent',
                  color: mode === 'table' ? 'var(--slate-900)' : 'var(--slate-600)',
                  boxShadow: mode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Interactive Rows ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setMode('csv')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: mode === 'csv' ? '#ffffff' : 'transparent',
                  color: mode === 'csv' ? 'var(--slate-900)' : 'var(--slate-600)',
                  boxShadow: mode === 'csv' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Quick Paste / CSV
              </button>
            </div>

            {mode === 'table' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleGenerateAllPasswords}
                  title="Generate strong random passwords for all rows"
                >
                  Generate All Passwords
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddRow}
                >
                  Add Another Student
                </Button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
                color: '#b91c1c',
                fontSize: '0.82rem',
                whiteSpace: 'pre-line'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* CSV Mode Textarea */}
          {mode === 'csv' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                Paste lines in the format: <code>Full Name, Student ID, Email, Password, Hostel, Room</code>
              </div>
              <textarea
                className="form-input"
                rows={7}
                style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.5 }}
                placeholder={`Aditya Joshi, STU-2024-002, aditya.joshi@hostel.com, Pass@1234, Vikramshilla Boys Hostel, 201\nPriya Patel, STU-2024-003, priya.patel@hostel.com, Pass@5678, Ganga Girls Hostel, 102`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button type="button" variant="primary" icon={FileText} onClick={handleParseCsv}>
                  Parse & Load into Rows
                </Button>
              </div>
            </div>
          ) : (
            /* Table / Row Mode */
            <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rows.map((row, index) => {
                  const isVisible = showPasswords[row.id];
                  return (
                    <div
                      key={row.id}
                      style={{
                        padding: '1rem',
                        borderBottom: index < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : 'var(--slate-50)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-700)', letterSpacing: '0.5px' }}>
                          STUDENT #{index + 1}
                        </span>
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            style={{
                              color: 'var(--danger-600)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem'
                            }}
                            title="Remove this row"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      {/* Primary Credentials Grid */}
                      <div className="grid-2" style={{ gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '3px' }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                            placeholder="e.g. Rahul Sharma"
                            value={row.name}
                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '3px' }}>
                            Student ID (Roll / Reg. No.) *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', fontWeight: 600 }}
                            placeholder="e.g. STU-2024-002"
                            value={row.studentId}
                            onChange={(e) => handleRowChange(row.id, 'studentId', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid-2" style={{ gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '3px' }}>
                            Login Email *
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                            placeholder="e.g. student@hostel.com"
                            value={row.email}
                            onChange={(e) => handleRowChange(row.id, 'email', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                              Password *
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRowChange(row.id, 'password', generateStrongPassword())}
                              style={{ fontSize: '0.72rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Auto-Generate
                            </button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={isVisible ? 'text' : 'password'}
                              className="form-input"
                              style={{ padding: '0.45rem 2.2rem 0.45rem 0.65rem', fontSize: '0.85rem', fontFamily: isVisible ? 'inherit' : 'monospace' }}
                              placeholder="Minimum 6 characters"
                              value={row.password}
                              onChange={(e) => handleRowChange(row.id, 'password', e.target.value)}
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(row.id)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--slate-400)',
                                cursor: 'pointer'
                              }}
                            >
                              {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Hostel & Academic Assignment */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', paddingTop: '0.25rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>
                            Department
                          </label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            value={row.department}
                            onChange={(e) => handleRowChange(row.id, 'department', e.target.value)}
                          >
                            <option value="Information Technology">Information Technology</option>
                            <option value="Computer Science & Engg">Computer Science & Engg</option>
                            <option value="Mechanical Engg">Mechanical Engg</option>
                            <option value="Electronics & Telecomm">Electronics & Telecomm</option>
                            <option value="Civil Engg">Civil Engg</option>
                            <option value="Electrical Engg">Electrical Engg</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>
                            Year
                          </label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            value={row.year}
                            onChange={(e) => handleRowChange(row.id, 'year', e.target.value)}
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>
                            Hostel Block
                          </label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            value={row.hostel}
                            onChange={(e) => handleRowChange(row.id, 'hostel', e.target.value)}
                          >
                            <option value="Vikramshilla Boys Hostel">Vikramshilla Boys</option>
                            <option value="Godavari Boys Hostel">Godavari Boys</option>
                            <option value="Ganga Girls Hostel">Ganga Girls</option>
                            <option value="Yamuna Girls Hostel">Yamuna Girls</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: '2px' }}>
                            Room
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            placeholder="e.g. 201"
                            value={row.room}
                            onChange={(e) => handleRowChange(row.id, 'room', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Total Accounts to Create: <strong>{rows.length}</strong>
            </span>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={handleResetAndClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Supabase Auth Accounts...' : `Create ${rows.length} Student Account${rows.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
