import { usePharmacyStore } from '../store/pharmacyStore';

export default function AlertsSection() {
  const { alerts } = usePharmacyStore();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Alert Center</h1>
      <p style={{ color: 'var(--ph-muted)', marginBottom: '1.5rem' }}>
        Low stock, expiry, out-of-stock, and delayed supplier orders — updated live.
      </p>
      <div className="ph-alert-list">
        {alerts.length === 0 ? (
          <div className="ph-panel">No active alerts. Inventory is healthy.</div>
        ) : (
          alerts.map((a, i) => (
            <div
              key={i}
              className={`ph-alert-item ph-alert-item--${a.severity === 'critical' ? 'critical' : 'warning'}`}
            >
              <span style={{ fontSize: '1.25rem' }}>
                {a.type === 'low_stock' && '⚠️'}
                {a.type === 'out_of_stock' && '🚫'}
                {(a.type === 'expiring' || a.type === 'expired') && '⏳'}
                {a.type === 'delayed_order' && '📦'}
              </span>
              <div>
                <strong>{a.name || a.orderId || 'Alert'}</strong>
                <div>{a.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
