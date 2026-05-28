export default function StatCard({ icon, label, value, color = 'primary', delay = 0 }) {
  const bg = {
    primary: 'var(--ph-primary-soft)',
    green: 'var(--ph-green-soft)',
    warn: 'var(--ph-warn-soft)',
    danger: 'var(--ph-danger-soft)',
  }[color] || 'var(--ph-primary-soft)';

  return (
    <div className="ph-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="ph-stat-card__icon" style={{ background: bg }}>
        {icon}
      </div>
      <div className="ph-stat-card__value">{value ?? '—'}</div>
      <div className="ph-stat-card__label">{label}</div>
      <span className="ph-stat-card__spark" aria-hidden>
        ▁▂▃
      </span>
    </div>
  );
}
