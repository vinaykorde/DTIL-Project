import React from 'react';
import { Search, Inbox } from 'lucide-react';

export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  actions,
  emptyMessage = 'No records found'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header with Search and Actions */}
      {(onSearchChange || actions) && (
        <div
          className="flex-mobile-col"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {onSearchChange && (
            <div className="w-full-mobile" style={{ position: 'relative', minWidth: '260px', maxWidth: '380px', flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)'
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {actions && <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={row[keyField] || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <div className="empty-state">
                    <Inbox className="empty-state-icon" size={40} />
                    <div className="empty-state-title">{emptyMessage}</div>
                    <p style={{ fontSize: '0.85rem' }}>Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--slate-500)' }}>
        <span>Showing {data.length} records</span>
      </div>
    </div>
  );
}
