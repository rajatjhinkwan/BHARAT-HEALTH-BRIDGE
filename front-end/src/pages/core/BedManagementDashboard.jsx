import React, { useState } from 'react';
import { BedDouble, Calendar, Activity, Info, LogOut, CheckCircle, Navigation } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';

const INITIAL_BEDS = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `ICU-B${i + 1}`,
    type: 'ICU',
    ward: 'ICU Floor 1',
    status: 'occupied',
    patientName: `Patient ${Math.floor(Math.random() * 900) + 100}`,
    admissionDate: '2026-04-20',
    expectedDischarge: '2026-04-25',
    dailyRate: 15000,
    equipped: ['Ventilator', 'Monitor']
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `GEN-B${i + 1}`,
    type: 'general',
    ward: 'General Ward A',
    status: i < 5 ? 'cleaning' : (i < 8 ? 'reserved' : 'available'),
    patientName: null,
    admissionDate: null,
    expectedDischarge: null,
    dailyRate: 2000,
    equipped: ['Monitor']
  }))
];

export default function BedManagementDashboard() {
  const [beds, setBeds] = useState(INITIAL_BEDS);
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedBed, setSelectedBed] = useState(null);
  
  // Allocation Form State
  const [uhidInput, setUhidInput] = useState('');
  const [expectedDays, setExpectedDays] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
     switch(status) {
        case 'available': return 'var(--success)';
        case 'occupied': return 'var(--danger)';
        case 'reserved': return 'var(--warning)';
        case 'cleaning': return 'var(--primary)';
        case 'maintenance': return 'var(--text-muted)';
        default: return 'var(--text-main)';
     }
  };

  const getStatusBg = (status) => {
     switch(status) {
        case 'available': return 'var(--success-light)';
        case 'occupied': return '#ffe4e6';
        case 'reserved': return 'var(--warning-light)';
        case 'cleaning': return 'var(--primary-light)';
        case 'maintenance': return 'var(--background)';
        default: return 'var(--background)';
     }
  };

  const filteredBeds = selectedWard === 'All' ? beds : beds.filter(b => b.ward === selectedWard);

  const handleAllocate = async () => {
     if(!uhidInput || !expectedDays) return alert("Fill all fields");
     setLoading(true);
     try {
         const allocationRecord = {
             bedId: selectedBed.id,
             patientMrn: uhidInput,
             expectedDays: expectedDays,
             timestamp: new Date().toISOString()
         };
         
         const hash = await generateBlockchainHash({ type: "BED_ALLOCATION", ...allocationRecord });
         
         setBeds(eds => eds.map(b => b.id === selectedBed.id ? {
             ...b, 
             status: 'occupied', 
             patientName: `Mapped MRN: ${uhidInput}`,
             admissionDate: new Date().toISOString().split('T')[0]
         } : b));

         setSelectedBed(null);
         setUhidInput('');
         setExpectedDays('');
         alert("Bed Allocated. Transaction Logged:\\n" + hash);
     } catch (err) {
         console.error(err);
         alert("Error allocating bed.");
     }
     setLoading(false);
  };

  const handleDischarge = async (bedId) => {
      setBeds(eds => eds.map(b => b.id === bedId ? {
          ...b,
          status: 'cleaning',
          patientName: null,
          admissionDate: null,
          expectedDischarge: null
      } : b));
      setSelectedBed(null);
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
    bedCircle: (status) => ({
      width: '100%',
      aspectRatio: '1',
      borderRadius: '50%',
      background: getStatusBg(status),
      border: `4px solid ${getStatusColor(status)}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: status === 'occupied' ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
    }),
    legend: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' },
    input: { padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%', background: 'var(--background)', color: 'var(--text-main)', marginBottom: '1rem' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <BedDouble size={40} color="var(--primary)" />
        <div>
          <h1 style={{ margin: 0 }}>Visual Bed Management</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time spatial awareness and capacity tracking</p>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.card}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={styles.legend}>
                  <div style={styles.legendItem}><span style={{width:12,height:12,borderRadius:'50%',background:'var(--success)'}}></span> Available</div>
                  <div style={styles.legendItem}><span style={{width:12,height:12,borderRadius:'50%',background:'var(--danger)'}}></span> Occupied</div>
                  <div style={styles.legendItem}><span style={{width:12,height:12,borderRadius:'50%',background:'var(--warning)'}}></span> Reserved</div>
                  <div style={styles.legendItem}><span style={{width:12,height:12,borderRadius:'50%',background:'var(--primary)'}}></span> Cleaning</div>
               </div>
               
               <select style={{ ...styles.input, width: '200px', margin: 0 }} value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                  <option value="All">All Wards (Overview)</option>
                  <option value="ICU Floor 1">ICU Floor 1</option>
                  <option value="General Ward A">General Ward A</option>
               </select>
           </div>

           <div style={styles.grid}>
              {filteredBeds.map(bed => (
                 <div 
                    key={bed.id} 
                    style={styles.bedCircle(bed.status)} 
                    onClick={() => setSelectedBed(bed)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                 >
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>{bed.id}</div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: getStatusColor(bed.status), fontWeight: 'bold' }}>{bed.status}</div>
                 </div>
              ))}
           </div>
        </div>

        <div>
           {selectedBed ? (
              <div style={{ ...styles.card, position: 'sticky', top: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: 0, color: 'var(--primary)' }}>{selectedBed.id}</h2>
                      <span className={`badge badge-${selectedBed.status === 'available' ? 'success' : (selectedBed.status === 'occupied' ? 'danger' : 'primary')}`} style={{ textTransform: 'uppercase' }}>
                         {selectedBed.status}
                      </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                     <div style={{ display: 'flex', gap: '1rem' }}><Navigation size={18} color="var(--text-muted)"/> <strong>Ward:</strong> {selectedBed.ward}</div>
                     <div style={{ display: 'flex', gap: '1rem' }}><Activity size={18} color="var(--text-muted)"/> <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedBed.type}</span></div>
                     <div style={{ display: 'flex', gap: '1rem' }}><Info size={18} color="var(--text-muted)"/> <strong>Rate:</strong> ₹{selectedBed.dailyRate} / day</div>
                     <div style={{ display: 'flex', gap: '1rem' }}><CheckCircle size={18} color="var(--text-muted)"/> <strong>Equipment:</strong> {selectedBed.equipped.join(', ')}</div>
                  </div>

                  {selectedBed.status === 'occupied' && (
                      <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                         <h3 style={{ margin: '0 0 1rem 0' }}>Current Occupant</h3>
                         <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedBed.patientName}</div>
                         <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            <Calendar size={14}/> Admitted: {selectedBed.admissionDate}
                         </div>
                         <button onClick={() => handleDischarge(selectedBed.id)} className="btn-primary" style={{ width: '100%', padding: '0.75rem', background: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <LogOut size={16}/> Initiate Discharge Workflow
                         </button>
                      </div>
                  )}

                  {selectedBed.status === 'available' && (
                      <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
                         <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Allocate Bed</h3>
                         <input type="text" placeholder="Patient UHID (e.g. UHID-DEL-2026...)" value={uhidInput} onChange={e=>setUhidInput(e.target.value)} style={styles.input} />
                         <input type="number" placeholder="Expected Days of Stay" value={expectedDays} onChange={e=>setExpectedDays(e.target.value)} style={styles.input} />
                         
                         <button onClick={handleAllocate} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.75rem', background: 'var(--success)', borderColor: 'var(--success)' }}>
                            {loading ? 'Hashing Allocation...' : 'Confirm Allocation'}
                         </button>
                      </div>
                  )}

                  {selectedBed.status === 'cleaning' && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                         <p>Bed is currently undergoing sanitization workflow.</p>
                         <button 
                            onClick={() => setBeds(eds => eds.map(b => b.id === selectedBed.id ? {...b, status: 'available'} : b))} 
                            className="btn-secondary" 
                            style={{marginTop: '1rem'}}
                         >Mark as Clean & Free</button>
                      </div>
                  )}
              </div>
           ) : (
              <div style={{ ...styles.card, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Navigation size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <h3>Bed Inspector</h3>
                  <p>Select any bed unit from the floor plan to view details or manage allocation.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
