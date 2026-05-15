import React, { useState, useEffect, useCallback } from 'react';
import { Network, UserMinus, UserPlus, Activity, HeartPulse, Thermometer, Wind, Save, CheckCircle, ArrowRight, BedDouble, AlertCircle } from 'lucide-react';
import VisualWardMap from '../../components/clinical/VisualWardMap';
import { generateBlockchainHash } from '../../utils/blockchain';
import { useAuth } from '../../context/AuthContext';
import './NurseStation.css';

export default function NurseStation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vitals');
  const [triageQueue, setTriageQueue] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  
  const [vitalsData, setVitalsData] = useState({
     bloodPressure: '',
     heartRate: '',
     temperature: '',
     oxygenSat: ''
  });
  const [loading, setLoading] = useState(false);

  // --- DUMMY DATA FOR BED MANAGEMENT ---
  const [beds, setBeds] = useState([
    { id: '101', ward: 'General Ward B', status: 'Occupied', patientName: 'Rajesh Malhotra' },
    { id: '102', ward: 'General Ward B', status: 'Available' },
    { id: '103', ward: 'General Ward B', status: 'Cleaning' },
    { id: '104', ward: 'General Ward B', status: 'Available' },
    { id: '105', ward: 'General Ward B', status: 'Available' },
    { id: '106', ward: 'General Ward B', status: 'Available' },
    { id: '201', ward: 'ICU Floor 1', status: 'Occupied', patientName: 'Suman Lata' },
    { id: '202', ward: 'ICU Floor 1', status: 'Available' },
    { id: '203', ward: 'ICU Floor 1', status: 'Cleaning' },
  ]);

  const [patients, setPatients] = useState([
    { id: 'PT-001', name: 'Rajesh Malhotra', mrn: 'MRN-3001', bedId: '101' },
    { id: 'PT-002', name: 'Suman Lata', mrn: 'MRN-3002', bedId: '201' },
  ]);

  const [pendingAdmissions, setPendingAdmissions] = useState([
    { id: 'PA-001', name: 'Amit Trivedi', mrn: 'MRN-3003', severity: 'Moderate' },
    { id: 'PA-002', name: 'Bhavna Jha', mrn: 'MRN-3004', severity: 'Critical' }
  ]);

  const [selectedPendingId, setSelectedPendingId] = useState('');
  const [selectedAllocateBedId, setSelectedAllocateBedId] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTransferBedId, setSelectedTransferBedId] = useState('');
  // -------------------------------------

  const getMockTriageQueue = () => ([
      { queueId: 'Q-NS-1', patientName: 'Rajesh Malhotra', mrn: 'UHID-MOCK-3001', patientId: 'P-MOCK-3001', status: 'Waiting for Vitals' },
      { queueId: 'Q-NS-2', patientName: 'Suman Lata', mrn: 'UHID-MOCK-3002', patientId: 'P-MOCK-3002', status: 'Waiting for Vitals' },
      { queueId: 'Q-NS-3', patientName: 'Amit Trivedi', mrn: 'UHID-MOCK-3003', patientId: 'P-MOCK-3003', status: 'Waiting for Vitals' }
  ]);

  const fetchQueue = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/api/clinical/queue');
      if (resp.ok) {
        const data = await resp.json();
        const waiting = data.filter(q => q.status === 'Waiting for Vitals');
        setTriageQueue(waiting.length > 0 ? waiting : getMockTriageQueue());
      } else {
        setTriageQueue(getMockTriageQueue());
      }
    } catch (err) {
      console.error('Failed to fetch queue', err);
      setTriageQueue(getMockTriageQueue());
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleVitalsChange = (e) => {
    setVitalsData({...vitalsData, [e.target.name]: e.target.value});
  };

  const submitVitals = async () => {
    if(!selectedQueueId) return alert("Select a patient from the queue.");
    setLoading(true);

    try {
       const qItem = triageQueue.find(q => q.queueId === selectedQueueId);
       if (qItem) {
          const vitalRecord = { timestamp: new Date().toISOString(), ...vitalsData };
          const hash = await generateBlockchainHash({ type: "VITALS_RECORD", mrn: qItem.mrn, ...vitalRecord });
          vitalRecord.hash = hash;

          await fetch(`http://localhost:4000/api/clinical/patients/${qItem.patientId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ $push: { vitals: vitalRecord } })
          });
          
          await fetch(`http://localhost:4000/api/clinical/queue/${selectedQueueId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ status: 'Waiting for Doctor' })
          });
          
          alert("Vitals Logged and Hashed to Ledger:\n" + hash);
          setVitalsData({ bloodPressure: '', heartRate: '', temperature: '', oxygenSat: '' });
          setSelectedQueueId('');
          fetchQueue();
       }
    } catch(err) {
       console.error(err);
       alert("Error saving vitals.");
    }
    setLoading(false);
  };

  const handleAllocateBed = () => {
    if (!selectedPendingId || !selectedAllocateBedId) return alert("Please select both a patient and an available bed.");
    const patient = pendingAdmissions.find(p => p.id === selectedPendingId);
    
    setPatients([...patients, { id: `PT-${Date.now()}`, name: patient.name, mrn: patient.mrn, bedId: selectedAllocateBedId }]);
    setPendingAdmissions(pendingAdmissions.filter(p => p.id !== selectedPendingId));
    setBeds(beds.map(b => b.id === selectedAllocateBedId ? { ...b, status: 'Occupied', patientName: patient.name } : b));
    
    setSelectedPendingId('');
    setSelectedAllocateBedId('');
    alert(`Successfully allocated ${patient.name} to Bed ${selectedAllocateBedId}`);
  };

  const handleTransferPatient = () => {
    if (!selectedPatientId || !selectedTransferBedId) return alert("Please select a patient and a new bed to transfer to.");
    const patient = patients.find(p => p.id === selectedPatientId);
    const oldBedId = patient.bedId;
    
    setPatients(patients.map(p => p.id === selectedPatientId ? { ...p, bedId: selectedTransferBedId } : p));
    setBeds(beds.map(b => {
      if (b.id === oldBedId) return { ...b, status: 'Available', patientName: null };
      if (b.id === selectedTransferBedId) return { ...b, status: 'Occupied', patientName: patient.name };
      return b;
    }));
    
    setSelectedPatientId('');
    setSelectedTransferBedId('');
    alert(`Successfully transferred ${patient.name} to Bed ${selectedTransferBedId}`);
  };

  const handleBedClick = (bed) => {
    if (bed.status === 'Available') {
        if (activeTab === 'allocate') {
            setSelectedAllocateBedId(bed.id);
        } else if (activeTab === 'transfer') {
            setSelectedTransferBedId(bed.id);
        } else {
            setActiveTab('allocate');
            setSelectedAllocateBedId(bed.id);
        }
    } else if (bed.status === 'Occupied') {
        const patient = patients.find(p => p.bedId === bed.id);
        if (patient) {
            setActiveTab('transfer');
            setSelectedPatientId(patient.id);
        }
    } else if (bed.status === 'Cleaning') {
        if (window.confirm(`Bed ${bed.id} is currently being cleaned. Mark as Available?`)) {
            setBeds(beds.map(b => b.id === bed.id ? { ...b, status: 'Available' } : b));
        }
    }
  };

  const availableBeds = beds.filter(b => b.status === 'Available');

  return (
    <div className="nurse-station-wrapper animate-fade-in-up">
       <header className="nurse-station-header">
          <div className="title-group">
             <Network size={42} color="var(--primary)" />
             <h1>Nurse Station Operations</h1>
          </div>
          <div className="header-status-pill">
              <div className="pulse-dot"></div>
              <span>Station Node Active</span>
          </div>
       </header>

      <div className="nurse-station-grid">
        <aside className="operation-panel">
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
                          <option key={q.queueId} value={q.queueId}>{q.patientName} ({q.mrn})</option>
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
                          <option key={b.id} value={b.id}>Bed {b.id} - {b.ward}</option>
                       ))}
                    </select>
                 </div>

                 <button onClick={handleAllocateBed} className="btn-primary w-full" style={{ background: 'var(--success)' }}>
                    <CheckCircle size={18}/> Allocate Free Bed
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
                          <option key={p.id} value={p.id}>{p.name} (Currently in Bed {p.bedId})</option>
                       ))}
                    </select>
                 </div>

                 <div className="nurse-input-group">
                    <label className="nurse-label">Select Destination Bed</label>
                    <select className="form-select" value={selectedTransferBedId} onChange={(e) => setSelectedTransferBedId(e.target.value)}>
                       <option value="">-- Choose Available Bed --</option>
                       {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>Bed {b.id} - {b.ward}</option>
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
                title="Visual Ward Map"
                subtitle="ICU Floor Plan"
                beds={beds}
                onBedClick={handleBedClick}
            />
            
            <div className="dashboard-stats-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="stat-card" style={{ background: '#f0fdf4', border: '1px solid #10b981', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Available</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#064e3b' }}>{beds.filter(b => b.status === 'Available').length}</div>
                </div>
                <div className="stat-card" style={{ background: '#fef2f2', border: '1px solid #ef4444', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Occupied</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7f1d1d' }}>{beds.filter(b => b.status === 'Occupied').length}</div>
                </div>
                <div className="stat-card" style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Cleaning</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#78350f' }}>{beds.filter(b => b.status === 'Cleaning').length}</div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}

