import React from 'react';
import { Pill, Activity, FlaskConical, FileText, Share2, X, Play, Maximize2, Minimize2 } from 'lucide-react';

const WorkspaceHeader = ({
  patient,
  activeActionTab,
  setActiveActionTab,
  setCurrentPageIdx,
  handleSave,
  handlePrint,
  onSeeNextPatient,
  waitingCount,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}) => {
  const tabs = [
    { id: 'Medicine', label: 'Prescription', icon: <Pill size={14} /> },
    { id: 'Diagnosis', label: 'Diagnosis', icon: <Activity size={14} /> },
    { id: 'Blood Test', label: 'Lab Orders', icon: <FlaskConical size={14} /> },
    { id: 'Notes', label: 'Clinical Notes', icon: <FileText size={14} /> },
    { id: 'Referral', label: 'Referrals', icon: <Share2 size={14} /> },
  ];

  return (
    <div className="workspace-immersive-header non-printable">
      <div className="patient-context-minimal">
        <p className="workspace-patient-label">Active patient</p>
        <p className="workspace-patient-name">{patient.name}</p>
      </div>

      <div className="workspace-nav-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`workspace-tab-btn ${activeActionTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveActionTab(tab.id); setCurrentPageIdx(0); }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="workspace-header-tools">
        <button type="button" className="btn-secondary workspace-tool-btn" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
        {onSeeNextPatient && (
          <button
            type="button"
            className="hb-btn-primary hb-btn-compact"
            onClick={onSeeNextPatient}
            disabled={waitingCount === 0}
          >
            <Play size={14} />
            See next patient
            {typeof waitingCount === 'number' && waitingCount > 0 ? ` (${waitingCount})` : ''}
          </button>
        )}
        <button type="button" className="btn-secondary workspace-tool-btn" onClick={() => handlePrint()}>
          <FileText size={14} />
          Print
        </button>
        <button type="button" className="finalize-session-btn workspace-tool-btn" onClick={handleSave}>
          Save & exit
        </button>
        <button type="button" className="workspace-exit-btn" onClick={onClose} aria-label="Close workspace">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
