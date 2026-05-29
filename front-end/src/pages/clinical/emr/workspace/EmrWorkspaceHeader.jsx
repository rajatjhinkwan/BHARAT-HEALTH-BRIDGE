import React from 'react';
import {
  Pill, Activity, FlaskConical, FileText, Share2, X,
  Maximize2, Minimize2, Play, Printer,
} from 'lucide-react';

const TABS = [
  { id: 'Medicine', label: 'Prescription', icon: Pill },
  { id: 'Diagnosis', label: 'Diagnosis', icon: Activity },
  { id: 'Blood Test', label: 'Investigation', icon: FlaskConical },
  { id: 'Notes', label: 'Advice & Notes', icon: FileText },
  { id: 'Referral', label: 'Referral', icon: Share2 },
];

export default function EmrWorkspaceHeader({
  patient,
  activeTab,
  onTabChange,
  onSave,
  onPrint,
  onClose,
  onToggleFullscreen,
  isFullscreen,
  onSeeNext,
  waitingCount,
}) {
  return (
    <header className="emr-ws-header non-printable">
      <div className="emr-ws-patient-block">
        <p className="emr-ws-patient-label">Active patient</p>
        <p className="emr-ws-patient-name">{patient?.name || '—'}</p>
      </div>

      <nav className="emr-ws-tabs" aria-label="Workspace sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`emr-ws-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      <div className="emr-ws-actions">
        <button type="button" className="emr-ws-btn" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
        {onSeeNext && (
          <button type="button" className="emr-ws-btn" onClick={onSeeNext} disabled={!waitingCount}>
            <Play size={14} />
            Next{waitingCount > 0 ? ` (${waitingCount})` : ''}
          </button>
        )}
        <button type="button" className="emr-ws-btn" onClick={onPrint}>
          <Printer size={14} />
          Print
        </button>
        <button type="button" className="emr-ws-btn emr-ws-btn-primary" onClick={onSave}>
          Save & exit
        </button>
        <button type="button" className="emr-ws-btn emr-ws-btn-danger" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>
    </header>
  );
}
