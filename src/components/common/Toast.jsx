import React from 'react';
import { useData } from '../../context/DataContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toastMessage, showToast } = useData();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'warning':
      case 'danger':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#2563eb" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.9rem 1.25rem',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderLeft: `4px solid ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#2563eb'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        maxWidth: '420px',
        animation: 'slideIn 250ms ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {getIcon()}
      <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--slate-800)', fontWeight: 500 }}>
        {message}
      </div>
      <button
        onClick={() => showToast(null)}
        style={{ color: 'var(--slate-400)', padding: 4 }}
        aria-label="Dismiss toast"
      >
        <X size={16} />
      </button>
    </div>
  );
}
