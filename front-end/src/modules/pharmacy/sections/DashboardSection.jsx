import { useState, useEffect } from 'react';
import StatCard from '../components/shared/StatCard';
import { usePharmacyStore } from '../store/pharmacyStore';
import StatusChip from '../components/shared/StatusChip';
import { fetchMedicines } from '../api/pharmacyApi';

const CARDS = [
  { key: 'totalMedicines', label: 'Total Medicines', icon: '💊', color: 'primary' },
  { key: 'availableStock', label: 'Available Stock', icon: '📦', color: 'green' },
  { key: 'lowStock', label: 'Low Stock', icon: '⚠️', color: 'warn' },
  { key: 'outOfStock', label: 'Out of Stock', icon: '🚫', color: 'danger' },
  { key: 'expiringSoon', label: 'Expiring Soon', icon: '⏳', color: 'warn' },
];

export default function DashboardSection() {
  const { stats, loading } = usePharmacyStore();
  const [zoomCategory, setZoomCategory] = useState(null);
  const [allMeds, setAllMeds] = useState([]);
  const [zoomLoading, setZoomLoading] = useState(false);

  // Fetch the full medicine catalog dynamically when a Zoom modal category is opened
  useEffect(() => {
    if (!zoomCategory) return;
    setZoomLoading(true);
    fetchMedicines({ limit: 250 })
      .then((data) => {
        setAllMeds(data.items || data || []);
      })
      .catch(() => {
        setAllMeds([]);
      })
      .finally(() => {
        setZoomLoading(false);
      });
  }, [zoomCategory]);

  if (loading && !stats) {
    return (
      <div className="ph-stat-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="ph-panel"><div className="ph-skeleton" style={{ height: 80 }} /></div>
        ))}
      </div>
    );
  }

  const s = stats || {};

  // Categorize items dynamically for the Zoom View based on the live complete database
  const getZoomedDetails = () => {
    switch (zoomCategory) {
      case 'totalMedicines':
        return { title: 'All Registered Medicines', items: allMeds };
      case 'availableStock':
        return { 
          title: 'Available & Healthy Stock', 
          items: allMeds.filter((m) => m.status === 'healthy' && m.stockQuantity > (m.minimumStock || 10)) 
        };
      case 'lowStock':
        return { 
          title: 'Low Stock Alerts', 
          items: allMeds.filter((m) => m.status === 'low_stock' || (m.stockQuantity > 0 && m.stockQuantity <= (m.minimumStock || 10))) 
        };
      case 'outOfStock':
        return { 
          title: 'Out of Stock (Replenish Immediately)', 
          items: allMeds.filter((m) => m.status === 'out_of_stock' || (m.stockQuantity || 0) <= 0) 
        };
      case 'expiringSoon':
        return { 
          title: 'SKUs Expiring / Expired soon', 
          items: allMeds.filter((m) => m.status === 'expiring_soon' || m.status === 'expired') 
        };
      default:
        return { title: '', items: [] };
    }
  };

  const zoomDetails = getZoomedDetails();

  return (
    <div>
      {/* Dashboard Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--ph-text)' }}>Pharmacy Dashboard</h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--ph-muted)' }}>Real-time inpatient stock telemetry and status counters.</p>
        </div>
        <span className="ph-live">Live stock sync</span>
      </div>

      {/* 5 Core Statistics Cards (Ultra Minimalist Grid) */}
      <div className="ph-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {CARDS.map((c, i) => (
          <div 
            key={c.key} 
            onClick={() => setZoomCategory(c.key)} 
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            <StatCard
              icon={c.icon}
              label={c.label}
              value={s[c.key] ?? 0}
              color={c.color}
              delay={i * 40}
            />
          </div>
        ))}
      </div>

      {/* Dynamic Statistics Zoom Overlay Modal */}
      {zoomCategory && (
        <div className="ph-modal-overlay" onClick={() => setZoomCategory(null)}>
          <div className="ph-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            
            {/* Header */}
            <div className="ph-modal__header" style={{ borderBottom: '1px solid var(--ph-border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ph-text)' }}>
                  🔍 Zoom View: {zoomDetails.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ph-muted)' }}>
                  Displaying {zoomDetails.items.length} matched medicine records in this section
                </span>
              </div>
              <button 
                type="button" 
                className="ph-btn" 
                onClick={() => setZoomCategory(null)}
                style={{ borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Body listing medicines */}
            <div className="ph-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem' }}>
              {zoomLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="ph-skeleton" style={{ height: 48, borderRadius: '12px' }} />
                  ))}
                </div>
              ) : zoomDetails.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ph-muted)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🍃</span>
                  No medicine entries exist in this active category.
                </div>
              ) : (
                <table className="ph-table" style={{ width: '100%', minWidth: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--ph-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '0.75rem', fontSize: '0.8rem', borderBottom: '2px solid var(--ph-border)' }}>Medicine Name</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.8rem', borderBottom: '2px solid var(--ph-border)' }}>Formula Generic</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.8rem', borderBottom: '2px solid var(--ph-border)' }}>Rack</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.8rem', borderBottom: '2px solid var(--ph-border)' }}>Stock Qty</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.8rem', borderBottom: '2px solid var(--ph-border)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoomDetails.items.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--ph-border)' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                          <strong>{m.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ph-muted)', display: 'block' }}>ID: {m.medicineId}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--ph-muted)' }}>
                          {m.genericName || 'No generic info'} · {m.category}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {m.rackLocation || '—'}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold',
                          color: m.stockQuantity <= m.minimumStock ? 'var(--ph-danger)' : 'var(--ph-text)'
                        }}>
                          {m.stockQuantity} (Min: {m.minimumStock || 10})
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <StatusChip status={m.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid var(--ph-border)', background: 'var(--ph-surface)', borderBottomLeftRadius: 'var(--ph-radius)', borderBottomRightRadius: 'var(--ph-radius)' }}>
              <button type="button" className="ph-btn" onClick={() => setZoomCategory(null)}>
                Close Zoom View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
