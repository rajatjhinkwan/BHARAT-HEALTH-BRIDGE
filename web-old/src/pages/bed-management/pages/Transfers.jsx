import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ArrowRight, Check } from 'lucide-react';

const Transfers = () => {
  const { patients, beds, allBeds, transferPatient } = useHospital();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [reason, setReason] = useState('');
  const [isTransferred, setIsTransferred] = useState(false);

  // Source beds (filtered by active ward view) are handled by selecting patients
  // Destination beds should be ALL beds across the hospital
  const availableBeds = allBeds.filter(b => b.status === 'Available');
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedBedId) return;

    transferPatient(selectedPatientId, selectedBedId, reason || 'Standard transfer');
    setIsTransferred(true);
    
    setTimeout(() => {
      setIsTransferred(false);
      setSelectedPatientId('');
      setSelectedBedId('');
      setReason('');
    }, 3000);
  };

  return (
    <div className="animate-fade-in fade-up" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header mb-6" style={{ padding: '0', textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem' }}>Patient Transfer</h1>
        <p className="page-sub" style={{ fontSize: '1.1rem' }}>Move an admitted patient to a new bed safely and track the reason.</p>
      </div>

      <div className="card" style={{ padding: '3rem', marginTop: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        {isTransferred ? (
          <div className="flex flex-col items-center justify-center py-10 success-state">
            <div className="success-icon" style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
              <Check size={48} />
            </div>
            <h2 style={{ color: 'var(--color-success)', fontSize: '2rem', fontWeight: 800 }}>Transfer Complete</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-2)' }}>The patient has been safely moved to the new bed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-6">
              <label className="form-label" style={{ fontSize: '1rem' }}>Select Patient</label>
              <select 
                className="form-control" 
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                style={{ padding: '1rem 1.25rem', fontSize: '1.1rem' }}
              >
                <option value="">-- Choose a patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Current Bed: {p.bedId})</option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '2.5rem 0', padding: '2rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Current Bed</p>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedPatient.bedId}</h3>
                </div>
                
                <div style={{ color: 'var(--text-dim)', padding: '0 1rem' }}>
                  <ArrowRight size={40} />
                </div>
                
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--primary-dark)' }}>Target Bed</p>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: selectedBedId ? 'var(--primary)' : 'var(--text-dim)' }}>{selectedBedId || '?'}</h3>
                </div>
              </div>
            )}

            <div className="form-group mb-6" style={{ opacity: !selectedPatientId ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
              <label className="form-label" style={{ fontSize: '1rem' }}>Destination Bed</label>
              <select 
                className="form-control" 
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                required
                disabled={!selectedPatientId}
                style={{ padding: '1rem 1.25rem', fontSize: '1.1rem' }}
              >
                {!selectedPatientId ? (
                  <option value="">Select a patient first...</option>
                ) : (
                  <>
                    <option value="">-- Choose an available bed --</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>Bed {b.id} - {b.ward} ({b.type})</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="form-group mb-8">
              <label className="form-label" style={{ fontSize: '1rem' }}>Reason for Transfer (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Requires ICU, Condition improved..."
                style={{ padding: '1rem 1.25rem', fontSize: '1.1rem' }}
              />
            </div>

            <div className="flex justify-end mt-6">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!selectedPatientId || !selectedBedId}
                style={{ 
                  opacity: (!selectedPatientId || !selectedBedId) ? 0.5 : 1, 
                  padding: '1rem 2rem', 
                  fontSize: '1.1rem',
                  boxShadow: (!selectedPatientId || !selectedBedId) ? 'none' : 'var(--shadow-primary)'
                }}
              >
                Execute Transfer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Transfers;
