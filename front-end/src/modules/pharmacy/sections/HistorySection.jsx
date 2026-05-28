import { usePharmacyStore } from '../store/pharmacyStore';

const TYPE_ICONS = {
  added: '➕',
  updated: '✏️',
  dispensed: '💊',
  returned: '↩️',
  expired: '⏳',
  removed: '🗑️',
  purchase_received: '📥',
};

export default function HistorySection() {
  const { history } = usePharmacyStore();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Medicine Movement History</h1>
      <div className="ph-panel">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {history.map((h) => (
            <li
              key={h._id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--ph-border)',
                fontSize: '0.85rem',
              }}
            >
              <span>{TYPE_ICONS[h.type] || '•'}</span>
              <div style={{ flex: 1 }}>
                <strong>{h.medicineName}</strong> — {h.type}
                {h.patientName && <span> · Patient: {h.patientName}</span>}
                {h.notes && <div style={{ color: 'var(--ph-muted)' }}>{h.notes}</div>}
              </div>
              <div style={{ textAlign: 'right', color: 'var(--ph-muted)' }}>
                <div>{h.pharmacistName || 'System'}</div>
                <div>{new Date(h.createdAt).toLocaleString()}</div>
                {h.quantity != null && <div>Qty: {h.quantity}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
