import { useState, useMemo } from 'react';
import { usePharmacyStore } from '../store/pharmacyStore';
import StatusChip from '../components/shared/StatusChip';
import { exportCsv } from '../lib/stockStatus';
import { updateMedicine, createMedicine } from '../api/pharmacyApi';

export default function InventorySection() {
  const { medicines, inventoryFilter, setInventoryFilter, loading, selectedMedicine, setSelectedMedicine, addMedicine, updateMedicineInList } = usePharmacyStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', genericName: '', category: 'Tablet', stockQuantity: 0, minimumStock: 10 });
  const [customStock, setCustomStock] = useState('');

  const sorted = useMemo(() => {
    let list = medicines || [];

    // Filter by search query
    if (inventoryFilter.search) {
      const q = inventoryFilter.search.toLowerCase().trim();
      list = list.filter((m) => {
        return (
          m.name?.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          m.brandName?.toLowerCase().includes(q) ||
          m.barcode?.toLowerCase().includes(q) ||
          m.batchNumber?.toLowerCase().includes(q) ||
          m.medicineId?.toLowerCase().includes(q)
        );
      });
    }

    // Filter by status
    if (inventoryFilter.status) {
      list = list.filter((m) => m.status === inventoryFilter.status);
    }

    // Filter by category
    if (inventoryFilter.category) {
      list = list.filter((m) => m.category === inventoryFilter.category);
    }

    // Sort alphabetically by name
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [medicines, inventoryFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newMed = await createMedicine(form);
      if (newMed) {
        addMedicine(newMed);
      }
      setShowAdd(false);
      setForm({ name: '', genericName: '', category: 'Tablet', stockQuantity: 0, minimumStock: 10 });
    } catch (err) {
      console.error('Failed to add medicine:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--ph-text)' }}>Real-Time Inventory</h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--ph-muted)' }}>Browse all active pharmacy medicines and adjust stock levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="ph-btn" onClick={() => exportCsv(sorted)}>Export CSV</button>
          <button type="button" className="ph-btn ph-btn--primary" onClick={() => setShowAdd(true)}>+ Add medicine</button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: '520px', alignItems: 'stretch' }}>
        {/* Left Column: Vertical Medicines Master List */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius)', padding: '1rem', flexShrink: 0 }}>
          
          {/* Filters Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="ph-input"
              style={{ width: '100%', padding: '0.6rem 1rem' }}
              placeholder="Search medicine name…"
              value={inventoryFilter.search || ''}
              onChange={(e) => setInventoryFilter({ search: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="ph-select" style={{ flex: 1, padding: '0.5rem' }} value={inventoryFilter.status || ''} onChange={(e) => setInventoryFilter({ status: e.target.value })}>
                <option value="">All statuses</option>
                <option value="healthy">Healthy</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="expiring_soon">Expiring</option>
              </select>
              <select className="ph-select" style={{ flex: 1, padding: '0.5rem' }} value={inventoryFilter.category || ''} onChange={(e) => setInventoryFilter({ category: e.target.value })}>
                <option value="">All types</option>
                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Medicines List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="ph-skeleton" style={{ height: 60, borderRadius: '12px' }} />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ph-muted)', fontSize: '0.85rem' }}>
                No medicines match your search filters.
              </div>
            ) : (
              sorted.map((m) => {
                const isActive = selectedMedicine && (selectedMedicine.id || selectedMedicine._id) === (m.id || m._id);
                return (
                  <div
                    key={m.id || m._id}
                    onClick={() => {
                      setSelectedMedicine(m);
                      setCustomStock('');
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: isActive ? '2px solid var(--ph-primary)' : '1px solid var(--ph-border)',
                      background: isActive 
                        ? 'linear-gradient(135deg, var(--ph-primary-soft) 0%, rgba(15, 110, 158, 0.02) 100%)' 
                        : 'var(--ph-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(15, 110, 158, 0.3)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--ph-border)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <strong style={{ color: 'var(--ph-text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)' }}>
                        {m.genericName || 'No Generic'} · <span style={{ fontWeight: 700 }}>{m.category}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: m.stockQuantity <= m.minimumStock ? 'var(--ph-danger)' : 'var(--ph-text)' }}>
                        Stock: {m.stockQuantity}
                      </span>
                      <StatusChip status={m.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Medicine Profile Dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedMedicine ? (
            <div style={{
              background: 'var(--ph-surface)',
              border: '1px solid var(--ph-border)',
              borderRadius: 'var(--ph-radius)',
              padding: '1.5rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--ph-shadow)',
              animation: 'ph-fade-in 0.35s ease'
            }}>
              {/* Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--ph-border)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--ph-text)' }}>{selectedMedicine.name}</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--ph-muted)' }}>{selectedMedicine.genericName || 'No Generic Registered Label'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ph-muted)' }}>Inventory Status</span>
                  <StatusChip status={selectedMedicine.status} />
                </div>
              </div>

              {/* Medicine Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Medicine ID</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>{selectedMedicine.medicineId || '—'}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Type / Category</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>{selectedMedicine.category || '—'}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Batch Number</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>{selectedMedicine.batchNumber || '—'}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Rack Location</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>{selectedMedicine.rackLocation || '—'}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Selling Price</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-green)' }}>₹{selectedMedicine.sellingPrice || '0'}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ph-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block', marginBottom: '2px' }}>Expiry Date</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>
                    {selectedMedicine.expiryDate ? new Date(selectedMedicine.expiryDate).toLocaleDateString('en-IN') : '—'}
                  </strong>
                </div>
              </div>

              {/* Barcode & Storage Box */}
              <div style={{ display: 'flex', gap: '1rem', padding: '0.85rem', background: 'rgba(15,110,158,0.02)', border: '1px dashed rgba(15,110,158,0.2)', borderRadius: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>🏷️</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ph-muted)', display: 'block' }}>Barcode / ID Tag</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--ph-text)', letterSpacing: '0.05em' }}>{selectedMedicine.barcode || selectedMedicine.id}</strong>
                </div>
                <span className="ph-status ph-status--healthy" style={{ fontSize: '0.65rem' }}>Active Record</span>
              </div>

              {/* Inventory Management Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', borderTop: '1px solid var(--ph-border)', paddingTop: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ph-text)' }}>Stock Adjustment Controls</h4>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* Restock 50 action */}
                  <button
                    type="button"
                    className="ph-btn ph-btn--primary"
                    style={{ padding: '0.7rem 1.25rem' }}
                    onClick={async () => {
                      try {
                        const newQty = (selectedMedicine.stockQuantity || 0) + 50;
                        const res = await updateMedicine(selectedMedicine.id || selectedMedicine._id, {
                          stockQuantity: newQty,
                        });
                        if (res) {
                          updateMedicineInList(res);
                        }
                      } catch (err) {
                        console.error('Failed to restock medicine:', err);
                      }
                    }}
                  >
                    +50 Quick Restock
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                    <input
                      type="number"
                      className="ph-input"
                      style={{ width: '130px', padding: '0.55rem 0.75rem', textAlign: 'center' }}
                      placeholder="Set exact qty..."
                      value={customStock}
                      onChange={(e) => setCustomStock(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ph-btn"
                      style={{ padding: '0.6rem 1rem' }}
                      onClick={async () => {
                        if (customStock === '') return;
                        const qty = parseInt(customStock, 10);
                        if (isNaN(qty)) return;
                        try {
                          const res = await updateMedicine(selectedMedicine.id || selectedMedicine._id, {
                            stockQuantity: qty,
                          });
                          if (res) {
                            updateMedicineInList(res);
                          }
                          setCustomStock('');
                        } catch (err) {
                          console.error('Failed to update exact qty:', err);
                        }
                      }}
                    >
                      Update
                    </button>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div style={{
              background: 'var(--ph-surface)',
              border: '1px dashed var(--ph-border)',
              borderRadius: 'var(--ph-radius)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '3rem',
              color: 'var(--ph-muted)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block', animation: 'ph-pulse 2s infinite' }}>💊</span>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--ph-text)' }}>No Medicine Selected</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', maxWidth: '320px', lineHeight: '1.4' }}>
                Select a medicine from the left vertical list to view its complete batch details, barcode details, and stock modification tools.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Medicine Modal Overlay */}
      {showAdd && (
        <div className="ph-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="ph-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ph-modal__header">
              <h3 style={{ margin: 0 }}>Add New Inpatient Medicine</h3>
              <button type="button" className="ph-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form className="ph-modal__body" onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ph-muted)' }}>Medicine Name</label>
                <input className="ph-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ph-muted)' }}>Generic Formula Name</label>
                <input className="ph-input" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ph-muted)' }}>Initial Stock</label>
                  <input type="number" className="ph-input" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: +e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ph-muted)' }}>Min Threshold Alert</label>
                  <input type="number" className="ph-input" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: +e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ph-muted)' }}>Category Form</label>
                <select className="ph-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="ph-btn ph-btn--primary" style={{ padding: '0.75rem', width: '100%', marginTop: '1rem' }}>Save Inpatient Medicine</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
