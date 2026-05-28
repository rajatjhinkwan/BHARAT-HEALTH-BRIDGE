import React, { useState, useEffect, useCallback } from 'react';
import { Scissors, Calendar, MapPin, User, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function SurgeryDashboard() {
  const [surgeryQueue, setSurgeryQueue] = useState([]);

  const fetchSurgeries = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/clinical/patients`);
      if (resp.ok) {
        const patients = await resp.json();
        const queue = [];
        
        patients.forEach(p => {
           if(p.surgeryOrders && p.surgeryOrders.length > 0) {
              p.surgeryOrders.forEach((surgery, idx) => {
                 queue.push({
                    ...surgery,
                    patientName: p.patientName,
                    mrn: p.mrn,
                    patientId: p._id,
                    patient: p,
                    surgeryIndex: idx
                 });
              });
           }
        });
        
        setSurgeryQueue(queue.sort((a) => (a.status === 'Completed' ? 1 : -1)));
      }
    } catch(err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchSurgeries());
    const interval = setInterval(fetchSurgeries, 10000);
    return () => clearInterval(interval);
  }, [fetchSurgeries]);

  const handleUpdateSurgeryStatus = async (patient, surgeryIndex, newStatus) => {
    try {
       const newOrders = [...patient.surgeryOrders];
       newOrders[surgeryIndex].status = newStatus;
       
       const updates = { surgeryOrders: newOrders };
       if (newStatus === 'In Progress') updates.currentStatus = 'SURGERY IN PROGRESS';
       if (newStatus === 'Completed') updates.currentStatus = 'IN ICU'; // Usually surgeries go to ICU first

       await fetch(`${API_BASE_URL}/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updates)
       });
       alert(`Surgery ${newStatus}`);
       fetchSurgeries();
    } catch(err) {
       console.error("Failed to update surgery status", err);
    }
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' },
    card: (status) => ({ 
      background: 'var(--surface)', 
      border: `1px solid ${status === 'Scheduled' ? 'var(--primary)' : (status === 'In Progress' ? 'var(--danger)' : 'var(--success)')}`, 
      padding: '2rem', 
      borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)'
    })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <Scissors size={36} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Operation Theater & Surgery Suite</h1>
      </div>

      {surgeryQueue.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>
            <Activity size={64} style={{ opacity: 0.2, marginBottom: '2rem' }} />
            <h2 className="font-black uppercase tracking-widest">No Scheduled Procedures</h2>
            <p>Operation Theaters are currently available.</p>
         </div>
      ) : (
         <div style={styles.grid}>
           {surgeryQueue.map((surgery, idx) => (
             <div key={idx} style={styles.card(surgery.status)}>
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h3 className="text-xl font-black text-slate-800">{surgery.patientName}</h3>
                     <p className="text-xs font-bold text-slate-400">{surgery.mrn} | {surgery.procedure}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${surgery.status === 'Scheduled' ? 'bg-blue-100 text-blue-600' : (surgery.status === 'In Progress' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600')}`}>
                    {surgery.status}
                  </span>
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{new Date(surgery.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{new Date(surgery.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">OT: {surgery.otNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">Dr. {surgery.surgeon}</span>
                    </div>
                 </div>
               </div>

               <div className="flex gap-2">
                 {surgery.status === 'Scheduled' && (
                    <button 
                      onClick={() => handleUpdateSurgeryStatus(surgery.patient, surgery.surgeryIndex, 'In Progress')} 
                      className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Begin Procedure
                    </button>
                 )}
                 {surgery.status === 'In Progress' && (
                    <button 
                      onClick={() => handleUpdateSurgeryStatus(surgery.patient, surgery.surgeryIndex, 'Completed')} 
                      className="flex-1 bg-green-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Mark Completed
                    </button>
                 )}
                 {surgery.status === 'Completed' && (
                    <div className="flex-1 bg-slate-100 text-slate-500 font-black py-3 rounded-xl text-[10px] text-center uppercase tracking-widest border border-slate-200">
                      Surgery Finalized
                    </div>
                 )}
               </div>
             </div>
           ))}
         </div>
      )}
    </div>
  );
}
