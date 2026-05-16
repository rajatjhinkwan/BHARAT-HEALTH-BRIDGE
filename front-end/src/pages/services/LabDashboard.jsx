import React, { useState, useEffect, useCallback } from 'react';
import { FileUp, FileCheck, FlaskConical, Droplet, Database, Activity } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';

export default function LabDashboard() {
  const [labQueue, setLabQueue] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});
  const [labResults, setLabResults] = useState({}); // Stores the dynamic input values for tests

  const getMockOrders = () => ([
    {
      patientName: 'Anil Kumar',
      mrn: 'UHID-MOCK-2026',
      encounterId: 'ENC-MOCK-201',
      status: 'Pending',
      tests: ['Complete Blood Count (CBC)', 'Liver Function Test'],
      patientId: 'P-MOCK-2026',
      patient: { mrn: 'UHID-MOCK-2026', _id: 'P-MOCK-2026', patientName: 'Anil Kumar', labOrders: [{ status: 'Pending', tests: ['Complete Blood Count (CBC)', 'Liver Function Test'], encounterId: 'ENC-MOCK-201' }] },
      orderIndex: 0,
      needsCBC: true,
      needsLipid: false
    },
    {
      patientName: 'Ramesh Patel',
      mrn: 'UHID-MOCK-2028',
      encounterId: 'ENC-MOCK-202',
      status: 'Processing',
      tests: ['Lipid Profile', 'HbA1c'],
      patientId: 'P-MOCK-2028',
      patient: { mrn: 'UHID-MOCK-2028', _id: 'P-MOCK-2028', patientName: 'Ramesh Patel', labOrders: [{ status: 'Processing', tests: ['Lipid Profile', 'HbA1c'], encounterId: 'ENC-MOCK-202' }] },
      orderIndex: 0,
      needsCBC: false,
      needsLipid: true
    }
  ]);

  const fetchOrders = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/api/clinical/patients');
      if (resp.ok) {
        const patients = await resp.json();
        const queue = [];
        
        patients.forEach(p => {
           if(p.labOrders) {
              p.labOrders.forEach((order, idx) => {
                 let needsCBC = false;
                 let needsLipid = false;
                 order.tests.forEach(t => {
                    if(t.toLowerCase().includes('blood count') || t.toLowerCase().includes('cbc')) needsCBC = true;
                    if(t.toLowerCase().includes('lipid') || t.toLowerCase().includes('cmp')) needsLipid = true;
                 });
    
                 queue.push({
                    ...order,
                    patientName: p.patientName,
                    mrn: p.mrn,
                    patientId: p._id,
                    patient: p,
                    orderIndex: idx,
                    needsCBC,
                    needsLipid
                 });
              });
           }
        });
        
        setLabQueue(queue.length > 0 ? queue.sort((a,b) => (a.status === 'Verified' ? 1 : -1)) : getMockOrders());
      } else {
        setLabQueue(getMockOrders());
      }
    } catch(err) {
      console.error(err);
      setLabQueue(getMockOrders());
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCollect = async (patient, orderIndex) => {
    try {
       const newOrders = [...patient.labOrders];
       newOrders[orderIndex].status = 'Processing';
       
       await fetch(`http://localhost:4000/api/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ labOrders: newOrders })
       });
       fetchOrders();
    } catch(err) {
       console.error("Failed to start processing", err);
    }
  };

  const handleResultChange = (encounterId, testField, value) => {
    setLabResults({
        ...labResults,
        [encounterId]: {
            ...labResults[encounterId],
            [testField]: value
        }
    });
  };

  const handleUpload = useCallback(async (patient, orderIndex, encounterId) => {
    setLoadingIds(prev => ({...prev, [encounterId]: true}));
    
    try {
       const order = patient.labOrders[orderIndex];
       const extractedMetrics = labResults[encounterId] || {};
       
       const resultRecord = {
          id: 'RES-' + Date.now(),
          orderRef: encounterId,
          testsRun: order.tests,
          timestamp: new Date().toISOString(),
          metricsLog: extractedMetrics
       };

       const hash = await generateBlockchainHash({ type: "LAB_RESULT_RECORD", mrn: patient.mrn, ...resultRecord });
       
       const newOrders = [...patient.labOrders];
       newOrders[orderIndex].status = 'Verified';
       newOrders[orderIndex].resultHash = hash;
       // Assuming backend schema uses `results` string for now, we stringify it
       newOrders[orderIndex].results = JSON.stringify(extractedMetrics);
       
       await fetch(`http://localhost:4000/api/clinical/patients/${patient._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ labOrders: newOrders })
       });

       alert("Biochemical Analysis Validated. Cryptographic Hash Secured:\n" + hash);
       fetchOrders();
    } catch(err) {
       console.error(err);
       alert("Error uploading results");
    }
    setLoadingIds(prev => ({...prev, [encounterId]: false}));
  }, [labResults, fetchOrders]);

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
    colGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' },
    card: (status) => ({ background: 'var(--surface)', border: `1px solid ${status === 'Pending' ? 'var(--danger)' : (status === 'Processing' ? 'var(--warning)' : 'var(--success)')}`, boxShadow: 'var(--shadow-sm)', padding: '2rem', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }),
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 },
    inputRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
    input: { padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%', background: 'var(--background)', color: 'var(--text-main)', fontFamily: 'inherit' },
    uploadBox: { border: '2px dashed var(--border)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--background)', cursor: 'pointer', color: 'var(--text-muted)' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <FlaskConical size={36} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Clinical Pathology & Testing</h1>
      </div>

      {labQueue.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Database size={48} style={{ opacity: 0.3 }} />
            <h3>No Pathology Orders</h3>
            <p>Waiting for Doctor Encounter requests.</p>
         </div>
      ) : (
         <div style={styles.colGrid}>
           {labQueue.map((order, idx) => (
             <div key={idx} style={styles.card(order.status)}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div>
                     <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{order.patientName}</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.mrn} | Order Ref: {order.encounterId}</div>
                  </div>
                  <div style={{ padding: '0.3rem 0.6rem', border: `1px solid ${order.status === 'Pending'?'var(--danger)':order.status === 'Processing'?'var(--warning)':'var(--success)'}`, borderRadius: '4px', fontSize: '0.8rem', fontWeight:'bold', color: order.status === 'Pending'?'var(--danger)':order.status === 'Processing'?'var(--warning)':'var(--success)' }}>
                     {order.status}
                  </div>
               </div>

               <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                 <strong style={{ fontSize: '0.9rem' }}>Requested Test Vectors:</strong>
                 <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                    {order.tests.map((t, i) => <li key={i}>{t}</li>)}
                 </ul>
               </div>

               {order.status === 'Pending' && (
                   <button onClick={() => handleCollect(order.patient, order.orderIndex)} className="btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', padding: '1rem', marginTop: '1rem' }}>
                     <Droplet size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> Draw Sequence & Start Processing
                   </button>
               )}

               {order.status === 'Processing' && (
                  <div style={{ marginTop: '1rem' }}>
                     {order.needsCBC && (
                        <div style={{ marginBottom: '1.5rem' }}>
                           <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary)' }}><Activity size={16} style={{verticalAlign:'middle'}}/> Complete Blood Count Metrics</strong>
                           <div style={styles.inputRow}>
                              <div style={styles.inputGroup}>
                                 <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>RBC (m/mcL)</label>
                                 <input style={styles.input} onChange={e => handleResultChange(order.encounterId, 'RBC', e.target.value)} />
                              </div>
                              <div style={styles.inputGroup}>
                                 <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>WBC (dL)</label>
                                 <input style={styles.input} onChange={e => handleResultChange(order.encounterId, 'WBC', e.target.value)} />
                              </div>
                              <div style={styles.inputGroup}>
                                 <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Hemoglobin (g/dL)</label>
                                 <input style={styles.input} onChange={e => handleResultChange(order.encounterId, 'Hemoglobin', e.target.value)} />
                              </div>
                           </div>
                        </div>
                     )}

                     {order.needsLipid && (
                        <div style={{ marginBottom: '1.5rem' }}>
                           <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--purple)' }}><Activity size={16} style={{verticalAlign:'middle'}}/> Lipid Profile Analysis</strong>
                           <div style={styles.inputRow}>
                              <div style={styles.inputGroup}>
                                 <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Total Chol (mg/dL)</label>
                                 <input style={styles.input} onChange={e => handleResultChange(order.encounterId, 'Cholesterol', e.target.value)} />
                              </div>
                              <div style={styles.inputGroup}>
                                 <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Triglycerides</label>
                                 <input style={styles.input} onChange={e => handleResultChange(order.encounterId, 'Trigs', e.target.value)} />
                              </div>
                           </div>
                        </div>
                     )}
                     
                     <button onClick={() => handleUpload(order.patient, order.orderIndex, order.encounterId)} disabled={loadingIds[order.encounterId]} className="btn-primary" style={{ width: '100%', padding: '1rem', background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' }}>
                        {loadingIds[order.encounterId] ? 'Hashing Metrics to Chain...' : <><FileCheck size={18} style={{marginRight:'6px', verticalAlign:'middle'}}/> Finalize & Authorize Results</>}
                     </button>
                  </div>
               )}
               
               {order.status === 'Verified' && (
                  <div style={{ background: 'var(--success-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}><FileCheck size={20} /> Result Digitally Signed</div>
                    <div style={{ fontSize: '0.75rem', wordBreak: 'break-all', marginTop: '0.5rem', color: '#000' }}>HASH: {order.resultHash}</div>
                  </div>
               )}
             </div>
           ))}
         </div>
      )}
    </div>
  );
}
