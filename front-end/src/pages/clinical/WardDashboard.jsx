import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Thermometer, Droplets, Heart, User, Clock, AlertCircle, ChevronRight, Plus, FileText, Bell, Bed as BedIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VitalsModal from '../../components/clinical/VitalsModal';
import NurseNoteModal from '../../components/clinical/NurseNoteModal';
import WardVisualizer from '../../components/clinical/WardVisualizer';
import PatientDetailOverlay from '../../components/clinical/PatientDetailOverlay';
import WardSelector from '../../components/clinical/WardSelector';
import BedStatStrip from '../../components/clinical/BedStatStrip';
import { usePatientDetailOverlay } from '../../hooks/usePatientDetailOverlay';
import { useNotification } from '../../context/NotificationContext';
import { Shimmer } from '../../components/SkeletonLoader';
import { API_BASE_URL } from '../../config';
import { io } from 'socket.io-client';
import { isOversightRole } from '../../utils/roles';
import { resolveInitialWard, setStoredWard, toDisplayLabel, computeBedStats } from '../../utils/wards';
import { fetchWardBeds, fetchWardPatients } from '../../services/wardApi';

const socket = io(API_BASE_URL.replace('/api', ''));

export default function WardDashboard() {
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
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVitalsPatient, setActiveVitalsPatient] = useState(null);
  const [activeNotePatient, setActiveNotePatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const isOversight = isOversightRole((user?.role || '').toUpperCase());
  const [wardName, setWardName] = useState(() =>
    resolveInitialWard(user, searchParams.get('ward'))
  );

  const handleWardChange = (key) => {
    setStoredWard(key);
    setWardName(key);
  };

  const fetchData = async () => {
    try {
      const [pData, bData] = await Promise.all([
        fetchWardPatients(wardName),
        fetchWardBeds(wardName),
      ]);
      setPatients(pData);
      setBeds(bData.filter((b) => b.wardName?.toUpperCase() === wardName?.toUpperCase()));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const refresh = () => fetchData();
    socket.on('criticalUpdate', refresh);
    socket.on('bedUpdate', refresh);
    return () => {
      clearInterval(interval);
      socket.off('criticalUpdate', refresh);
      socket.off('bedUpdate', refresh);
    };
  }, [wardName]);

  const stats = computeBedStats(beds);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'var(--danger)';
      case 'IN ICU': return 'var(--danger)';
      case 'ON VENTILATOR': return '#991b1b';
      case 'UNDER OBSERVATION': return 'var(--warning)';
      case 'STABLE': return 'var(--success)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }} className="animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          {isOversight ? (
            <WardSelector value={wardName} onChange={handleWardChange} />
          ) : (
            <h1 style={{ margin: 0, fontSize: '2rem' }}>{toDisplayLabel(wardName)} Ward</h1>
          )}
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Patient care dashboard · {user?.name}</p>
        </div>
        <a href="/nurse-station" className="btn-primary" style={{ textDecoration: 'none' }}>Open Nurse Station</a>
      </div>

      <BedStatStrip stats={stats} loading={loading} variant="mini" />

      {loading ? (
        <Shimmer style={{ height: 200, borderRadius: 16, marginTop: '1.5rem' }} />
      ) : (
        <>
          <WardVisualizer beds={beds} patients={patients} wardName={toDisplayLabel(wardName)} onPatientClick={openPatientDetail} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {patients.map((patient) => (
              <div
                key={patient._id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                  borderLeft: `4px solid ${getStatusColor(patient.currentStatus)}`,
                  cursor: 'pointer',
                }}
                onClick={() => openPatientDetail(patient)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{patient.patientName}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MRN: {patient.mrn}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: getStatusColor(patient.currentStatus) }}>
                    {patient.currentStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span><BedIcon size={14} /> Bed {patient.currentBed || '—'}</span>
                  <span><Clock size={14} /> {patient.currentRoom || wardName}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    onClick={(e) => { e.stopPropagation(); setActiveVitalsPatient(patient); setShowVitalsModal(true); }}
                  >
                    <Thermometer size={14} /> Vitals
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    onClick={(e) => { e.stopPropagation(); setActiveNotePatient(patient); setShowNoteModal(true); }}
                  >
                    <FileText size={14} /> Note
                  </button>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <p>No admitted patients in {toDisplayLabel(wardName)}. Run seed or check Nurse Station.</p>
              </div>
            )}
          </div>
        </>
      )}

      {showVitalsModal && activeVitalsPatient && (
        <VitalsModal patient={activeVitalsPatient} onClose={() => { setShowVitalsModal(false); setActiveVitalsPatient(null); }} />
      )}
      {showNoteModal && activeNotePatient && (
        <NurseNoteModal patient={activeNotePatient} onClose={() => { setShowNoteModal(false); setActiveNotePatient(null); }} />
      )}

      <PatientDetailOverlay
        open={isPatientDetailOpen}
        patient={selectedPatient}
        onClose={closePatientDetail}
        isFullscreen={isFullscreen}
        onToggleFullscreen={togglePatientDetailFullscreen}
        title="Ward patient"
        onNotifyDoctor={() => showNotification('Doctor notified', 'success')}
      />
    </div>
  );
}
