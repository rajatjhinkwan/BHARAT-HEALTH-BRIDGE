import { useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { usePharmacyStore } from '../../store/pharmacyStore';
import { searchMedicines } from '../../api/pharmacyApi';

export default function PharmacyHeader() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    addRecentSearch,
    setSection,
    setSelectedMedicine,
    darkMode,
    setDarkMode,
    soundAlerts,
    setSoundAlerts,
  } = usePharmacyStore();

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const onSearch = useCallback(
    async (q) => {
      setSearchQuery(q);
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const items = await searchMedicines(q);
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [setSearchQuery]
  );

  const pickResult = (med) => {
    addRecentSearch(med.name);
    setSelectedMedicine(med);
    setSection('inventory');
    setResults([]);
    setSearchQuery('');
  };

  const togglePhDark = () => {
    setDarkMode(!darkMode);
    if (!darkMode && theme !== 'dark') toggleTheme();
    if (darkMode && theme === 'dark') toggleTheme();
  };

  return (
    <header className="ph-header">
      <div className="ph-header__search">
        <span className="ph-header__search-icon">🔍</span>
        <input
          type="search"
          placeholder="Search medicine, barcode, batch, supplier… (voice: mic on mobile)"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pickResult(results[0]);
          }}
        />
        {searching && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, padding: '0.5rem', background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 8, zIndex: 10 }}>
            <div className="ph-skeleton" style={{ height: 24 }} />
          </div>
        )}
        {results.length > 0 && (
          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, margin: 0, padding: 0, listStyle: 'none', background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 8, zIndex: 10, maxHeight: 240, overflow: 'auto' }}>
            {results.map((m) => (
              <li key={m.id || m._id}>
                <button type="button" style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => pickResult(m)}>
                  {m.name} · {m.medicineId}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="ph-header__actions">
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--ph-text)' }}>
          👤 {user?.name || 'Pharmacist'}
        </span>
      </div>
    </header>
  );
}
