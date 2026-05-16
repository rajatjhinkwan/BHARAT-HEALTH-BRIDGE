import React, { useState, useEffect, useCallback } from 'react';
import { ImageIcon, FileCheck, Database, Camera, Layers, Activity } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';
import { API_BASE_URL } from '../../config';

export default function RadiologyDashboard() {
  const [radiologyQueue, setRadiologyQueue] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});

  const fetchOrders = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/clinical/patients`);
      if (resp.ok) {
        const patients = await resp.json();
        const queue = [];
        
        patients.forEach(p => {
           if(p.radiologyOrders) {
              p.radiologyOrders.forEach((order, idx) => {
                 queue.push({
                    ...order,
                    patientName: p.patientName,
                    mrn: p.mrn,
                    patientId: p._id,
                    patient: p,
                    orderIndex: idx
                 });
              });
           }
        });
        
        setRadiologyQueue(queue.sort((a,b) => (a.status === 'Completed' ? 1 : -1)));
      }
    } catch(err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleUpdateStatus = async (patient, orderIndex, newStatus) => {
    try {
       const newOrders = [...patient.radiologyOrders];
       newOrders[orderIndex].status = newStatus;
       
       await fetch(`${API_BASE_URL}/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ radiologyOrders: newOrders })
       });
       fetchOrders();
    } catch(err) {
       console.error("Failed to update status", err);
    }
  };

  const handleUpload = async (patient, orderIndex, orderId) => {
    setLoadingIds(prev => ({...prev, [orderId]: true}));
    
    try {
       const resultRecord = {
          id: 'RAD-RES-' + Date.now(),
          orderRef: orderId,
          timestamp: new Date().toISOString(),
          details: "Imaging completed. DICOM assets stored."
       };

       const hash = await generateBlockchainHash({ type: "RADIOLOGY_RESULT", mrn: patient.mrn, ...resultRecord });
       
       const newOrders = [...patient.radiologyOrders];
       newOrders[orderIndex].status = 'Completed';
       newOrders[orderIndex].results = "Imaging successfully performed and verified.";
       newOrders[orderIndex].orderId = orderId; // Ensure orderId is preserved or set
       
       await fetch(`${API_BASE_URL}/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ radiologyOrders: newOrders })
       });

       alert("Radiology Report Secured. Hash: " + hash);
       fetchOrders();
    } catch(err) {
       console.error(err);
    }
    setLoadingIds(prev => ({...prev, [orderId]: false}));
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' },
    card: (status) => ({ 
      background: 'var(--surface)', 
      border: `1px solid ${status === 'Pending' ? 'var(--danger)' : (status === 'In Progress' ? 'var(--warning)' : 'var(--success)')}`, 
      padding: '2rem', 
      borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)'
    })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <Camera size={36} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Radiology & Imaging Center</h1>
      </div>

      {radiologyQueue.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>
            <Layers size={64} style={{ opacity: 0.2, marginBottom: '2rem' }} />
            <h2 className="font-black uppercase tracking-widest">No Active Scans</h2>
            <p>Imaging queue is currently clear.</p>
         </div>
      ) : (
         <div style={styles.grid}>
           {radiologyQueue.map((order, idx) => (
             <div key={idx} style={styles.card(order.status)}>
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h3 className="text-xl font-black text-slate-800">{order.patientName}</h3>
                     <p className="text-xs font-bold text-slate-400">{order.mrn} | {order.type} - {order.bodyPart}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'Pending' ? 'bg-red-100 text-red-600' : (order.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}`}>
                    {order.status}
                  </span>
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                 <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Order Details</div>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary border border-slate-100 shadow-sm">
                      <ImageIcon size={20} />
                   </div>
                   <div className="text-sm font-bold text-slate-700">{order.type}: {order.bodyPart}</div>
                 </div>
               </div>

               <div className="flex gap-2">
                 {order.status === 'Pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.patient, order.orderIndex, 'In Progress')} 
                      className="flex-1 bg-amber-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-600 transition-all"
                    >
                      Start Scan
                    </button>
                 )}
                 {order.status === 'In Progress' && (
                    <button 
                      onClick={() => handleUpload(order.patient, order.orderIndex, order.orderId)} 
                      disabled={loadingIds[order.orderId]}
                      className="flex-1 bg-green-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-green-600 transition-all"
                    >
                      {loadingIds[order.orderId] ? 'Verifying...' : 'Finalize Report'}
                    </button>
                 )}
                 {order.status === 'Completed' && (
                    <div className="flex-1 bg-slate-100 text-slate-500 font-black py-3 rounded-xl text-[10px] text-center uppercase tracking-widest border border-slate-200">
                      Results Uploaded
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
