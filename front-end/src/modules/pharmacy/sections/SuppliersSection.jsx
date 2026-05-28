import { usePharmacyStore } from '../store/pharmacyStore';

export default function SuppliersSection() {
  const { suppliers } = usePharmacyStore();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Supplier Management</h1>
      <div className="ph-grid-2">
        {suppliers.map((s) => (
          <div key={s._id} className="ph-panel">
            <h3 className="ph-panel__title">{s.name}</h3>
            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{s.company}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--ph-muted)' }}>{s.address}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <span>⭐ {s.rating?.toFixed(1)}</span>
              <span>📞 {s.phone}</span>
              <span>Pending invoices: {s.pendingInvoices}</span>
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Last delivery: {s.lastDelivery ? new Date(s.lastDelivery).toLocaleDateString() : '—'}
            </p>
            <p style={{ fontSize: '0.75rem' }}>Supplies: {(s.medicinesSupplied || []).join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
