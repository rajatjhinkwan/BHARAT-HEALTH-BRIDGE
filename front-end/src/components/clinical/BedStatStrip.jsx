import { Shimmer } from '../SkeletonLoader';

export default function BedStatStrip({ stats, loading, variant = 'mini' }) {
  const items = [
    { key: 'total', label: 'Total Beds', className: '' },
    { key: 'available', label: 'Available', className: 'available' },
    { key: 'occupied', label: 'Occupied', className: 'occupied' },
    { key: 'cleaning', label: 'Cleaning', className: 'cleaning' },
    { key: 'critical', label: 'Critical', className: 'critical' },
  ];

  if (loading && stats.total === 0) {
    return (
      <div className={variant === 'mini' ? 'occupancy-mini-dashboard' : 'dashboard-stats-grid'}>
        {items.slice(0, 4).map((_, i) => (
          <div key={i} className="mini-stat-card">
            <Shimmer style={{ width: '40%', height: '10px', borderRadius: '4px' }} />
            <Shimmer style={{ width: '70%', height: '24px', borderRadius: '6px', marginTop: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {items.map((item) => (
          <div key={item.key} className={`stat-card bed-stat-${item.className || 'default'}`}>
            <span className="bed-stat-label">{item.label}</span>
            <div className="bed-stat-value">{stats[item.key] ?? 0}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="occupancy-mini-dashboard">
      {items.map((item) => (
        <div key={item.key} className={`mini-stat-card ${item.className}`}>
          <span className="mini-label">{item.label.toUpperCase()}</span>
          <span className="mini-value">{stats[item.key] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
