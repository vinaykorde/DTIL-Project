import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Receipt, CheckCircle, Download, FileText, Calendar, CreditCard } from 'lucide-react';
import Button from '../../components/common/Button';

export default function StudentFees() {
  const { user } = useAuth();

  const feeItems = [
    { title: 'Hostel Accommodation (Double Sharing AC)', amount: '₹ 26,000', period: 'Fall Semester 2026', status: 'Paid', receipt: 'RCPT-2026-401' },
    { title: 'Catering & Mess Charges (4 Meals/Day)', amount: '₹ 15,000', period: 'Fall Semester 2026', status: 'Paid', receipt: 'RCPT-2026-402' },
    { title: 'Wi-Fi & Common Facility Maintenance', amount: '₹ 3,000', period: 'Annual 2026-27', status: 'Paid', receipt: 'RCPT-2026-403' },
    { title: 'Refundable Hostel Caution Security Deposit', amount: '₹ 1,000', period: 'One Time (Admission)', status: 'Paid', receipt: 'RCPT-2026-404' }
  ];

  const handleDownload = (receiptNo) => {
    alert(`Downloading Official Payment E-Receipt ${receiptNo} for DTIL demo.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Hostel Fee Remittance & Dues Statement
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Detailed record of accommodation fees, mess subscriptions, and caution deposits
        </p>
      </div>

      {/* Highlights */}
      <div className="grid-3">
        <div className="card" style={{ borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>CURRENT BALANCE DUE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>₹ 0.00</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>All dues cleared for Fall 2026</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>TOTAL REMITTED</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>₹ 45,000</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Paid via Campus Online Gateway</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>NEXT DUE SEMESTER</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '0.45rem' }}>Spring 2027</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Due by January 10, 2027</div>
        </div>
      </div>

      {/* Fee Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Detailed Fee Component Breakdown</div>
            <div className="card-subtitle">Official university accounts receipt ledger</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Validity Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {feeItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Receipt #{item.receipt}</div>
                  </td>
                  <td style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>{item.period}</td>
                  <td style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '0.95rem' }}>{item.amount}</td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle size={13} /> {item.status}
                    </span>
                  </td>
                  <td>
                    <Button variant="outline" size="sm" icon={Download} onClick={() => handleDownload(item.receipt)}>
                      Download E-Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
