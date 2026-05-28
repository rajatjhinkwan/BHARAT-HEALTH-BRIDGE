import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, AlertCircle, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { getVitalStatus, buildCriticalAlerts } from '../utils/vitals';

export default function EmrLeftPanel({
  patient,
  user,
  canRecordVitals,
  vitalsMinutesAgo,
  onRecordVitals,
  onImageUpload,
  onPrevPatient,
  onNextPatient,
  prevDisabled,
}) {
  const [showContactDetails, setShowContactDetails] = useState(false);
  const criticalAlerts = buildCriticalAlerts(patient);

  return (
    <aside className="emr-col emr-col-left">
      <div className="patient-profile-card">
        <div className="profile-img-wrapper">
          <span className="online-status" title="Active in session" />
          <label htmlFor="profile-upload" className="cursor-pointer">
            {patient.profileImage ? (
              <img src={patient.profileImage} alt="" className="profile-img" />
            ) : (
              <div className="profile-img profile-img-placeholder">
                <User size={48} />
              </div>
            )}
            <input id="profile-upload" type="file" hidden accept="image/*" onChange={onImageUpload} />
          </label>
        </div>
        <h2 className="patient-name">{patient.name}</h2>
        <p className="patient-mrn">MRN · {patient.mrn}</p>
        <div className="patient-tags">
          <span className="patient-tag">{patient.gender} · {patient.age}y</span>
          <span className="patient-tag">{patient.bloodGroup}</span>
        </div>
        <div className="patient-contact-inline">
          {patient.phone && <div className="info-item"><Phone size={14} /> {patient.phone}</div>}
          {patient.email && patient.email !== 'N/A' && <div className="info-item"><Mail size={14} /> {patient.email}</div>}
          {patient.location && <div className="info-item"><MapPin size={14} /> {patient.location}</div>}
        </div>
        {!showContactDetails && (
          <button type="button" className="details-toggle-btn" onClick={() => setShowContactDetails(true)}>
            More contact details
          </button>
        )}
        {showContactDetails && (
          <div className="patient-contact-info">
            <div className="info-item"><Phone size={14} /> {patient.phone || '—'}</div>
            <div className="info-item"><Mail size={14} /> {patient.email || '—'}</div>
            <div className="info-item"><MapPin size={14} /> {patient.location || patient.address || '—'}</div>
          </div>
        )}
      </div>

      {criticalAlerts.length > 0 && (
        <div className="critical-alerts-card">
          <div className="critical-alerts-header">
            <AlertCircle size={18} className="critical-icon" />
            <h3>Critical Alerts</h3>
          </div>
          <ul className="critical-alerts-list">
            {criticalAlerts.map((alert, i) => (
              <li key={i} className={`critical-alert-item alert-${alert.type}`}>{alert.label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="vitals-card">
        <div className="vitals-card-header">
          <div>
            <h3 className="pad-title">Current Vitals</h3>
            <span className="vitals-updated">
              {vitalsMinutesAgo != null ? `Updated ${vitalsMinutesAgo} min ago` : 'No vitals recorded yet'}
            </span>
          </div>
          {canRecordVitals && (
            <button type="button" className="emr-vitals-record-btn" onClick={onRecordVitals}>
              <Heart size={14} /> Record
            </button>
          )}
        </div>
        <p className="vitals-role-hint">
          {user?.role === 'NURSE'
            ? 'Nurse: record vitals at triage before the doctor sees the patient.'
            : 'Vitals from nursing; doctors may update during consultation.'}
        </p>
        <div className="vitals-grid">
          {[
            { key: 'bp', label: 'BP', raw: patient.vitals?.bp, suffix: ' mmHg' },
            { key: 'hr', label: 'HR', raw: patient.vitals?.hr || patient.vitals?.heartRate, suffix: ' bpm' },
            { key: 'temp', label: 'TEMP', raw: patient.vitals?.temp, suffix: '°F' },
            { key: 'spo2', label: 'SPO2', raw: patient.vitals?.spo2, suffix: '%' },
          ].map(({ key, label, raw, suffix }) => {
            const status = getVitalStatus(key, raw);
            const display = raw && raw !== '--' ? `${raw}${suffix}` : '--';
            return (
              <div key={key} className="vital-box">
                <span className="vital-label">{label}</span>
                <span className="vital-value">{display}</span>
                <span className={`vital-status ${status.className}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nav-buttons">
        <button type="button" className="nav-btn" onClick={onPrevPatient} disabled={prevDisabled}>
          <ChevronLeft size={16} /> Previous
        </button>
        <button type="button" className="nav-btn" onClick={onNextPatient}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}
