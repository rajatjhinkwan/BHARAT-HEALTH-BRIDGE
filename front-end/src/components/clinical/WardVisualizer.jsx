import React from 'react';
import { Bed as BedIcon, HeartPulse, Activity } from 'lucide-react';

export default function WardVisualizer({ beds, patients = [], wardName, onPatientClick }) {
  if (!beds || beds.length === 0) return null;

  return (
    <div className="ward-visualizer card mt-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)' }}>Visual Ward Map</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0" style={{ letterSpacing: '0.08em' }}>{wardName} Floor Plan</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }}></div>
              <span className="text-[10px] font-black tracking-wider text-slate-500">AVAILABLE</span>
           </div>
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)' }}></div>
              <span className="text-[10px] font-black tracking-wider text-slate-500">OCCUPIED</span>
           </div>
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--warning)' }}></div>
              <span className="text-[10px] font-black tracking-wider text-slate-500">MAINTENANCE / CLEANING</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {beds.map((bed) => {
          const isCleaning = bed.status === 'CLEANING' || bed.status === 'UNDER_MAINTENANCE' || bed.status === 'UNDER OBSERVATION';
          const patient = bed.occupied 
            ? (patients.find((p) => 
                p._id === (bed.patientId?._id || bed.patientId) || 
                (p.currentBed && String(p.currentBed).toLowerCase() === String(bed.bedId).toLowerCase())
              ) || bed.patientId)
            : null;

          const latestVitals = patient?.vitals?.length ? patient.vitals[patient.vitals.length - 1] : null;

          return (
            <div 
              key={bed._id} 
              className="bed-node"
              onClick={() => {
                if (bed.occupied && patient && onPatientClick) {
                  onPatientClick(patient);
                }
              }}
              style={{
                padding: '1.25rem',
                borderRadius: '20px',
                border: '2px solid',
                borderColor: bed.occupied 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : isCleaning 
                    ? 'rgba(245, 158, 11, 0.15)' 
                    : 'rgba(16, 185, 129, 0.15)',
                background: bed.occupied 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.01) 100%)' 
                  : isCleaning 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)' 
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                cursor: (bed.occupied && patient) ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: bed.occupied 
                  ? '0 4px 6px -1px rgba(239, 68, 68, 0.02)' 
                  : '0 4px 6px -1px rgba(16, 185, 129, 0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = bed.occupied 
                  ? '0 12px 20px -8px rgba(239, 68, 68, 0.15)' 
                  : isCleaning 
                    ? '0 12px 20px -8px rgba(245, 158, 11, 0.15)' 
                    : '0 12px 20px -8px rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.borderColor = bed.occupied 
                  ? 'var(--danger)' 
                  : isCleaning 
                    ? 'var(--warning)' 
                    : 'var(--success)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = bed.occupied 
                  ? '0 4px 6px -1px rgba(239, 68, 68, 0.02)' 
                  : '0 4px 6px -1px rgba(16, 185, 129, 0.02)';
                e.currentTarget.style.borderColor = bed.occupied 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : isCleaning 
                    ? 'rgba(245, 158, 11, 0.15)' 
                    : 'rgba(16, 185, 129, 0.15)';
              }}
            >
              <BedIcon size={24} color={bed.occupied ? 'var(--danger)' : isCleaning ? 'var(--warning)' : 'var(--success)'} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>Bed {bed.bedNumber}</span>
                <span className="text-[9px] font-black text-slate-400">{bed.roomNumber || 'Room 101'}</span>
              </div>

              {bed.occupied ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <span className="font-extrabold text-xs text-center" style={{ color: 'var(--text-main)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {patient?.patientName || bed.patientId?.patientName || 'Admitted Patient'}
                    </span>
                    {patient?.mrn && (
                      <span className="text-[9px] font-semibold text-slate-400" style={{ marginTop: '1px' }}>
                        {patient.mrn}
                      </span>
                    )}
                  </div>
                  
                  {/* Micro-Vitals Panel */}
                  {latestVitals && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      width: '100%',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <HeartPulse size={8} color="var(--danger)" /> HR
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-main)' }}>
                          {latestVitals.heartRate || latestVitals.hr || '--'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Activity size={8} color="var(--primary)" /> SpO2
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-main)' }}>
                          {latestVitals.spo2 || latestVitals.oxygenSat || '--'}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                    OCCUPIED
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <div className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                    {isCleaning ? 'CLEANING' : 'VACANT'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
