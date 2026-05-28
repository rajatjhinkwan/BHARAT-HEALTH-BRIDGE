import React from 'react';
import { User, MapPin, ShieldCheck, Activity, Clock } from 'lucide-react';

export default function PatientStatusHeader({ patient }) {
  if (!patient?.name && !patient?.patientName) return null;

  const displayName = patient.patientName || patient.name;
  const statusColor = (status) => {
    switch (status) {
      case 'CRITICAL':
      case 'IN ICU':
        return 'var(--danger)';
      case 'ON VENTILATOR':
        return '#991b1b';
      case 'WAITING':
      case 'LAB PENDING':
        return 'var(--warning)';
      case 'DISCHARGED':
        return 'var(--text-muted)';
      default:
        return 'var(--primary)';
    }
  };

  return (
    <div className="status-header no-print">
      <div className="status-header-patient">
        <div className="status-header-avatar">
          <User size={24} />
        </div>
        <div>
          <h2 className="status-header-name">{displayName}</h2>
          <p className="status-header-meta">
            {patient.mrn}
            {' · '}
            {patient.gender}
            {patient.age != null ? ` · ${patient.age}y` : ''}
            {patient.tokenNumber ? ` · Token ${patient.tokenNumber}` : ''}
          </p>
        </div>
      </div>

      <div className="status-header-stats">
        <div className="status-stat">
          <span className="status-stat-label">Status</span>
          <span
            className="status-stat-badge"
            style={{ background: statusColor(patient.currentStatus) }}
          >
            {patient.currentStatus || 'In consultation'}
          </span>
        </div>
        <div className="status-stat">
          <span className="status-stat-label">Department</span>
          <span className="status-stat-value">
            <MapPin size={14} />
            {patient.currentDepartment || patient.dept || 'OPD'}
          </span>
        </div>
        <div className="status-stat">
          <span className="status-stat-label">Doctor</span>
          <span className="status-stat-value">
            <ShieldCheck size={14} />
            {patient.assignedDoctor || '—'}
          </span>
        </div>
        {patient.currentBed && (
          <div className="status-stat">
            <span className="status-stat-label">Bed</span>
            <span className="status-stat-value status-stat-bed">
              <Activity size={14} />
              {patient.currentBed}
            </span>
          </div>
        )}
      </div>

      <div className="status-header-track">
        <Clock size={14} />
        Live EMR session
      </div>
    </div>
  );
}
