import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { usePharmacyStore } from '../store/pharmacyStore';

export default function AnalyticsSection() {
  const { reports } = usePharmacyStore();
  const r = reports || {};

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Analytics & Reports</h1>
      <div className="ph-grid-2">
        <div className="ph-chart-box" style={{ gridColumn: 'span 2' }}>
          <h3 className="ph-panel__title">Most used medicines</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={r.mostUsed || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ph-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--ph-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ph-stat-grid" style={{ marginTop: '1.25rem', gridTemplateColumns: '1fr' }}>
        <div className="ph-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ph-stat-card__label" style={{ fontSize: '1rem', margin: 0 }}>Active Expiring / Expired Medicine SKUs</div>
          <div className="ph-stat-card__value" style={{ color: 'var(--ph-warn)' }}>{r.expiringCount ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
