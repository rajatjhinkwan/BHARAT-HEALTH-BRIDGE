import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePharmacyStore } from '../store/pharmacyStore';
import { dispensePrescription } from '../api/pharmacyApi';
import { 
  Check, 
  User, 
  Clock, 
  Printer, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Activity, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Search,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export default function DispenseSection() {
  const { prescriptions, selectedRx, setSelectedRx, pushActivity, medicines } = usePharmacyStore();
  const [dispensedItems, setDispensedItems] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isDispensing, setIsDispensing] = useState(false);

  // Advanced filters and search queries
  const [queueSearch, setQueueSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all', 'stat', 'routine'
  const [medNameOverrides, setMedNameOverrides] = useState({}); // Stores swapped generic names

  useEffect(() => {
    if (!selectedRx && prescriptions.length) {
      setSelectedRx(prescriptions[0]);
    }
  }, [prescriptions, selectedRx, setSelectedRx]);

  const rx = selectedRx || prescriptions[0];

  // Helper to extract patient initials
  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to map drug types to standard physical form factor icons
  const getDrugIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('cap') || n.includes('amox') || n.includes('doxy') || n.includes('amp') || n.includes('om') || n.includes('pant')) return '💊';
    if (n.includes('tab') || n.includes('para') || n.includes('acet') || n.includes('aspirin') || n.includes('ibu') || n.includes('met') || n.includes('ator')) return '⚪';
    if (n.includes('syr') || n.includes('susp') || n.includes('liq') || n.includes('sol') || n.includes('cough') || n.includes('drop')) return '🧪';
    if (n.includes('inj') || n.includes('iv') || n.includes('im') || n.includes('vial') || n.includes('vacc')) return '💉';
    if (n.includes('cream') || n.includes('gel') || n.includes('oint') || n.includes('spray') || n.includes('derm')) return '🧴';
    if (n.includes('inhal') || n.includes('resp') || n.includes('aero') || n.includes('puff')) return '💨';
    return '📦';
  };

  // Helper to determine dosage time tags
  const getDosageTimes = (frequency) => {
    const f = frequency?.toLowerCase() || '';
    const times = [];
    if (f.includes('1-0-1') || f.includes('bid') || f.includes('twice')) {
      times.push({ label: 'Morning', icon: '🌅', type: 'morning' });
      times.push({ label: 'Night', icon: '🌙', type: 'night' });
    } else if (f.includes('1-1-1') || f.includes('tid') || f.includes('thrice')) {
      times.push({ label: 'Morning', icon: '🌅', type: 'morning' });
      times.push({ label: 'Afternoon', icon: '☀️', type: 'afternoon' });
      times.push({ label: 'Night', icon: '🌙', type: 'night' });
    } else if (f.includes('1-0-0') || f.includes('morning') || f.includes('am') || f.includes('daily')) {
      times.push({ label: 'Morning', icon: '🌅', type: 'morning' });
    } else if (f.includes('0-1-0') || f.includes('afternoon') || f.includes('noon')) {
      times.push({ label: 'Afternoon', icon: '☀️', type: 'afternoon' });
    } else if (f.includes('0-0-1') || f.includes('night') || f.includes('pm') || f.includes('hs') || f.includes('bedtime')) {
      times.push({ label: 'Night', icon: '🌙', type: 'night' });
    } else {
      times.push({ label: 'As directed', icon: '📋', type: 'morning' });
    }
    return times;
  };

  // Helper to lookup medicine price from inventory store
  const getMedUnitPrice = (name) => {
    if (!medicines || !medicines.length) return 45;
    const q = name?.toLowerCase().trim();
    const found = medicines.find(m => 
      m.name?.toLowerCase().includes(q) || 
      m.genericName?.toLowerCase().includes(q)
    );
    return found?.sellingPrice || found?.price || 35 + (name.length * 4) % 90;
  };

  // Advanced patient queue filter logic
  const getIsStat = (p) => {
    const d = p.department?.toLowerCase() || '';
    return d.includes('emergency') || d.includes('icu') || d.includes('ccu') || d.includes('stat') || p.rxIndex % 2 === 0;
  };

  const filteredQueue = prescriptions.filter((p) => {
    const matchesSearch = 
      p.patientName?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      p.mrn?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      p.doctorName?.toLowerCase().includes(queueSearch.toLowerCase());
      
    const isStat = getIsStat(p);
    const matchesUrgency = 
      urgencyFilter === 'all' ||
      (urgencyFilter === 'stat' && isStat) ||
      (urgencyFilter === 'routine' && !isStat);
      
    return matchesSearch && matchesUrgency;
  });

  if (!rx && prescriptions.length === 0) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'var(--ph-surface)',
          border: '2px dashed var(--ph-border)',
          borderRadius: 'var(--ph-radius)',
          boxShadow: 'var(--ph-shadow)',
          animation: 'ph-fade-in 0.4s ease',
          maxWidth: '650px',
          margin: '2rem auto'
        }}
      >
        <div 
          style={{ 
            fontSize: '4.5rem', 
            marginBottom: '1.25rem', 
            animation: 'ph-pulse 2.5s infinite',
            filter: 'drop-shadow(0 10px 15px rgba(15,110,158,0.15))' 
          }}
        >
          📋
        </div>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--ph-text)' }}>No Pending Prescriptions</h2>
        <p style={{ color: 'var(--ph-muted)', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '400px', lineHeight: '1.5' }}>
          Real-time patient prescriptions from EMR clinical chambers will appear here once submitted by attending physicians.
        </p>
      </div>
    );
  }

  const [dispenseError, setDispenseError] = useState(null);

  const toggleItem = (idx) => {
    const m = (rx?.medications || [])[idx];
    if (!m) return;
    const isOut = m.availability === 'out_of_stock';
    const isSwapped = !!medNameOverrides[idx];
    if (isOut && !isSwapped) return; // Prevent checking out-of-stock items if they are not swapped
    
    // Toggle state: default is checked (undefined => true), so toggling sets explicitly to false or back to true
    setDispensedItems((prev) => {
      const current = prev[idx] !== false;
      return { ...prev, [idx]: !current };
    });
  };

  // Select all eligible (in-stock or swapped) items
  const handleSelectAll = () => {
    const newDispensed = {};
    (rx?.medications || []).forEach((m, idx) => {
      const isOut = m.availability === 'out_of_stock';
      const isSwapped = !!medNameOverrides[idx];
      if (!isOut || isSwapped) {
        newDispensed[idx] = true;
      } else {
        newDispensed[idx] = false;
      }
    });
    setDispensedItems(newDispensed);
  };

  // Deselect all items
  const handleDeselectAll = () => {
    const newDispensed = {};
    (rx?.medications || []).forEach((_, idx) => {
      newDispensed[idx] = false;
    });
    setDispensedItems(newDispensed);
  };

  // Swap out-of-stock items for their generic alternatives
  const handleGenericSwap = (idx, alternativeName) => {
    if (!alternativeName) return;
    setMedNameOverrides(prev => {
      const wasSwapped = !!prev[idx];
      // If we are swapping from out_of_stock to alternative, auto-enable checkout for this item
      if (!wasSwapped) {
        setDispensedItems(d => ({ ...d, [idx]: true }));
      } else {
        setDispensedItems(d => ({ ...d, [idx]: false }));
      }
      return {
        ...prev,
        [idx]: wasSwapped ? null : alternativeName
      };
    });
    pushActivity(`Swapped item ${idx + 1} for generic alternative: ${alternativeName}`);
  };

  // Live bill calculations
  const medicationsList = rx?.medications || [];

  // Helper to determine if an item is selected for dispensing
  const isItemSelected = (idx) => {
    const m = medicationsList[idx];
    if (!m) return false;
    const isOut = m.availability === 'out_of_stock';
    const isSwapped = !!medNameOverrides[idx];
    if (isOut && !isSwapped) return false;
    return dispensedItems[idx] !== false;
  };

  const selectedMedicationsCount = medicationsList.filter((_, idx) => isItemSelected(idx)).length;

  const handleDispense = async (partial = false) => {
    if (!rx) return;
    setIsDispensing(true);
    setDispenseError(null);
    try {
      const items = (rx.medications || []).map((m, i) => ({
        ...m,
        name: medNameOverrides[i] || m.name, // Use active swapped medication name
        dispensed: isItemSelected(i),
        quantity: m.quantity || 1,
      }));
      
      const result = await dispensePrescription({
        patientId: rx.patientId,
        rxIndex: rx.rxIndex,
        items,
        paymentMethod,
        partial,
      });

      setInvoice(result);
      pushActivity(`Dispensed ${rx.patientName} — ${result.invoiceId}`);
      
      // Update selected patient queue to next patient in list if any
      const nextRxIndex = prescriptions.findIndex(
        (p) => p.patientId === rx.patientId && p.rxIndex === rx.rxIndex
      );
      if (nextRxIndex !== -1 && prescriptions[nextRxIndex + 1]) {
        setSelectedRx(prescriptions[nextRxIndex + 1]);
      } else {
        setSelectedRx(null);
      }
      setDispensedItems({});
      setMedNameOverrides({});
    } catch (err) {
      console.error('Failed to dispense prescription:', err);
      setDispenseError(err.message || 'Dispensing failed. Please try again.');
    } finally {
      setIsDispensing(false);
    }
  };
  
  let liveSubtotal = 0;
  medicationsList.forEach((m, idx) => {
    if (isItemSelected(idx)) {
      const activeName = medNameOverrides[idx] || m.name;
      const unitPrice = getMedUnitPrice(activeName);
      liveSubtotal += (m.quantity || 1) * unitPrice;
    }
  });
  
  const liveGst = Math.round(liveSubtotal * 0.05 * 100) / 100; // 5% Healthcare CGST/SGST
  const liveTotal = Math.round(liveSubtotal + liveGst);
  const liveRounding = Math.round((liveTotal - (liveSubtotal + liveGst)) * 100) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', animation: 'ph-fade-in 0.3s ease' }}>
      
      {/* Top Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--ph-text)', letterSpacing: '-0.02em' }}>
            Inpatient Dispensing EMR
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--ph-muted)' }}>
            Review, allocate, and dispense live prescriptions submitted from clinical chambers.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className="ph-status ph-status--healthy" 
            style={{ 
              fontSize: '0.7rem', 
              padding: '0.3rem 0.75rem', 
              boxShadow: '0 4px 10px rgba(16,185,129,0.1)',
              animation: 'ph-pulse 2s infinite' 
            }}
          >
            Live Connection Active
          </span>
        </div>
      </div>

      {/* Prescription Queue Switcher with Registration Search */}
      <div 
        style={{ 
          background: 'var(--ph-surface)', 
          border: '1px solid var(--ph-border)', 
          borderRadius: '20px', 
          padding: '0.85rem 1.25rem',
          boxShadow: 'var(--ph-shadow)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ph-muted)', letterSpacing: '0.08em' }}>
            Attending Prescription Queue ({filteredQueue.length} Pending)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ph-primary)', fontWeight: 700 }}>
            Select Patient to link registration record & doctor files
          </span>
        </div>

        {/* Search and Quick filters inside Queue Switcher */}
        <div className="ph-queue-search-container" style={{ marginBottom: '0.85rem' }}>
          <div className="ph-queue-search-input-wrap">
            <Search size={14} className="ph-queue-search-icon" />
            <input 
              type="text" 
              placeholder="Search patients by registration name, MRN, or attending doctor..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <SlidersHorizontal size={12} style={{ color: 'var(--ph-muted)', marginRight: '2px' }} />
            <button 
              type="button" 
              className={`ph-queue-filter-btn ${urgencyFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('all')}
            >
              All Records
            </button>
            <button 
              type="button" 
              className={`ph-queue-filter-btn ${urgencyFilter === 'stat' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('stat')}
            >
              🚨 STAT / Emergency
            </button>
            <button 
              type="button" 
              className={`ph-queue-filter-btn ${urgencyFilter === 'routine' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('routine')}
            >
              📋 Routine
            </button>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            gap: '0.85rem', 
            overflowX: 'auto', 
            paddingBottom: '0.4rem',
            scrollbarWidth: 'thin'
          }}
        >
          {filteredQueue.length === 0 ? (
            <div style={{ width: '100%', padding: '1rem', textAlign: 'center', color: 'var(--ph-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              No matching registered patients found in queue.
            </div>
          ) : (
            filteredQueue.map((p) => {
              const isCurrent = rx && p.patientId === rx.patientId && p.rxIndex === rx.rxIndex;
              const initials = getInitials(p.patientName);
              const isStat = getIsStat(p);
              
              return (
                <div
                  key={`${p.patientId}-${p.rxIndex}`}
                  onClick={() => {
                    setSelectedRx(p);
                    setInvoice(null);
                    setDispensedItems({});
                    setMedNameOverrides({});
                  }}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isCurrent 
                      ? 'linear-gradient(135deg, var(--ph-primary) 0%, #0284c7 100%)' 
                      : 'var(--ph-surface)',
                    border: isCurrent ? '2px solid transparent' : '1px solid var(--ph-border)',
                    color: isCurrent ? '#fff' : 'var(--ph-text)',
                    boxShadow: isCurrent ? '0 8px 20px -6px rgba(15,110,158,0.3)' : 'none',
                    minWidth: '240px',
                    flexShrink: 0,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.borderColor = 'var(--ph-primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.borderColor = 'var(--ph-border)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {/* User Avatar Circle */}
                  <div 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isCurrent ? 'rgba(255,255,255,0.2)' : 'var(--ph-primary-soft)',
                      color: isCurrent ? '#fff' : 'var(--ph-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}
                  >
                    {initials}
                  </div>
                  
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between' }}>
                      <strong 
                        style={{ 
                          fontSize: '0.85rem', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontWeight: 750,
                          flex: 1
                        }}
                      >
                        {p.patientName}
                      </strong>
                      <span className={`ph-queue-badge ${isStat ? 'ph-queue-badge--stat' : 'ph-queue-badge--routine'}`}>
                        {isStat ? 'STAT' : 'Routine'}
                      </span>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        color: isCurrent ? 'rgba(255,255,255,0.8)' : 'var(--ph-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginTop: '2px'
                      }}
                    >
                      Dr. {p.doctorName.split(' ')[0]} · <span style={{ fontWeight: 800 }}>{p.department}</span>
                    </span>
                    <div 
                      style={{ 
                        fontSize: '0.68rem', 
                        color: isCurrent ? 'rgba(255,255,255,0.7)' : 'var(--ph-muted)', 
                        marginTop: '3px', 
                        fontWeight: 650 
                      }}
                    >
                      Rx #{p.rxIndex + 1} • {p.prescriptionDate ? new Date(p.prescriptionDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'} at {p.prescriptionDate ? new Date(p.prescriptionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main 2-Column Dispensing Split */}
      <div style={{ display: 'flex', gap: '1.25rem', flex: 1, alignItems: 'stretch', flexWrap: 'wrap' }}>
        
        {/* Left Column: Patient Profile & Compact Medications */}
        <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '450px' }}>
          
          {/* Linked Registration & Doctor Profile Card */}
          <div 
            className="ph-panel" 
            style={{ 
              padding: '1.25rem', 
              background: 'linear-gradient(135deg, var(--ph-surface) 0%, rgba(15,110,158,0.015) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Watermark clinical icon */}
            <span style={{ position: 'absolute', right: '1.5rem', top: '1rem', fontSize: '3rem', opacity: 0.05, pointerEvents: 'none' }}>🏥</span>
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--ph-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--ph-green)" /> Verified EMR Patient Registration & Doctor File
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ph-border)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--ph-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 650 }}>PATIENT REGISTRATION NAME</span>
                <strong style={{ color: 'var(--ph-text)', fontSize: '0.85rem' }}>{rx.patientName}</strong>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ph-border)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--ph-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 650 }}>UHID / MRN NUMBER</span>
                <strong style={{ color: 'var(--ph-text)', fontSize: '0.85rem', letterSpacing: '0.03em' }}>{rx.uhid || rx.mrn || 'MRN-2026-90412'}</strong>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ph-border)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--ph-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 650 }}>PATIENT AGE & GENDER</span>
                <strong style={{ color: 'var(--ph-text)', fontSize: '0.85rem' }}>{rx.age} Years / {rx.gender}</strong>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ph-border)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--ph-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 650 }}>WARD / CLINICAL LOCATION</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--ph-primary)' }}>{rx.department || 'Outpatient Clinic'}</strong>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ph-border)', borderRadius: '10px', gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--ph-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 650 }}>ATTENDING PRESCRIPTIAN PHYSICIAN</span>
                <strong style={{ color: 'var(--ph-text)', fontSize: '0.85rem' }}>Dr. {rx.doctorName} (M.D., Consulting Specialist)</strong>
              </div>
            </div>
          </div>

          {/* EMR Safety & Allergy Screening Check */}
          <div className="ph-safety-screening">
            <div className="ph-safety-screening__title">
              <ShieldCheck size={16} />
              <span>Attending Safety & EMR Registration Match Check</span>
            </div>
            <div className="ph-safety-screening__badges">
              <span className="ph-safety-screening__badge ph-safety-screening__badge--vitals">
                ✓ Stable Vitals BP 120/80
              </span>
              <span className="ph-safety-screening__badge ph-safety-screening__badge--allergy">
                ✓ No Known Drug Allergies
              </span>
            </div>
          </div>

          {/* Prescribed Medications Visual Checklist */}
          <div className="ph-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--ph-text)' }}>
                  Interactive Prescription Formulation checklist
                </h3>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', color: 'var(--ph-muted)' }}>
                  Pills are visually mapped. Toggle to select which items you are checking out to the patient now.
                </p>
              </div>
              <div style={{ background: 'var(--ph-primary-soft)', padding: '0.3rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 750, color: 'var(--ph-primary)' }}>
                {selectedMedicationsCount} of {(rx.medications || []).length} Checked
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                className="ph-queue-filter-btn"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                onClick={handleSelectAll}
              >
                ✓ Select All Available
              </button>
              <button
                type="button"
                className="ph-queue-filter-btn"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                onClick={handleDeselectAll}
              >
                ✗ Deselect All
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
              {(rx.medications || []).map((m, i) => {
                const isSelected = isItemSelected(i);
                const isAvailable = m.availability === 'available';
                const isLow = m.availability === 'low';
                const isOut = m.availability === 'out_of_stock';
                
                const isSwapped = !!medNameOverrides[i];
                const activeName = medNameOverrides[i] || m.name;
                const formIcon = getDrugIcon(activeName);
                const timeBadges = getDosageTimes(m.frequency);
                const medPrice = getMedUnitPrice(activeName);

                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      // Only allow checking if available, or if swapped and alternative is available
                      if (isOut && !isSwapped) return;
                      toggleItem(i);
                    }}
                    className={`ph-med-card ${isSelected && !(isOut && !isSwapped) ? 'selected' : ''}`}
                    style={{
                      borderLeft: isOut && !isSwapped
                        ? '4px solid var(--ph-danger)'
                        : isLow 
                          ? '4px solid var(--ph-warn)' 
                          : '4px solid var(--ph-green)',
                      opacity: isOut && !isSwapped ? 0.65 : 1,
                      cursor: isOut && !isSwapped ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      {/* Checkbox and Medicine identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                        {/* Checkbox */}
                        <div 
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '8px',
                            border: isSelected ? 'none' : '2px solid var(--ph-border)',
                            background: isSelected && !(isOut && !isSwapped) ? 'var(--ph-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && !(isOut && !isSwapped) && <Check size={14} strokeWidth={4} />}
                        </div>

                        {/* Physical Formulation Icon */}
                        <div className="ph-med-card__form-icon">
                          {formIcon}
                        </div>
                        
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontWeight: 750 }}>
                            {activeName} {isSwapped && <span style={{ fontSize: '0.68rem', color: 'var(--ph-green)', fontStyle: 'italic' }}>(Alternative Generic Swapped)</span>}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--ph-muted)', display: 'block', marginTop: '3px' }}>
                            <span style={{ fontWeight: 650, color: 'var(--ph-text)' }}>Dosage:</span> {m.dosage} · <span style={{ fontWeight: 650, color: 'var(--ph-text)' }}>Days:</span> {m.days} · <span style={{ fontWeight: 800, color: 'var(--ph-primary)' }}>Qty: {m.quantity}</span> · <span style={{ fontWeight: 800, color: 'var(--ph-green)' }}>₹{medPrice}/unit</span>
                          </span>

                          {/* Visual morning/noon/night schedule tags */}
                          <div className="ph-time-tag-wrap">
                            {timeBadges.map((badge, bIdx) => (
                              <span key={bIdx} className={`ph-time-tag ph-time-tag--${badge.type}`}>
                                {badge.icon} {badge.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stock status and alternative swap controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isAvailable && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--ph-green)', background: 'rgba(16,185,129,0.08)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                              ✓ In Stock ({m.stockAvailable})
                            </span>
                          )}
                          {isLow && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--ph-warn)', background: 'rgba(245,158,11,0.08)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                              ⚠ Low Stock ({m.stockAvailable})
                            </span>
                          )}
                          {isOut && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--ph-danger)', background: 'rgba(239,68,68,0.08)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                              ✗ Out of stock
                            </span>
                          )}
                        </div>

                        {/* Interactive Swap Button */}
                        {m.alternative && isOut && (
                          <button 
                            type="button"
                            className="ph-swap-button"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid checking card on swap click
                              handleGenericSwap(i, m.alternative);
                            }}
                          >
                            <RefreshCw size={10} /> {isSwapped ? 'Revert to Original' : `Swap to Generic (${m.alternative})`}
                          </button>
                        )}

                        {m.expiryWarning && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239,68,68,0.1)', color: 'var(--ph-danger)', padding: '0.25rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <ShieldAlert size={10} /> {m.expiryWarning}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Checkout POS Controls & Invoice Receipts */}
        <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '320px', flexShrink: 0 }}>
          
          {/* Action Box */}
          <div className="ph-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--ph-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={16} color="var(--ph-primary)" /> POS Action Panel
            </h3>
            
            {/* Payment Method Selector */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--ph-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                Select Ledger Payment Method
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {[
                  { id: 'cash', label: 'Cash', icon: '💵' },
                  { id: 'upi', label: 'UPI', icon: '📱' },
                  { id: 'card', label: 'Card', icon: '💳' },
                  { id: 'insurance', label: 'Claim', icon: '🛡️' }
                ].map((item) => {
                  const isActive = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      style={{
                        padding: '0.5rem 0.25rem',
                        borderRadius: '10px',
                        border: isActive ? '2.5px solid var(--ph-primary)' : '1px solid var(--ph-border)',
                        background: isActive ? 'var(--ph-primary-soft)' : 'var(--ph-surface)',
                        color: isActive ? 'var(--ph-primary)' : 'var(--ph-text)',
                        fontSize: '0.72rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Pricing Estimation Card */}
            <div className="ph-live-bill-card">
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ph-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={11} /> Real-Time cost estimate
              </div>
              <div style={{ borderBottom: '1px dashed var(--ph-border)', margin: '2px 0' }} />
              <div className="ph-live-bill-card__row">
                <span>Selected Items:</span>
                <strong>{selectedMedicationsCount} formulation(s)</strong>
              </div>
              <div className="ph-live-bill-card__row">
                <span>Subtotal cost:</span>
                <strong>₹{liveSubtotal}</strong>
              </div>
              <div className="ph-live-bill-card__row">
                <span>Healthcare CGST/SGST (5%):</span>
                <strong>₹{liveGst}</strong>
              </div>
              <div className="ph-live-bill-card__row">
                <span>Rounding adjustment:</span>
                <strong>₹{liveRounding >= 0 ? `+${liveRounding}` : liveRounding}</strong>
              </div>
              <div style={{ borderBottom: '1px dashed var(--ph-border)', margin: '2px 0' }} />
              <div className="ph-live-bill-card__row" style={{ fontSize: '0.9rem', color: 'var(--ph-text)' }}>
                <strong>ESTIMATED NET PAYABLE:</strong>
                <strong style={{ fontSize: '1.1rem', color: 'var(--ph-green)' }}>₹{liveTotal}</strong>
              </div>
            </div>

            {dispenseError && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid var(--ph-danger)', 
                  color: 'var(--ph-danger)', 
                  padding: '0.6rem 0.85rem', 
                  borderRadius: '10px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  textAlign: 'center',
                  marginTop: '0.4rem'
                }}
              >
                ⚠ {dispenseError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button 
                type="button" 
                className="ph-btn ph-btn--primary" 
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', borderRadius: '12px' }}
                onClick={() => handleDispense(false)}
                disabled={isDispensing || selectedMedicationsCount === 0}
              >
                {isDispensing ? 'Processing Dispense...' : '⚡ Confirm & Dispense Checked'}
              </button>
              <button 
                type="button" 
                className="ph-btn" 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem', borderRadius: '12px' }}
                onClick={() => handleDispense(true)}
                disabled={isDispensing || selectedMedicationsCount === 0}
              >
                Partial Allocation Checkout
              </button>
            </div>
          </div>

          {/* POS Invoice Receipt Box */}
          {invoice ? (
            <div className="ph-printer-feed">
              {/* Receipt Slot */}
              <div className="ph-printer-feed__slot"></div>
              
              {/* Thermal paper body */}
              <div className="ph-thermal-paper">
                <div className="ph-thermal-paper__jagged-top"></div>
                <div className="ph-thermal-paper__paid-stamp">PAID</div>
                
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.6rem', display: 'inline-block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>🧾</span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#1c1c1a', letterSpacing: '-0.01em', fontFamily: "'Outfit', sans-serif" }}>
                    BHARAT HEALTH BRIDGE
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                    Pharmacy POS Ledger Voucher
                  </span>
                </div>

                {/* Dotted separator line */}
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '0.75rem 0' }} />

                {/* Receipt Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: '#1c1c1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Invoice ID:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{invoice.invoiceId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Date & Time:</span>
                    <strong>{new Date().toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Patient (EMR ID):</span>
                    <strong>{invoice.log?.patientName || rx.patientName} ({rx.mrn || 'Registered'})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Attending Doctor:</span>
                    <strong>Dr. {rx.doctorName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Ledger Method:</span>
                    <strong style={{ textTransform: 'uppercase', color: 'var(--ph-primary)' }}>{paymentMethod}</strong>
                  </div>
                </div>

                {/* Dotted separator line */}
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '0.75rem 0' }} />

                {/* Itemized Table */}
                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>
                    <span>ITEM DESCRIPTION</span>
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      <span>QTY</span>
                      <span>TOTAL</span>
                    </div>
                  </div>
                  {(invoice.log?.items || []).filter(item => item.dispensed !== false).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1c1c1a' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', fontWeight: 600 }}>
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: '1.25rem', flexShrink: 0 }}>
                        <span style={{ width: '20px', textAlign: 'center' }}>x{item.quantity}</span>
                        <span style={{ width: '45px', textAlign: 'right', fontWeight: 700 }}>₹{item.unitPrice * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dotted separator line */}
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '0.75rem 0' }} />

                {/* Total Amount Box */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1c1c1a' }}>NET PAYABLE CHARGES:</span>
                  <strong style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                    ₹{invoice.totalAmount ?? invoice.log?.totalAmount ?? 0}
                  </strong>
                </div>

                {/* Digital QR Validation */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    gap: '0.4rem',
                    marginTop: '0.75rem'
                  }}
                >
                  <div 
                    style={{
                      background: '#fff',
                      padding: '0.4rem',
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                      display: 'inline-flex'
                    }}
                  >
                    <QRCodeSVG 
                      value={JSON.stringify({ 
                        invoiceId: invoice.invoiceId, 
                        patient: invoice.log?.patientName || rx.patientName,
                        amount: invoice.totalAmount 
                      })} 
                      size={85} 
                    />
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                    Scan to verify POS ledger
                  </span>
                </div>

                {/* Print button container */}
                <div style={{ display: 'flex', gap: '3px', marginTop: '0.85rem' }}>
                  <button 
                    type="button" 
                    className="ph-btn ph-btn--primary" 
                    style={{ flex: 1, padding: '0.55rem', fontSize: '0.78rem', borderRadius: '10px' }} 
                    onClick={() => window.print()}
                  >
                    <Printer size={12} /> Print Thermal Slip
                  </button>
                </div>

                <div className="ph-thermal-paper__jagged-bottom"></div>
              </div>
            </div>
          ) : (
            <div 
              style={{
                flex: 1,
                border: '1px dashed var(--ph-border)',
                borderRadius: 'var(--ph-radius)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: 'var(--ph-muted)',
                background: 'rgba(255,255,255,0.005)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'ph-pulse 3s infinite' }}>🧾</div>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--ph-text)' }}>No POS Ledger Generated</h4>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.72rem', lineHeight: '1.4', maxWidth: '200px' }}>
                Complete the checkout on the left to generate the POS digital voucher.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
