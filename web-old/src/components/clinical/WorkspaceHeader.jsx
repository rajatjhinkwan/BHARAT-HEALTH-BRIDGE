import React from 'react';
import { Pill, Activity, FlaskConical, FileText, Share2, X } from 'lucide-react';

const WorkspaceHeader = ({ 
  patient, 
  activeActionTab, 
  setActiveActionTab, 
  setCurrentPageIdx, 
  setIsZoomed 
}) => {
  const tabs = [
    { id: 'Medicine', label: 'Prescription', icon: <Pill size={14} /> },
    { id: 'Diagnosis', label: 'Diagnosis', icon: <Activity size={14} /> },
    { id: 'Blood Test', label: 'Lab Orders', icon: <FlaskConical size={14} /> },
    { id: 'Notes', label: 'Clinical Notes', icon: <FileText size={14} /> },
    { id: 'Referral', label: 'Referrals', icon: <Share2 size={14} /> }
  ];

  return (
    <div className="workspace-immersive-header non-printable">
      <div className="patient-context-minimal">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Patient</div>
        <div className="text-base font-bold text-slate-800">{patient.name}</div>
      </div>
      
      <div className="workspace-nav-row !py-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`workspace-tab-btn !px-4 !py-2 ${activeActionTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveActionTab(tab.id); setCurrentPageIdx(0); }}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-2" onClick={() => window.print()}>
          <FileText size={14} /> Print
        </button>
        <button className="finalize-session-btn !py-2 !px-6 !text-xs !shadow-none" onClick={() => { alert("Session saved."); setIsZoomed(false); }}>
          Save & Exit
        </button>
        <button className="workspace-exit-btn !bg-slate-100 !border-slate-200 !text-slate-600" onClick={() => setIsZoomed(false)}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
