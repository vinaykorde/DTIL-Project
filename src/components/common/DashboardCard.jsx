import React from 'react';

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color = '#2563eb',
  bgColor = '#eff6ff',
  trend,
  subtext,
  onClick
}) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ flex: 1 }}>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtext && (
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.35rem' }}>
            {subtext}
          </div>
        )}
        {trend && (
          <div className="stat-change" style={{ color: trend.startsWith('+') ? 'var(--success-600)' : 'var(--slate-500)' }}>
            {trend}
          </div>
        )}
      </div>
      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: bgColor, color: color }}>
          <Icon size={24} strokeWidth={2.2} />
        </div>
      )}
    </div>
  );
}
