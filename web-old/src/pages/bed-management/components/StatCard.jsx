import React from 'react';

const StatCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className="surface stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div className="stat-icon" style={{
        backgroundColor: `${color}15`,
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <p className="stat-label">{title}</p>
        <h2 className="stat-value">{value}</h2>
        {subtitle && <p className="stat-sub">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
