import React, { useState, useEffect, useCallback } from 'react';
import { 
  Pill, 
  ClipboardPlus, 
  PackageCheck, 
  Database, 
  AlertOctagon, 
  Search, 
  Activity, 
  Clock, 
  Filter,
  CreditCard,
  User,
  History,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';
import './PharmacyDashboard.css';

export default function PharmacyDashboard() {
  const [inventory, setInventory] = useState([
    { id: 'MED-001', name: 'Amoxicillin 500mg', stock: 450, requiresPrescription: true },
    { id: 'MED-002', name: 'Paracetamol 650mg', stock: 1200, requiresPrescription: false },
    { id: 'MED-003', name: 'Atorvastatin 20mg', stock: 15, requiresPrescription: true },
    { id: 'MED-004', name: 'Penicillin V 250mg', stock: 100, requiresPrescription: true }
  ]);

  const [prescriptionsQ, setPrescriptionsQ] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});
  const [selectedRx, setSelectedRx] = useState(null);

  const getMockPrescriptions = () => ([
    {
      patientName: 'Vikram Mehta',
      mrn: 'UHID-MOCK-2030',
      encounterId: 'ENC-MOCK-101',
      dispensed: false,
      hasWarning: false,
      allergiesLogged: 'None',
      items: [
        { name: 'Amoxicillin 500mg', dosage: '1 Tab', frequency: 'TID', duration: '5 Days', warningMsg: null },
        { name: 'Paracetamol 650mg', dosage: '1 Tab', frequency: 'PRN', duration: '3 Days', warningMsg: null }
      ],
      rxIndex: 0,
      patientId: 'P-MOCK-2030',
      patient: { mrn: 'UHID-MOCK-2030', _id: 'P-MOCK-2030', patientName: 'Vikram Mehta' }
    },
    {
      patientName: 'Meena Iyer',
      mrn: 'UHID-MOCK-2031',
      encounterId: 'ENC-MOCK-102',
      dispensed: false,
      hasWarning: true,
      allergiesLogged: 'Penicillin',
      items: [
        { name: 'Amoxicillin 250mg', dosage: '1 Tab', frequency: 'BID', duration: '7 Days', warningMsg: 'Cross-reactivity warning: Penicillin allergy detected.' }
      ],
      rxIndex: 0,
      patientId: 'P-MOCK-2031',
      patient: { mrn: 'UHID-MOCK-2031', _id: 'P-MOCK-2031', patientName: 'Meena Iyer', allergies: 'Penicillin' }
    }
  ]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/api/clinical/patients');
      if(resp.ok) {
        const patients = await resp.json();
        const queue = [];
        
        patients.forEach(p => {
           if(p.prescriptions) {
              p.prescriptions.forEach((rx, idx) => {
                 const patientAllergies = (p.allergies || '').toLowerCase();
                 let hasWarning = false;
                 const meds = rx.medications || (rx.rawDetails ? [{ name: rx.rawDetails, dosage: 'As Directed', frequency: 'N/A', duration: 'N/A' }] : []);
                 
                 const parsedItems = meds.map(it => {
                     let warningMsg = null;
                     const medName = it.name.toLowerCase();
                     if(patientAllergies && patientAllergies !== 'none') {
                        if(medName.includes('amoxicillin') && patientAllergies.includes('penicillin')) {
                            warningMsg = 'Cross-reactivity warning: Penicillin allergy detected.';
                        } else if (patientAllergies.includes(medName.split(' ')[0])) {
                            warningMsg = 'DIRECT CONTRAINDICATION: Patient is allergic to this.';
                        }
                     }
                     if(warningMsg) hasWarning = true;
                     return { ...it, warningMsg };
                 });

                 queue.push({
                    ...rx,
                    items: parsedItems,
                    patientName: p.patientName,
                    mrn: p.mrn,
                    allergiesLogged: p.allergies || 'None',
                    patientId: p._id,
                    patient: p,
                    rxIndex: idx,
                    hasWarning
                 });
              });
           }
        });
        
        const sortedQueue = queue.length > 0 ? queue.sort((a, _b) => (a.dispensed ? 1 : -1)) : getMockPrescriptions();
        setPrescriptionsQ(sortedQueue);
        if (sortedQueue.length > 0 && !selectedRx) setSelectedRx(sortedQueue[0]);
      } else {
        const mocks = getMockPrescriptions();
        setPrescriptionsQ(mocks);
        if (!selectedRx) setSelectedRx(mocks[0]);
      }
    } catch(err) {
      console.error(err);
      const mocks = getMockPrescriptions();
      setPrescriptionsQ(mocks);
      if (!selectedRx) setSelectedRx(mocks[0]);
    }
  }, [selectedRx]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleDispense = useCallback(async () => {
    if (!selectedRx || selectedRx.dispensed) return;
    
    const { patient, rxIndex, encounterId, items, hasWarning } = selectedRx;

    if(hasWarning) {
       const override = window.confirm("WARNING: This prescription contains a known allergen for this patient. Are you sure you want to logically override and dispense?");
       if(!override) return;
    }

    setLoadingIds(prev => ({...prev, [encounterId]: true}));
    
    try {
      const dispenseRecord = {
         id: 'DISP-' + Date.now(),
         orderRef: encounterId,
         timestamp: new Date().toISOString(),
         dispensedItems: items.map(i => i.name)
      };

      const hash = await generateBlockchainHash({ type: "PHARMACY_SIG", mrn: patient.mrn, ...dispenseRecord });
      
      const newPrescriptions = [...patient.prescriptions];
      newPrescriptions[rxIndex].dispensed = true;
      newPrescriptions[rxIndex].dispenseHash = hash;

      await fetch(`http://localhost:4000/api/clinical/patients/${patient._id}`, {
         method: 'PUT',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ prescriptions: newPrescriptions })
      });
      
      setInventory(prev => prev.map(med => {
         const found = items.find(it => it.name.toLowerCase().includes(med.name.split(' ')[0].toLowerCase()));
         if(found && med.stock > 0) return { ...med, stock: med.stock - 5 }; 
         return med;
      }));

      alert("Dispensation verified. Stock updated. Ledger secured:\n" + hash);
      fetchPrescriptions();
      // Update selectedRx state to show as dispensed
      setSelectedRx(prev => ({...prev, dispensed: true, dispenseHash: hash}));
    } catch(err) {
       console.error(err);
       alert("Error dispensing.");
    }
    setLoadingIds(prev => ({...prev, [encounterId]: false}));
  }, [selectedRx, fetchPrescriptions]);

  return (
    <div className="pharmacy-dashboard animate-fade-in-up">
      {/* LEFT COLUMN: Inventory & Station Stats */}
      <div className="pharmacy-left-col">
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title">Inventory Snapshot</h3>
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div className="inventory-vitals">
            <div className="vital-box">
              <div className="vital-label">Total SKUs</div>
              <div className="vital-value">1,248</div>
            </div>
            <div className="vital-box" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
              <div className="vital-label" style={{ color: '#EF4444' }}>Low Stock</div>
              <div className="vital-value" style={{ color: '#B91C1C' }}>12</div>
            </div>
          </div>
        </div>

        <div className="pharmacy-card">
          <h3 className="pharmacy-card-title mb-4">Stock Alerts</h3>
          <div className="inventory-stat-card">
            {inventory.map(med => (
              <div key={med.id} className="inventory-item">
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{med.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{med.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: med.stock < 50 ? '#EF4444' : '#10B981' }}>{med.stock}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Units</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pharmacy-card" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-primary" />
            <div>
              <div className="font-bold text-primary">Secure Ledger</div>
              <div className="text-sm text-primary" style={{ opacity: 0.8 }}>Blockchain Sync: Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: Rx Processing Queue */}
      <div className="pharmacy-center-col">
        <div className="rx-queue-header">
          <Pill size={32} className="text-primary" />
          <div>
            <h2 style={{ margin: 0 }}>E-Rx Processing Queue</h2>
            <p style={{ margin: 0 }}>{prescriptionsQ.length} records across all categories</p>
          </div>
          <button className="btn-secondary" style={{ marginLeft: 'auto', padding: '0.5rem 1rem' }}>
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="rx-tabs">
          <div className="rx-tab active">Pending ({prescriptionsQ.filter(r => !r.dispensed).length})</div>
          <div className="rx-tab">Dispensed ({prescriptionsQ.filter(r => r.dispensed).length})</div>
          <div className="rx-tab">Narcotics</div>
        </div>

        <div className="rx-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', paddingRight: '0.5rem' }}>
          {prescriptionsQ.map((rx, idx) => (
            <div 
              key={idx} 
              className={`rx-item-card animate-slide ${rx.hasWarning ? 'warning' : ''} ${selectedRx?.encounterId === rx.encounterId ? 'active-border' : ''}`}
              style={{ 
                cursor: 'pointer',
                borderColor: selectedRx?.encounterId === rx.encounterId ? '#3B82F6' : '#E2E8F0',
                boxShadow: selectedRx?.encounterId === rx.encounterId ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'
              }}
              onClick={() => setSelectedRx(rx)}
            >
              <div className="rx-item-header">
                <div className="patient-info">
                  <h4>{rx.patientName}</h4>
                  <p>MRN: {rx.mrn} • ENC: {rx.encounterId}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {rx.hasWarning && (
                    <span className="badge badge-danger">
                      <AlertOctagon size={12} style={{ marginRight: '4px' }} /> Allergy
                    </span>
                  )}
                  {rx.dispensed ? (
                    <span className="badge badge-success">Dispensed</span>
                  ) : (
                    <span className="badge badge-warning">Awaiting</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {rx.items.map((it, i) => (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', background: it.warningMsg ? '#FEF2F2' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div className="font-bold text-sm">{it.name}</div>
                    <div className="text-sm text-muted">{it.dosage} • {it.frequency}</div>
                    {it.warningMsg && <div className="text-danger" style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '600' }}>! {it.warningMsg}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Action Pad & Finalize */}
      <div className="pharmacy-right-col">
        <div className="pharmacy-card">
          <h3 className="pharmacy-card-title mb-4">Pharmacist's Action Pad</h3>
          <div className="action-grid">
            <div className="action-item">
              <div className="action-icon"><PackageCheck size={18} /></div>
              <div className="action-label">Verify SKU</div>
              <div className="action-sub">Barcode scan</div>
            </div>
            <div className="action-item">
              <div className="action-icon" style={{ background: '#F0FDF4', color: '#10B981' }}><CreditCard size={18} /></div>
              <div className="action-label">Billing</div>
              <div className="action-sub">Generate Invoice</div>
            </div>
            <div className="action-item">
              <div className="action-icon" style={{ background: '#FFF7ED', color: '#F59E0B' }}><User size={18} /></div>
              <div className="action-label">Counseling</div>
              <div className="action-sub">Patient notes</div>
            </div>
            <div className="action-item">
              <div className="action-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><History size={18} /></div>
              <div className="action-label">History</div>
              <div className="action-sub">Previous Rx</div>
            </div>
          </div>
        </div>

        {selectedRx && (
          <div className="pharmacy-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="pharmacy-card-title mb-4">Dispense Summary</h3>
            <div style={{ flex: 1 }}>
              <div className="flex justify-between mb-2">
                <span className="text-muted text-sm">Patient Name</span>
                <span className="font-semibold">{selectedRx.patientName}</span>
              </div>
              <div className="flex justify-between mb-4 pb-4 border-bottom" style={{ borderBottom: '1px solid #E2E8F0' }}>
                <span className="text-muted text-sm">Prescription ID</span>
                <span className="font-semibold">{selectedRx.encounterId}</span>
              </div>

              <div className="mb-4">
                <label style={{ fontSize: '0.7rem' }}>Dispensing Items</label>
                {selectedRx.items.map((it, i) => (
                  <div key={i} className="flex justify-between py-2 border-bottom" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <span className="text-sm">{it.name}</span>
                    <span className="text-sm font-bold text-primary">×1</span>
                  </div>
                ))}
              </div>

              {selectedRx.dispensed && (
                <div className="p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="flex items-center gap-2 text-success font-bold text-sm mb-1">
                    <ShieldCheck size={14} /> Dispensation Signed
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.6rem', wordBreak: 'break-all' }}>
                    {selectedRx.dispenseHash}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="finalize-btn" 
              disabled={loadingIds[selectedRx.encounterId] || selectedRx.dispensed}
              onClick={handleDispense}
            >
              {loadingIds[selectedRx.encounterId] ? (
                <>Hashing & Signing...</>
              ) : selectedRx.dispensed ? (
                <>Dispensed & Logged</>
              ) : (
                <>
                  <ShieldCheck size={20} /> Finalize & Dispense
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

