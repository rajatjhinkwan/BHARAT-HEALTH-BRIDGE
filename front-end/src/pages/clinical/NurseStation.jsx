import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Network, Activity, HeartPulse, Thermometer, Wind, Save, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import VisualWardMap from '../../components/clinical/VisualWardMap';
import PatientDetailOverlay from '../../components/clinical/PatientDetailOverlay';
import WardSelector from '../../components/clinical/WardSelector';
import BedStatStrip from '../../components/clinical/BedStatStrip';
import { usePatientDetailOverlay } from '../../hooks/usePatientDetailOverlay';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { API_BASE_URL } from '../../config';
import { io } from 'socket.io-client';
import { isOversightRole } from '../../utils/roles';
import {
  CLINICAL_WARDS,
  ALL_ROOMS,
  computeBedStats,
  resolveInitialWard,
  setStoredWard,
  wardToOpdDepartment,
  toDisplayLabel,
  roomMatches,
} from '../../utils/wards';
import { fetchWards, fetchWardBeds, fetchWardPatients } from '../../services/wardApi';
import { SkeletonQueue, Shimmer } from '../../components/SkeletonLoader';
import './NurseStation.css';

const socket = io(API_BASE_URL.replace('/api', ''));

export { CLINICAL_WARDS };

function enrichBed(b, patients) {
  const patient = patients.find((p) => p.currentBed === b.bedId);
  const latestVitals = patient?.vitals?.length ? patient.vitals[patient.vitals.length - 1] : {};
  return {
    ...b,
    id: b.bedId,
    patientName: patient?.patientName || null,
    patientMRN: patient?.mrn || null,
    vitals: {
      pulse: latestVitals.heartRate || latestVitals.hr || '--',
      spo2: latestVitals.oxygenSat || latestVitals.spo2 || latestVitals.spO2 || '--',
      bp: latestVitals.bp || '--',
      temp: latestVitals.temp || '--',
    },
  };
}

