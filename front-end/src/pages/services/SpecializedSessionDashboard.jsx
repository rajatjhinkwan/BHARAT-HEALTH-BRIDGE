import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Droplets, FlaskConical, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function SpecializedSessionDashboard() {
  const [sessionQueue, setSessionQueue] = useState([]);

  const fetchSessions = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/clinical/patients`);
      if (resp.ok) {
        const patients = await resp.json();
        const queue = [];
        
        patients.forEach(p => {
           if(p.specializedSessions && p.specializedSessions.length > 0) {
              p.specializedSessions.forEach((session, idx) => {
                 queue.push({
                    ...session,
                    patientName: p.patientName,
                    mrn: p.mrn,
                    patientId: p._id,
                    patient: p,
                    sessionIndex: idx
                 });
              });
           }
        });
        
        setSessionQueue(queue.sort((a) => (a.status === 'Completed' ? 1 : -1)));
      }
    } catch(err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchSessions());
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleEndSession = async (patient, sessionIndex) => {
    try {
       const newSessions = [...patient.specializedSessions];
       newSessions[sessionIndex].status = 'Completed';
       newSessions[sessionIndex].endDate = new Date();
       
       // Move patient back to original ward or mark as recovering
       await fetch(`${API_BASE_URL}/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            specializedSessions: newSessions,
            currentStatus: 'RECOVERING'
          })
       });
       alert("Session completed. Patient marked as recovering.");
       fetchSessions();
    } catch(err) {
       console.error("Failed to end session", err);
    }
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' },
    card: (type) => ({ 
      background: 'var(--surface)', 
      border: `1px solid ${type === 'DIALYSIS' ? '#8b5cf6' : '#ec4899'}`, 
      padding: '2rem', 
      borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)'
    })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <Activity size={36} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Specialized Therapy Units</h1>
      </div>

      {sessionQueue.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>
            <Clock size={64} style={{ opacity: 0.2, marginBottom: '2rem' }} />
            <h2 className="font-black uppercase tracking-widest">No Active Sessions</h2>
            <p>Waiting for Dialysis or Chemotherapy referrals.</p>
         </div>
      ) : (
         <div style={styles.grid}>
           {sessionQueue.map((session, idx) => (
             <div key={idx} style={styles.card(session.type)}>
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h3 className="text-xl font-black text-slate-800">{session.patientName}</h3>
                     <p className="text-xs font-bold text-slate-400">{session.mrn} | {session.type} UNIT</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.status === 'Active' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                    {session.status}
                  </span>
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                 <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${session.type === 'DIALYSIS' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                        {session.type === 'DIALYSIS' ? <Droplets size={24} /> : <FlaskConical size={24} />}
                    </div>
                    <div>
                        <div className="text-xs font-black text-slate-400 uppercase">Current Session</div>
                        <div className="text-sm font-bold text-slate-700">{session.type} THERAPY</div>
                    </div>
                 </div>
                 <div className="text-[10px] text-slate-500 font-bold leading-relaxed">
                   <strong>Notes:</strong> {session.notes || 'Routine session scheduled by physician.'}
                 </div>
               </div>

               <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-600">
                 <User size={14} className="text-slate-400" />
                 <span>Performed by: {session.performedBy || 'Unit Staff'}</span>
               </div>

               {session.status === 'Active' && (
                  <button 
                    onClick={() => handleEndSession(session.patient, session.sessionIndex)} 
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Complete & Shift to Ward
                  </button>
               )}
               
               {session.status === 'Completed' && (
                  <div className="w-full bg-green-50 text-green-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest text-center border border-green-200">
                    Session Finalized
                  </div>
               )}
             </div>
           ))}
         </div>
      )}
    </div>
  );
}
