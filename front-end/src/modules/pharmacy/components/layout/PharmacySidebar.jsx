import { usePharmacyStore } from '../../store/pharmacyStore';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'dispense', label: 'Dispensing', icon: '💊', badgeKey: 'rx' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'alerts', label: 'Alerts', icon: '🔔', badgeKey: 'alerts' },
  { id: 'expiry', label: 'Expiry', icon: '⏳' },
  { id: 'history', label: 'Stock History', icon: '📜' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

export default function PharmacySidebar() {
  const { section, setSection, prescriptions, alerts } = usePharmacyStore();
  const rxCount = prescriptions?.length || 0;
  const alertCount = alerts?.filter((a) => a.severity === 'critical').length || alerts?.length || 0;

  return (
    <aside className="ph-sidebar">
      <div className="ph-sidebar__brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem 1.5rem', borderBottom: '1px solid var(--ph-border)', marginBottom: '1rem' }}>
        <div className="ph-sidebar__brand-icon">⚕</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--ph-text)' }}>Bharat Health Bridge</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ph-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacy</span>
        </div>
      </div>
      <ul className="ph-nav">
        {NAV.map(({ id, label, icon, badgeKey }) => {
          const badge =
            badgeKey === 'rx' ? rxCount : badgeKey === 'alerts' ? alertCount : 0;
          return (
            <li key={id} className="ph-nav__item">
              <button
                type="button"
                className={`ph-nav__btn ${section === id ? 'active' : ''}`}
                onClick={() => setSection(id)}
              >
                <span>{icon}</span>
                {label}
                {badge > 0 && <span className="ph-nav__badge">{badge}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="ph-live" style={{ padding: '0.75rem' }}>
        Live sync
      </div>
    </aside>
  );
}