export default function NurseStation() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const {
    selectedPatient,
    isFullscreen,
    isPatientDetailOpen,
    openPatientDetail,
    closePatientDetail,
    togglePatientDetailFullscreen,
  } = usePatientDetailOverlay();

  const role = (user?.role || '').toUpperCase();
  const isOversight = isOversightRole(role);

  const [selectedWard, setSelectedWard] = useState(() =>
    resolveInitialWard(user, searchParams.get('ward'))
  );
  const [wardMeta, setWardMeta] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(ALL_ROOMS);
  const [activeTab, setActiveTab] = useState('vitals');
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
    respiratoryRate: '',
  });
  const [loading, setLoading] = useState(false);
  const [allWardBeds, setAllWardBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pendingAdmissions, setPendingAdmissions] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState('');
  const [selectedAllocateBedId, setSelectedAllocateBedId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTransferBedId, setSelectedTransferBedId] = useState('');

  const rooms = useMemo(() => {
    const meta = wardMeta.find((w) => w.key === selectedWard);
    const fromApi = meta?.rooms?.length ? meta.rooms : ['Room 101', 'Room 102', 'Room 103'];
    return [ALL_ROOMS, ...fromApi];
  }, [wardMeta, selectedWard]);

  const handleWardChange = (wardKey) => {
    setStoredWard(wardKey);
    setSelectedWard(wardKey);
    setSelectedRoom(ALL_ROOMS);
  };

  useEffect(() => {
    fetchWards()
      .then(setWardMeta)
      .catch(() => setWardMeta([]));
  }, []);

  const fetchWardData = useCallback(async () => {
    if (!selectedWard) return;
    try {
      setLoading(true);
      const roomParam = selectedRoom === ALL_ROOMS ? undefined : selectedRoom;
      const [allBeds, currentPatients, qResp] = await Promise.all([
        fetchWardBeds(selectedWard),
        fetchWardPatients(selectedWard, roomParam),
        fetch(
          `${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(wardToOpdDepartment(selectedWard))}`
        ),
      ]);

      setPatients(currentPatients);

      const wardBeds = allBeds
        .filter((b) => b.wardName?.toUpperCase() === selectedWard.toUpperCase())
        .map((b) => enrichBed(b, currentPatients));

      setAllWardBeds(wardBeds);

      if (qResp.ok) {
        const data = await qResp.json();
        const waiting = (data.waiting || [])
          .filter((q) => q.status === 'WAITING' || q.status === 'Waiting')
          .map((q) => ({
            ...q,
            id: q.queueId || q._id,
            name: q.patientName,
            severity: q.priority,
          }));
        setTriageQueue(waiting);
        setPendingAdmissions(waiting);
      }
    } catch {
      showNotification('Could not refresh ward data', 'warning');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, selectedWard, showNotification]);

  useEffect(() => {
    fetchWardData();
    const interval = setInterval(fetchWardData, 15000);
    const onUpdate = () => fetchWardData();
    socket.on('criticalUpdate', onUpdate);
    socket.on('bedUpdate', onUpdate);
    return () => {
      clearInterval(interval);
      socket.off('criticalUpdate', onUpdate);
      socket.off('bedUpdate', onUpdate);
    };
  }, [fetchWardData]);

  const displayBeds = useMemo(
    () => allWardBeds.filter((b) => roomMatches(b.roomNumber, selectedRoom)),
    [allWardBeds, selectedRoom]
  );

  const wardStats = useMemo(() => computeBedStats(allWardBeds), [allWardBeds]);
  const roomStats = useMemo(() => computeBedStats(displayBeds), [displayBeds]);
  const stats = selectedRoom === ALL_ROOMS ? wardStats : roomStats;
  const availableBeds = displayBeds.filter((b) => b.status === 'AVAILABLE');

  const handleVitalsChange = (e) => {
    setVitalsData({ ...vitalsData, [e.target.name]: e.target.value });
  };

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    if (bed.status === 'AVAILABLE') {
      setShowAllocateModal(true);
      return;
    }
    const patient = patients.find((p) => p.currentBed === bed.bedId);
    if (patient) {
      openPatientDetail({ ...patient, bedNumber: bed.bedNumber });
      return;
    }
    setShowVitalsModal(true);
  };

  const handleAllocatePatient = async (patientId) => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/critical/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          bedId: selectedBed.bedId || selectedBed.id,
          wardName: selectedWard,
          doctorName: user?.name || 'Assigned Physician',
        }),
      });
      if (resp.ok) {
        showNotification('Patient allocated to bed successfully!', 'success');
        setShowAllocateModal(false);
        fetchWardData();
      } else {
        const err = await resp.json();
        showNotification(err.message || 'Allocation failed', 'error');
      }
    } catch {
      showNotification('Network error during allocation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitVitals = async () => {
    let patientId;
    if (selectedBed) {
      const p = patients.find((p) => p.currentBed === selectedBed.bedId);
      patientId = p?._id;
    } else {
      const q = triageQueue.find((q) => q.id === selectedQueueId);
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
            recordedBy: user?.name || 'Nurse',
          },
        }),
      });
      if (resp.ok) {
        showNotification('Vitals recorded successfully', 'success');
        setShowVitalsModal(false);
        setSelectedQueueId('');
        setVitalsData({ bloodPressure: '', heartRate: '', temperature: '', oxygenSat: '', respiratoryRate: '' });
        fetchWardData();
      } else {
        showNotification('Failed to update vitals', 'error');
      }
    } catch {
      showNotification('Network error updating vitals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateBed = async () => {
    if (!selectedPendingId || !selectedAllocateBedId) {
      showNotification('Select a pending patient and an available bed.', 'warning');
      return;
    }
    const pendingPatientObj = pendingAdmissions.find((pa) => pa.id === selectedPendingId);
    if (!pendingPatientObj?.patientId) {
      showNotification('Invalid patient selection.', 'error');
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/critical/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pendingPatientObj.patientId,
          bedId: selectedAllocateBedId,
          wardName: selectedWard,
          doctorName: user?.name || 'Assigned Physician',
        }),
      });
      if (resp.ok) {
        showNotification(`Patient allocated to bed successfully`, 'success');
        setSelectedPendingId('');
        setSelectedAllocateBedId('');
        fetchWardData();
      } else {
        const err = await resp.json();
        showNotification(err.message || 'Allocation failed', 'error');
      }
    } catch {
      showNotification('Network error during allocation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPatient = async () => {
    if (!selectedPatientId || !selectedTransferBedId) {
      showNotification('Select patient and destination bed.', 'warning');
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/critical/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          bedId: selectedTransferBedId,
          wardName: selectedWard,
          doctorName: user?.name || 'Assigned Physician',
        }),
      });
      if (resp.ok) {
        showNotification('Patient transferred successfully', 'success');
        setSelectedPatientId('');
        setSelectedTransferBedId('');
        fetchWardData();
      } else {
        const err = await resp.json();
        showNotification(err.message || 'Transfer failed', 'error');
      }
    } catch {
      showNotification('Network error during transfer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const roomLabel = selectedRoom === ALL_ROOMS ? 'All rooms (ward-wide)' : selectedRoom;

  return (
    <div className="nurse-station-wrapper animate-fade-in-up">
      <header className="nurse-station-header">
        <div className="title-group">
          <Network size={42} color="var(--primary)" />
          {isOversight ? (
            <WardSelector value={selectedWard} onChange={handleWardChange} />
          ) : (
            <div>
              <h1>{toDisplayLabel(selectedWard)} Nurse Station</h1>
              <span className="ward-select-subtitle">{selectedWard}</span>
            </div>
          )}
        </div>
        <div className="header-status-pill">
          <div className="pulse-dot" />
          <span>{user?.name} | {toDisplayLabel(selectedWard)}</span>
        </div>
      </header>

      <div className="room-nav-container">
        {rooms.map((room) => (
          <button
            key={room}
            type="button"
            className={`room-tab ${selectedRoom === room ? 'active' : ''}`}
            onClick={() => setSelectedRoom(room)}
          >
            {room === ALL_ROOMS ? 'All rooms' : room}
          </button>
        ))}
      </div>

      <div className="nurse-station-grid">
        <aside className="operation-panel">
          <BedStatStrip stats={stats} loading={loading} variant="mini" />

          <div className="operation-tabs">
            <div className={`op-tab ${activeTab === 'vitals' ? 'active' : ''}`} onClick={() => setActiveTab('vitals')}>Triage Vitals</div>
            <div className={`op-tab ${activeTab === 'allocate' ? 'active' : ''}`} onClick={() => setActiveTab('allocate')}>Allocate Bed</div>
            <div className={`op-tab ${activeTab === 'transfer' ? 'active' : ''}`} onClick={() => setActiveTab('transfer')}>Transfer Patient</div>
          </div>

          {activeTab === 'vitals' && (
            <div className="animate-fade-in-up">
              <h3 className="form-title">OPD Triage Queue ({wardToOpdDepartment(selectedWard)})</h3>
              {loading && triageQueue.length === 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <SkeletonQueue count={2} />
                </div>
              ) : (
                <>
                  <div className="nurse-input-group">
                    <label className="nurse-label">Select checked-in patient</label>
                    <select className="form-select" value={selectedQueueId} onChange={(e) => setSelectedQueueId(e.target.value)}>
                      <option value="">-- Choose patient in waiting area --</option>
                      {triageQueue.map((q) => (
                        <option key={q.id} value={q.id}>{q.name} ({q.mrn})</option>
                      ))}
                    </select>
                  </div>
                  {selectedQueueId && (
                    <div className="vitals-entry-grid animate-fade-in-up">
                      <div className="nurse-input-group">
                        <div className="vitals-label-with-icon"><Activity size={16} /> Blood Pressure</div>
                        <input name="bloodPressure" value={vitalsData.bloodPressure} onChange={handleVitalsChange} placeholder="120/80 mmHg" />
                      </div>
                      <div className="nurse-input-group">
                        <div className="vitals-label-with-icon"><HeartPulse size={16} /> Heart Rate</div>
                        <input name="heartRate" value={vitalsData.heartRate} onChange={handleVitalsChange} placeholder="72 bpm" />
                      </div>
                      <div className="nurse-input-group">
                        <div className="vitals-label-with-icon"><Thermometer size={16} /> Temperature</div>
                        <input name="temperature" value={vitalsData.temperature} onChange={handleVitalsChange} placeholder="37.0 °C" />
                      </div>
                      <div className="nurse-input-group">
                        <div className="vitals-label-with-icon"><Wind size={16} /> SpO2</div>
                        <input name="oxygenSat" value={vitalsData.oxygenSat} onChange={handleVitalsChange} placeholder="99 %" />
                      </div>
                      <button type="button" onClick={submitVitals} disabled={loading} className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        {loading ? 'Saving…' : <><Save size={18} /> Record vitals</>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'allocate' && (
            <div className="animate-fade-in-up">
              <h3 className="form-title">Allocate new patient</h3>
              <div className="nurse-input-group">
                <label className="nurse-label">Pending admissions</label>
                <select className="form-select" value={selectedPendingId} onChange={(e) => setSelectedPendingId(e.target.value)}>
                  <option value="">-- Choose pending patient --</option>
                  {pendingAdmissions.map((pa) => (
                    <option key={pa.id} value={pa.id}>{pa.name} ({pa.mrn}) - {pa.severity}</option>
                  ))}
                </select>
              </div>
              <div className="nurse-input-group">
                <label className="nurse-label">Available bed ({roomLabel})</label>
                <select className="form-select" value={selectedAllocateBedId} onChange={(e) => setSelectedAllocateBedId(e.target.value)}>
                  <option value="">-- Choose bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>Bed {b.bedNumber || b.id} · {b.roomNumber}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleAllocateBed} disabled={loading} className="btn-primary w-full" style={{ background: 'var(--success)' }}>
                <CheckCircle size={18} /> {loading ? 'Allocating…' : 'Allocate bed'}
              </button>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="animate-fade-in-up">
              <h3 className="form-title">Transfer admitted patient</h3>
              <div className="nurse-input-group">
                <label className="nurse-label">Current patients</label>
                <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                  <option value="">-- Choose patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.patientName} (Bed {p.currentBed || '—'})</option>
                  ))}
                </select>
              </div>
              <div className="nurse-input-group">
                <label className="nurse-label">Destination bed</label>
                <select className="form-select" value={selectedTransferBedId} onChange={(e) => setSelectedTransferBedId(e.target.value)}>
                  <option value="">-- Choose bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>Bed {b.bedNumber || b.id}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleTransferPatient} className="btn-primary w-full">
                <ArrowRight size={18} /> Transfer patient
              </button>
            </div>
          )}

          <div className="help-box animate-fade-in-up" style={{ marginTop: '2rem' }}>
            <AlertCircle size={20} color="var(--primary)" />
            <p>Tap any bed to view details, record vitals, or allocate. Stats show ward-wide when &quot;All rooms&quot; is selected.</p>
          </div>
        </aside>

        <main className="status-main">
          {loading && displayBeds.length === 0 ? (
            <div className="visual-ward-map-container" style={{ padding: '2rem' }}>
              <Shimmer style={{ height: '200px', borderRadius: '16px' }} />
            </div>
          ) : (
            <VisualWardMap
              title={`${toDisplayLabel(selectedWard)} Map`}
              subtitle={`${roomLabel} · ${displayBeds.length} beds shown`}
              beds={displayBeds}
              onBedClick={handleBedClick}
            />
          )}
          <div style={{ marginTop: '2rem' }}>
            <BedStatStrip stats={stats} loading={loading} variant="large" />
          </div>
        </main>
      </div>

      {showAllocateModal && (
        <div className="nurse-modal-overlay">
          <div className="nurse-modal-content animate-scale-in">
            <header className="modal-header">
              <h3>Allocate: Bed {selectedBed?.bedNumber}</h3>
              <button type="button" className="btn-close" onClick={() => setShowAllocateModal(false)}>×</button>
            </header>
            <div className="modal-body">
              {triageQueue.map((p) => (
                <div key={p.id} className="modal-patient-card" onClick={() => handleAllocatePatient(p.patientId)}>
                  <span>{p.patientName || p.name}</span>
                  <span>{p.mrn}</span>
                </div>
              ))}
              {triageQueue.length === 0 && <div className="empty-modal">No patients in OPD queue for this department.</div>}
            </div>
          </div>
        </div>
      )}

      {showVitalsModal && (
        <div className="nurse-modal-overlay">
          <div className="nurse-modal-content animate-scale-in">
            <header className="modal-header">
              <h3>Vitals: Bed {selectedBed?.bedNumber}</h3>
              <button type="button" className="btn-close" onClick={() => { setShowVitalsModal(false); setSelectedBed(null); }}>×</button>
            </header>
            <div className="modal-body">
              <div className="vitals-modal-grid">
                <input name="bloodPressure" value={vitalsData.bloodPressure} onChange={handleVitalsChange} placeholder="BP" />
                <input name="heartRate" value={vitalsData.heartRate} onChange={handleVitalsChange} placeholder="HR" />
                <input name="oxygenSat" value={vitalsData.oxygenSat} onChange={handleVitalsChange} placeholder="SpO2" />
                <input name="temperature" value={vitalsData.temperature} onChange={handleVitalsChange} placeholder="Temp °C" />
              </div>
              <button type="button" onClick={submitVitals} disabled={loading} className="btn-primary w-full mt-6">
                {loading ? 'Updating…' : 'Save vitals'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PatientDetailOverlay
        open={isPatientDetailOpen}
        patient={selectedPatient}
        onClose={closePatientDetail}
        isFullscreen={isFullscreen}
        onToggleFullscreen={togglePatientDetailFullscreen}
        title="Bed patient"
        onUpdateVitals={(pt) => {
          closePatientDetail();
          const bed = displayBeds.find((b) => b.bedId === pt.currentBed);
          if (bed) setSelectedBed(bed);
          setShowVitalsModal(true);
        }}
        onNotifyDoctor={() => showNotification('Doctor notified', 'success')}
      />
    </div>
  );
}
