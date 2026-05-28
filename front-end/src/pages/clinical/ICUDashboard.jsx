import React, { useState, useEffect } from 'react';
import {
  Activity, Thermometer, Droplets, Heart, User, ChevronRight, FileText, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VitalsModal from '../../components/clinical/VitalsModal';
import NurseNoteModal from '../../components/clinical/NurseNoteModal';
import PatientDetailOverlay from '../../components/clinical/PatientDetailOverlay';
import { usePatientDetailOverlay } from '../../hooks/usePatientDetailOverlay';
import { useNotification } from '../../context/NotificationContext';
import { Shimmer } from '../../components/SkeletonLoader';
import { API_BASE_URL } from '../../config';

export default function ICUDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const {
    selectedPatient,
    isFullscreen,
    isPatientDetailOpen,
    openPatientDetail,
    closePatientDetail,
    togglePatientDetailFullscreen,
  } = usePatientDetailOverlay();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVitalsPatient, setActiveVitalsPatient] = useState(null);
  const [activeNotePatient, setActiveNotePatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/critical/icu/patients`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  const getCriticality = (p) => {
    const latest = (p.vitals && p.vitals.length) ? p.vitals[p.vitals.length - 1] : null;
    const spo2 = parseInt(latest?.spo2 || '100', 10);
    if (spo2 < 90) return 'CRITICAL';
    return 'STABLE';
  };

  const isDoctor = ['DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'MEDICAL_DIRECTOR'].includes(
    user?.role?.toUpperCase()
  );

  return (
    <div className="hb-page hb-critical-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div className="hb-page-header-row">
            <div className="hb-page-header-icon icu">
              <Activity size={28} />
            </div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Critical care</p>
              <h1>ICU monitoring center</h1>
              <p>Real-time critical care tracking for the intensive care unit</p>
            </div>
          </div>
          <div className="hb-metric-card hb-metric-inline">
            <p className="hb-metric-label">Active ICU patients</p>
            <p className="hb-metric-value">{patients.length}</p>
          </div>
        </header>

        <div className="hb-critical-grid">
          {loading && patients.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <article key={i} className="hb-critical-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <Shimmer style={{ width: '80px', height: '22px', borderRadius: '12px' }} />
                </div>
                
                <div className="hb-critical-card-body">
                  <div className="hb-critical-card-left">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <Shimmer style={{ width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <Shimmer style={{ width: '80%', height: '16px', borderRadius: '6px' }} />
                        <Shimmer style={{ width: '50%', height: '11px', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Shimmer style={{ width: '60px', height: '22px', borderRadius: '8px' }} />
                      <Shimmer style={{ width: '80px', height: '22px', borderRadius: '8px' }} />
                    </div>
                  </div>

                  <div className="hb-critical-card-right">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.75rem', background: 'var(--background)', borderRadius: '12px' }}>
                      {Array.from({ length: 4 }).map((_, c) => (
                        <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <Shimmer style={{ width: '50%', height: '8px', borderRadius: '2px' }} />
                          <Shimmer style={{ width: '70%', height: '12px', borderRadius: '3px' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hb-hero-actions hb-critical-card-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                  <Shimmer style={{ height: '38px', borderRadius: '10px', flex: 1 }} />
                  <Shimmer style={{ height: '38px', borderRadius: '10px', flex: 1 }} />
                </div>
              </article>
            ))
          ) : (
            patients.map((p) => {
              const crit = getCriticality(p);
              const latestVitals = (p.vitals && p.vitals.length) ? p.vitals[p.vitals.length - 1] : {};
              const latestNote = p.nurseNotes && p.nurseNotes.length ? p.nurseNotes[p.nurseNotes.length - 1] : null;

              return (
                <article
                  key={p._id}
                  className={`hb-critical-card hb-critical-card--clickable${crit === 'CRITICAL' ? ' critical' : ''}`}
                  onClick={() => openPatientDetail(p)}
                >
                  <span className={`hb-critical-badge ${crit === 'CRITICAL' ? 'critical' : 'stable'}`}>
                    {crit}
                  </span>

                  <div className="hb-critical-card-body">
                    <div className="hb-critical-card-left">
                      <div className="hb-critical-patient-row">
                        <div className="hb-critical-avatar">
                          <User size={26} />
                        </div>
                        <div>
                          <h3>{p.patientName}</h3>
                          <p>{p.mrn} · {p.age}y · {p.gender}</p>
                        </div>
                      </div>

                      <div className="hb-critical-tags">
                        <span className="hb-priority-pill normal">Bed {p.icuBedNumber || 'N/A'}</span>
                        <span className="hb-badge-count">{p.currentStatus}</span>
                      </div>
                    </div>

                    <div className="hb-critical-card-right">
                      <div className="hb-vitals-grid" style={{ marginTop: 0 }}>
                        <div className="hb-vital-item">
                          <label>Pulse</label>
                          <span className="vital-danger">{latestVitals.heartRate || '--'} BPM</span>
                        </div>
                        <div className="hb-vital-item">
                          <label>SpO2</label>
                          <span className="vital-primary">{latestVitals.spo2 || '--'}%</span>
                        </div>
                        <div className="hb-vital-item">
                          <label>BP</label>
                          <span>{latestVitals.bp || '--'}</span>
                        </div>
                        <div className="hb-vital-item">
                          <label>Temp</label>
                          <span className="vital-warn">{latestVitals.temp || '--'}°F</span>
                        </div>
                      </div>

                      {latestNote && (
                        <div className="hb-nurse-note-box" style={{ marginTop: 0, padding: '0.65rem 0.85rem' }}>
                          <div className="hb-note-label" style={{ marginBottom: '0.2rem' }}>
                            <FileText size={12} />
                            Note
                          </div>
                          <p style={{ fontSize: '0.8rem', lineHeight: '1.25' }}>&ldquo;{latestNote.note}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hb-hero-actions hb-critical-card-actions" style={{ marginTop: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
                    {isDoctor ? (
                      <button
                        type="button"
                        className="hb-btn-primary"
                        onClick={() => navigate('/emr', { state: { selectedPatient: { ...p, patientId: p._id } } })}
                      >
                        <ChevronRight size={18} />
                        Open EMR
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="hb-btn-secondary"
                        onClick={() => { setActiveNotePatient(p); setShowNoteModal(true); }}
                      >
                        <FileText size={18} />
                        Add note
                      </button>
                    )}
                    <button
                      type="button"
                      className="hb-btn-secondary"
                      onClick={() => { setActiveVitalsPatient(p); setShowVitalsModal(true); }}
                    >
                      <Activity size={18} />
                      Update vitals
                    </button>
                    {!isDoctor && (
                      <button type="button" className="hb-btn-danger-outline">
                        <Bell size={18} />
                        Notify doctor
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {patients.length === 0 && !loading && (
          <div className="hb-hero-idle">
            <Activity size={48} />
            <h4>No patients in ICU</h4>
            <p>The unit is currently available for admissions.</p>
          </div>
        )}
      </div>

      {showVitalsModal && activeVitalsPatient && (
        <VitalsModal
          patient={activeVitalsPatient}
          onClose={() => setShowVitalsModal(false)}
          onUpdate={fetchPatients}
        />
      )}

      {showNoteModal && activeNotePatient && (
        <NurseNoteModal
          patient={activeNotePatient}
          onClose={() => setShowNoteModal(false)}
          onUpdate={fetchPatients}
        />
      )}

      <PatientDetailOverlay
        open={isPatientDetailOpen}
        patient={selectedPatient}
        onClose={closePatientDetail}
        isFullscreen={isFullscreen}
        onToggleFullscreen={togglePatientDetailFullscreen}
        title="ICU patient"
        showEmr={isDoctor}
        onOpenEmr={(pt) => navigate('/emr', { state: { selectedPatient: { ...pt, patientId: pt._id } } })}
        onUpdateVitals={(pt) => {
          closePatientDetail();
          setActiveVitalsPatient(pt);
          setShowVitalsModal(true);
        }}
        onAddNote={(pt) => {
          closePatientDetail();
          setActiveNotePatient(pt);
          setShowNoteModal(true);
        }}
        onNotifyDoctor={() => showNotification('Attending physician notified', 'success')}
      />
    </div>
  );
}
