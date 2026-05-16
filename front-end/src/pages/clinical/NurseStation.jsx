import React, { useState, useEffect, useCallback } from 'react';
import { Network, UserMinus, UserPlus, Activity, HeartPulse, Thermometer, Wind, Save, CheckCircle, ArrowRight, BedDouble, AlertCircle } from 'lucide-react';
import VisualWardMap from '../../components/clinical/VisualWardMap';
import { generateBlockchainHash } from '../../utils/blockchain';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import './NurseStation.css';

export default function NurseStation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vitals');
  const [selectedRoom, setSelectedRoom] = useState('Room 101');
  const rooms = ['Room 101', 'Room 102', 'Room 103'];
  const [triageQueue, setTriageQueue] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  
  const [vitalsData, setVitalsData] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSat: '',
    respiratoryRate: ''
  });
  const [loading, setLoading] = useState(false);

  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pendingAdmissions, setPendingAdmissions] = useState([]);

  const [selectedPendingId, setSelectedPendingId] = useState('');
  const [selectedAllocateBedId, setSelectedAllocateBedId] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTransferBedId, setSelectedTransferBedId] = useState('');

  const fetchWardData = useCallback(async () => {
    const activeWard = user?.assignedWard || user?.department;
    if (!activeWard) {
      console.warn("NurseStation: No ward/department found for user", user);
      return;
    }
    try {
      setLoading(true);
      console.log(`NurseStation: Fetching data for ward: ${activeWard}`);

      // Fetch Patients in this ward/room
      let currentPatients = [];
      const pUrl = `${API_BASE_URL}/critical/wards/${encodeURIComponent(activeWard)}/patients?room=${encodeURIComponent(selectedRoom)}`;
      console.log(`NurseStation DEBUG: Fetching patients from ${pUrl}`);
      const pResp = await fetch(pUrl);
      if (pResp.ok) {
        currentPatients = await pResp.json();
        console.log(`NurseStation DEBUG: Fetched ${currentPatients.length} patients`);
        setPatients(currentPatients);
      }

      // Fetch All Beds and filter by ward and room
      const bUrl = `${API_BASE_URL}/critical/beds?ward=${encodeURIComponent(activeWard)}`;
      console.log(`NurseStation DEBUG: Fetching beds from ${bUrl}`);
      const bResp = await fetch(bUrl);
      if (bResp.ok) {
        const allBeds = await bResp.json();
        console.log(`NurseStation DEBUG: Total beds returned from API: ${allBeds.length}`);
        
        const wardBeds = allBeds
          .filter(b => {
             const wardMatch = b.wardName?.toUpperCase() === activeWard.toUpperCase();
             const roomMatch = b.roomNumber === selectedRoom;
             return wardMatch && roomMatch;
          })
          .map(b => {
            const patient = currentPatients.find(p => p.currentBed === b.bedId);
            const latestVitals = patient?.vitals?.[patient.vitals.length - 1] || {};
            return {
              ...b,
              id: b.bedId,
              patientName: patient?.patientName || null,
              patientMRN: patient?.mrn || null,
              vitals: {
                pulse: latestVitals.heartRate || latestVitals.hr || '--',
                spo2: latestVitals.oxygenSat || latestVitals.spo2 || latestVitals.spO2 || '--',
                bp: latestVitals.bp || '--',
                temp: latestVitals.temp || '--'
              }
            };
          });
        console.log(`NurseStation DEBUG: wardBeds filtered length: ${wardBeds.length}`);
        setBeds(wardBeds);
      }

      // Fetch Triage Queue for this department
      const qResp = await fetch(`${API_BASE_URL}/clinical/queue?department=${encodeURIComponent(activeWard)}`);
      if (qResp.ok) {
        const data = await qResp.json();
        const waitingPatients = data.filter(q => q.status === 'WAITING' || q.status === 'Waiting').map(q => ({
          ...q,
          id: q.queueId,
          name: q.patientName,
          severity: q.priority
        }));
        console.log(`NurseStation: ${waitingPatients.length} patients in triage queue`);
        setTriageQueue(waitingPatients);
        setPendingAdmissions(waitingPatients);
      }
    } catch (err) {
      console.error('NurseStation: Failed to fetch ward data', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedRoom]);

  useEffect(() => {
    fetchWardData();
    const interval = setInterval(fetchWardData, 15000);
    return () => clearInterval(interval);
  }, [fetchWardData, selectedRoom]);

  const handleVitalsChange = (e) => {
    setVitalsData({...vitalsData, [e.target.name]: e.target.value});
  };

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    if (bed.status === 'AVAILABLE') {
      setShowAllocateModal(true);
    } else {
      setShowVitalsModal(true);
      // Pre-fill vitals if available
      const patient = patients.find(p => p.currentBed === bed.bedId);
      if (patient?.vitals?.length > 0) {
        const last = patient.vitals[patient.vitals.length - 1];
        setVitalsData({
            bloodPressure: last.bp || '',
            heartRate: last.heartRate || '',
            temperature: last.temp || '',
            oxygenSat: last.spo2 || '',
            respiratoryRate: last.respiratoryRate || ''
        });
      }
    }
  };

  const handleAllocatePatient = async (patientId) => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/critical/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          bedId: selectedBed.bedId,
          wardName: activeWard,
          doctorName: user?.name || 'Assigned Physician'
        })
      });

      if (resp.ok) {
        setShowAllocateModal(false);
        fetchWardData();
      } else {
        const err = await resp.json();
        alert(err.message || 'Allocation failed');
      }
    } catch (err) {
      alert('Network error during allocation');
    } finally {
      setLoading(false);
    }
  };

  const submitVitals = async () => {
    if (!selectedBed && !selectedQueueId) return;
    
    // Determine if we are updating a bed patient or a queue patient
    let patientId;
    if (selectedBed) {
        const p = patients.find(p => p.currentBed === selectedBed.bedId);
        patientId = p?._id;
    } else {
        const q = triageQueue.find(q => q.id === selectedQueueId);
        patientId = q?.patientId;
    }

    if (!patientId) return;

    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/clinical/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          vitals: {
            ...vitalsData,
            bp: vitalsData.bloodPressure,
            spo2: vitalsData.oxygenSat,
            recordedBy: user?.name || 'Nurse'
          }
        })
      });

      if (resp.ok) {
        setShowVitalsModal(false);
        setSelectedQueueId('');
        setVitalsData({ bloodPressure: '', heartRate: '', temperature: '', oxygenSat: '', respiratoryRate: '' });
        fetchWardData();
      } else {
        alert('Failed to update vitals');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'AVAILABLE').length,
    occupied: beds.filter(b => b.status === 'OCCUPIED').length,
    critical: beds.filter(b => b.status === 'CRITICAL').length,
    maintenance: beds.filter(b => b.status === 'UNDER_MAINTENANCE' || b.status === 'UNDER OBSERVATION').length
  };

  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');

  const activeWard = user?.assignedWard || user?.department;

  return (
    <div className="nurse-station-wrapper animate-fade-in-up">
       <header className="nurse-station-header">
          <div className="title-group">
             <Network size={42} color="var(--primary)" />
             <h1>{activeWard} Nurse Station</h1>
          </div>
          <div className="header-status-pill">
              <div className="pulse-dot"></div>
              <span>{user?.name} | Ward Node Active</span>
          </div>
       </header>

       {/* Room Selection Tabs */}
       <div className="room-nav-container">
          {rooms.map(room => (
             <button 
                key={room} 
                className={`room-tab ${selectedRoom === room ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
             >
                {room}
             </button>
          ))}
       </div>

      <div className="nurse-station-grid">
        <aside className="operation-panel">
           <div className="occupancy-mini-dashboard">
              <div className="mini-stat-card">
                 <span className="mini-label">TOTAL BEDS</span>
                 <span className="mini-value">{stats.total}</span>
              </div>
              <div className="mini-stat-card available">
                 <span className="mini-label">AVAILABLE</span>
                 <span className="mini-value">{stats.available}</span>
              </div>
              <div className="mini-stat-card occupied">
                 <span className="mini-label">OCCUPIED</span>
                 <span className="mini-value">{stats.occupied}</span>
              </div>
              <div className="mini-stat-card critical">
                 <span className="mini-label">CRITICAL</span>
                 <span className="mini-value">{stats.critical}</span>
              </div>
           </div>

           <div className="operation-tabs">
              <div className={`op-tab ${activeTab === 'vitals' ? 'active' : ''}`} onClick={() => setActiveTab('vitals')}>Triage Vitals</div>
              <div className={`op-tab ${activeTab === 'allocate' ? 'active' : ''}`} onClick={() => setActiveTab('allocate')}>Allocate Bed</div>
              <div className={`op-tab ${activeTab === 'transfer' ? 'active' : ''}`} onClick={() => setActiveTab('transfer')}>Transfer Patient</div>
           </div>

           {activeTab === 'vitals' && (
              <div className="animate-fade-in-up">
                 <h3 className="form-title">Active Triage Queue</h3>
                 
                 <div className="nurse-input-group">
                    <label className="nurse-label">Select Checked-in Patient</label>
                    <select className="form-select" value={selectedQueueId} onChange={(e) => setSelectedQueueId(e.target.value)}>
                       <option value="">-- Choose Patient in Waiting Area --</option>
                       {triageQueue.map(q => (
                          <option key={q.id} value={q.id}>{q.name} ({q.mrn})</option>
                       ))}
                    </select>
                 </div>

                 {selectedQueueId && (
                   <div className="vitals-entry-grid animate-fade-in-up">
                        <div className="nurse-input-group">
                           <div className="vitals-label-with-icon"><Activity size={16}/> Blood Pressure</div>
                           <input name="bloodPressure" value={vitalsData.bloodPressure} onChange={handleVitalsChange} placeholder="120/80 mmHg" />
                        </div>
                        <div className="nurse-input-group">
                           <div className="vitals-label-with-icon"><HeartPulse size={16}/> Heart Rate</div>
                           <input name="heartRate" value={vitalsData.heartRate} onChange={handleVitalsChange} placeholder="72 bpm" />
                        </div>
                        <div className="nurse-input-group">
                           <div className="vitals-label-with-icon"><Thermometer size={16}/> Temperature</div>
                           <input name="temperature" value={vitalsData.temperature} onChange={handleVitalsChange} placeholder="98.6 F" />
                        </div>
                        <div className="nurse-input-group">
                           <div className="vitals-label-with-icon"><Wind size={16}/> Oxygen Saturation</div>
                           <input name="oxygenSat" value={vitalsData.oxygenSat} onChange={handleVitalsChange} placeholder="99 %" />
                        </div>
                        <button onClick={submitVitals} disabled={loading} className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                           {loading ? 'Securing Transaction...' : <><Save size={18}/> Push Vitals & Route to Doctor</>}
                        </button>
                   </div>
                 )}
              </div>
           )}

           {activeTab === 'allocate' && (
              <div className="animate-fade-in-up">
                 <h3 className="form-title">Allocate New Patient</h3>
                 
                 <div className="nurse-input-group">
                    <label className="nurse-label">Pending Admissions</label>
                    <select className="form-select" value={selectedPendingId} onChange={(e) => setSelectedPendingId(e.target.value)}>
                       <option value="">-- Choose Pending Patient --</option>
                       {pendingAdmissions.map(pa => (
                          <option key={pa.id} value={pa.id}>{pa.name} ({pa.mrn}) - {pa.severity}</option>
                       ))}
                    </select>
                 </div>

                 <div className="nurse-input-group">
                    <label className="nurse-label">Select Available Bed</label>
                    <select className="form-select" value={selectedAllocateBedId} onChange={(e) => setSelectedAllocateBedId(e.target.value)}>
                       <option value="">-- Choose Available Bed --</option>
                       {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>Bed {b.id}</option>
                       ))}
                    </select>
                 </div>

                 <button onClick={handleAllocateBed} disabled={loading} className="btn-primary w-full" style={{ background: 'var(--success)' }}>
                    <CheckCircle size={18}/> {loading ? 'Allocating...' : 'Allocate Free Bed'}
                 </button>
              </div>
           )}

           {activeTab === 'transfer' && (
              <div className="animate-fade-in-up">
                 <h3 className="form-title">Transfer Admitted Patient</h3>
                 
                 <div className="nurse-input-group">
                    <label className="nurse-label">Current Admitted Patients</label>
                    <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                       <option value="">-- Choose Admitted Patient --</option>
                       {patients.map(p => (
                          <option key={p._id} value={p._id}>{p.patientName} (Currently in Bed {p.currentBed || 'None'})</option>
                       ))}
                    </select>
                 </div>

                 <div className="nurse-input-group">
                    <label className="nurse-label">Select Destination Bed</label>
                    <select className="form-select" value={selectedTransferBedId} onChange={(e) => setSelectedTransferBedId(e.target.value)}>
                       <option value="">-- Choose Available Bed --</option>
                       {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>Bed {b.id}</option>
                       ))}
                    </select>
                 </div>

                 <button onClick={handleTransferPatient} className="btn-primary w-full">
                    <ArrowRight size={18}/> Transfer Patient
                 </button>
              </div>
           )}

            <div className="help-box animate-fade-in-up" style={{ marginTop: '2rem' }}>
                <AlertCircle size={20} color="var(--primary)" />
                <p>Click on any bed in the visual map to quickly start an allocation or transfer process.</p>
            </div>
        </aside>

        <main className="status-main">
            <VisualWardMap 
                title={`${activeWard} Map`}
                subtitle={`Real-time occupancy for ${activeWard} — ${selectedRoom}`}
                beds={beds}
                onBedClick={handleBedClick}
            />
            
            <div className="dashboard-stats-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div className="stat-card" style={{ background: '#f0fdf4', border: '1px solid #10b981', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Available</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#064e3b' }}>{beds.filter(b => b.status === 'AVAILABLE').length}</div>
                </div>
                <div className="stat-card" style={{ background: '#fef2f2', border: '1px solid #ef4444', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Occupied</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7f1d1d' }}>{beds.filter(b => b.status === 'OCCUPIED').length}</div>
                </div>
                <div className="stat-card" style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Critical</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#92400e' }}>{beds.filter(b => b.status === 'CRITICAL').length}</div>
                </div>
                <div className="stat-card" style={{ background: '#f8fafc', border: '1px solid #64748b', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Maintenance</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b' }}>{beds.filter(b => b.status === 'UNDER_MAINTENANCE').length}</div>
                </div>
            </div>
        </main>
      </div>

      {/* MODALS */}
      {showAllocateModal && (
        <div className="nurse-modal-overlay">
            <div className="nurse-modal-content animate-scale-in">
                <header className="modal-header">
                    <h3>Allocate Patient: Bed {selectedBed?.bedNumber}</h3>
                    <button className="btn-close" onClick={() => setShowAllocateModal(false)}>×</button>
                </header>
                <div className="modal-body">
                    <p className="modal-subtitle">Select a patient from the department queue to allocate to this bed.</p>
                    <div className="modal-patient-list">
                        {triageQueue.map(p => (
                            <div key={p.id} className="modal-patient-card" onClick={() => handleAllocatePatient(p.patientId)}>
                                <div className="p-info">
                                    <span className="p-name">{p.patientName}</span>
                                    <span className="p-mrn">{p.mrn}</span>
                                </div>
                                <div className={`p-priority ${p.severity?.toLowerCase()}`}>{p.severity || 'NORMAL'}</div>
                                <button className="btn-allocate-mini">ALLOCATE</button>
                            </div>
                        ))}
                        {triageQueue.length === 0 && <div className="empty-modal">No pending patients in {activeWard} queue.</div>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showVitalsModal && (
        <div className="nurse-modal-overlay">
            <div className="nurse-modal-content animate-scale-in">
                <header className="modal-header">
                    <h3>Update Vitals: Bed {selectedBed?.bedNumber}</h3>
                    <button className="btn-close" onClick={() => { setShowVitalsModal(false); setSelectedBed(null); }}>×</button>
                </header>
                <div className="modal-body">
                    <div className="vitals-modal-grid">
                        <div className="nurse-input-group">
                            <label><Activity size={14}/> BP (mmHg)</label>
                            <input name="bloodPressure" value={vitalsData.bloodPressure} onChange={handleVitalsChange} placeholder="120/80" />
                        </div>
                        <div className="nurse-input-group">
                            <label><HeartPulse size={14}/> Heart Rate</label>
                            <input name="heartRate" value={vitalsData.heartRate} onChange={handleVitalsChange} placeholder="72" />
                        </div>
                        <div className="nurse-input-group">
                            <label><Wind size={14}/> SpO2 (%)</label>
                            <input name="oxygenSat" value={vitalsData.oxygenSat} onChange={handleVitalsChange} placeholder="98" />
                        </div>
                        <div className="nurse-input-group">
                            <label><Thermometer size={14}/> Temp (F)</label>
                            <input name="temperature" value={vitalsData.temperature} onChange={handleVitalsChange} placeholder="98.6" />
                        </div>
                        <div className="nurse-input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Respiratory Rate</label>
                            <input name="respiratoryRate" value={vitalsData.respiratoryRate} onChange={handleVitalsChange} placeholder="16" />
                        </div>
                    </div>
                    <button onClick={submitVitals} disabled={loading} className="btn-primary w-full mt-6">
                        {loading ? 'Updating...' : 'PUSH LIVE VITALS'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

