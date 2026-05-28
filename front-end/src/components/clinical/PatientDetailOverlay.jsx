import React, { useEffect, useMemo } from 'react';
import {
  X, Maximize2, Minimize2, User, Activity, Heart, Droplets, Thermometer,
  Wind, FileText, Bell, ChevronRight, BedDouble, Stethoscope, Clock,
} from 'lucide-react';
import './PatientDetailOverlay.css';

function normalizePatient(raw) {
  const data = raw || {};
  const vitalsList = data.vitals || [];
  const latestVitals =
    data.latestVitals ||
    (Array.isArray(vitalsList) ? vitalsList[vitalsList.length - 1] : vitalsList) ||
    {};

  return {
    id: data._id || data.id || data.patientId,
    name: data.patientName || data.name || 'Unknown Patient',
    mrn: data.mrn || data.caseId || '—',
    age: data.age ?? '—',
    gender: data.gender || '—',
    status: data.currentStatus || data.status || data.priority || 'ACTIVE',
    bed:
      data.currentBed ||
      data.icuBedNumber ||
      data.ventilatorBedNumber ||
      data.bedNumber ||
      data.bedId ||
      null,
    ward: data.currentWard || data.wardName || data.emergencyType || null,
    doctor: data.assignedDoctor || data.doctorName || null,
    vitals: {
      heartRate: latestVitals.heartRate || latestVitals.hr || '--',
      spo2: latestVitals.spo2 || latestVitals.spO2 || latestVitals.oxygenSat || '--',
      bp: latestVitals.bp || latestVitals.bloodPressure || '--',
      temp: latestVitals.temp || latestVitals.temperature || '--',
      respiratoryRate: latestVitals.respiratoryRate || latestVitals.rr || '--',
    },
    notes: data.nurseNotes || [],
    condition: data.condition || null,
    priority: data.priority || null,
  };
}

function Vital({ icon, label, value, unit, tone }) {
  return (
    <div className={`pdo-vital pdo-vital--${tone || 'muted'}`}>
      <div className="pdo-vital-icon">{icon}</div>
      <div>
        <span className="pdo-vital-label">{label}</span>
        <strong>{value}{unit ? ` ${unit}` : ''}</strong>
      </div>
    </div>
  );
}

export default function PatientDetailOverlay({
  open,
  patient,
  onClose,
  isFullscreen = false,
  onToggleFullscreen,
  onUpdateVitals,
  onAddNote,
  onOpenEmr,
  onNotifyDoctor,
  showEmr = false,
  title = 'Patient details',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const p = useMemo(() => normalizePatient(patient), [patient]);
  const latestNote = p.notes[p.notes.length - 1];

  if (!open || !patient) return null;

  return (
    <div
      className={`pdo-overlay ${isFullscreen ? 'pdo-overlay--fullscreen' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`pdo-panel ${isFullscreen ? 'pdo-panel--fullscreen' : 'pdo-panel--compact'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="pdo-header">
          <div>
            <p className="pdo-eyebrow">{title}</p>
            <h2 className="pdo-title">{p.name}</h2>
            <span className="pdo-status-pill">{p.status}</span>
          </div>
          <div className="pdo-header-actions">
            {onToggleFullscreen && (
              <button
                type="button"
                className="pdo-icon-btn"
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Compact view' : 'Full screen'}
                aria-label={isFullscreen ? 'Compact view' : 'Full screen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            <button type="button" className="pdo-icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="pdo-body">
          <section className="pdo-identity">
            <div className="pdo-avatar">
              <User size={32} />
            </div>
            <div className="pdo-identity-text">
              <h2>{p.name}</h2>
              <p>{p.mrn} · {p.age}y · {p.gender}</p>
              <div className="pdo-tags">
                <span className="pdo-tag pdo-tag--status">{p.status}</span>
                {p.bed && (
                  <span className="pdo-tag">
                    <BedDouble size={12} /> Bed {p.bed}
                  </span>
                )}
                {p.ward && <span className="pdo-tag">{p.ward}</span>}
                {p.priority && (
                  <span className={`pdo-tag pdo-tag--${String(p.priority).toLowerCase()}`}>
                    {p.priority}
                  </span>
                )}
              </div>
            </div>
          </section>

          {p.doctor && (
            <div className="pdo-doctor-row">
              <Stethoscope size={16} />
              <span>Assigned: <strong>{p.doctor}</strong></span>
            </div>
          )}

          {p.condition && (
            <div className="pdo-condition">
              <Clock size={14} />
              <span>{p.condition}</span>
            </div>
          )}

          <section className="pdo-vitals">
            <h3>Live vitals</h3>
            <div className="pdo-vitals-grid">
              <Vital icon={<Heart size={18} />} label="Pulse" value={p.vitals.heartRate} unit="BPM" tone="danger" />
              <Vital icon={<Droplets size={18} />} label="SpO2" value={p.vitals.spo2} unit="%" tone="primary" />
              <Vital icon={<Activity size={18} />} label="BP" value={p.vitals.bp} tone="purple" />
              <Vital icon={<Thermometer size={18} />} label="Temp" value={p.vitals.temp} unit="°F" tone="warn" />
              <Vital icon={<Wind size={18} />} label="RR" value={p.vitals.respiratoryRate} unit="/min" tone="muted" />
            </div>
          </section>

          {latestNote && (
            <section className="pdo-note">
              <div className="pdo-note-label">
                <FileText size={14} /> Latest nurse note
              </div>
              <p>&ldquo;{latestNote.note}&rdquo;</p>
              <span>
                — {latestNote.nurseName || 'Nurse'}
                {latestNote.createdAt ? ` · ${new Date(latestNote.createdAt).toLocaleString()}` : ''}
              </span>
            </section>
          )}
        </div>

        <footer className="pdo-footer">
          {onUpdateVitals && (
            <button type="button" className="hb-btn-secondary" onClick={() => onUpdateVitals(patient)}>
              <Activity size={16} /> Update vitals
            </button>
          )}
          {onAddNote && (
            <button type="button" className="hb-btn-secondary" onClick={() => onAddNote(patient)}>
              <FileText size={16} /> Add note
            </button>
          )}
          {onNotifyDoctor && (
            <button type="button" className="hb-btn-danger-outline" onClick={() => onNotifyDoctor(patient)}>
              <Bell size={16} /> Notify doctor
            </button>
          )}
          {showEmr && onOpenEmr && (
            <button type="button" className="hb-btn-primary" onClick={() => onOpenEmr(patient)}>
              <ChevronRight size={16} /> Open EMR
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
