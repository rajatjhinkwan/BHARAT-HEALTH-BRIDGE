import { usePharmacyStore } from '../store/pharmacyStore';
import StatusChip from '../components/shared/StatusChip';

const BUCKETS = [
  { key: 'expired', title: 'Expired', className: 'ph-countdown--7' },
  { key: 'days7', title: 'Expiring in 7 days', className: 'ph-countdown--7' },
  { key: 'days15', title: 'Expiring in 15 days', className: 'ph-countdown--15' },
  { key: 'days30', title: 'Expiring in 30 days', className: 'ph-countdown--30' },
];

export default function ExpirySection() {
  const { expiry } = usePharmacyStore();
  if (!expiry) return <div className="ph-skeleton" style={{ height: 300 }} />;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Expiry Management</h1>
      <div className="ph-expiry-grid">
        {BUCKETS.map(({ key, title, className }) => (
          <div key={key} className="ph-expiry-bucket ph-panel">
            <h4>{title} ({(expiry[key] || []).length})</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {(expiry[key] || []).slice(0, 8).map((m) => (
                <li key={m.id || m._id} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  {m.name}
                  <div className={`ph-countdown ${className}`}>{m.expiryLabel}</div>
                  <StatusChip status={m.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
