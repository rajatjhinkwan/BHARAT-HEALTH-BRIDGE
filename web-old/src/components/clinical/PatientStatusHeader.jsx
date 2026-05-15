import React from 'react';
import { User, MapPin, Activity, Clock, ShieldCheck } from 'lucide-react';

export default function PatientStatusHeader({ patient }) {
  if (!patient) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'var(--danger)';
      case 'IN ICU': return 'var(--danger)';
      case 'ON VENTILATOR': return '#991b1b';
      case 'WAITING': return 'var(--warning)';
      case 'STABLE': return 'var(--success)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="status-header no-print">
      <div className="flex items-center gap-4">
        <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{patient.patientName || patient.name}</h2>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <span>{patient.mrn}</span>
            <span>•</span>
            <span>{patient.gender} · {patient.age}y</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
          <div className="badge" style={{ background: getStatusColor(patient.currentStatus), color: 'white', border: 'none' }}>
            {patient.currentStatus}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</span>
          <div className="flex items-center gap-1 font-bold text-sm">
            <MapPin size={14} className="text-primary" />
            {patient.currentDepartment || patient.dept || 'OPD'}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Doctor</span>
          <div className="flex items-center gap-1 font-bold text-sm">
            <ShieldCheck size={14} className="text-success" />
            {patient.assignedDoctor || 'Dr. Aryan'}
          </div>
        </div>

        {patient.currentBed && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bed Number</span>
            <div className="flex items-center gap-1 font-black text-sm text-danger">
              <Activity size={14} />
              {patient.currentBed}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="workflow-step active">
            <Clock size={14} />
            ADMISSION TRACKED
        </div>
      </div>
    </div>
  );
}
