import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, Heart, User, Clock, AlertCircle, ChevronRight, Wind, Zap, Plus, FileText, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VitalsModal from '../../components/clinical/VitalsModal';
import NurseNoteModal from '../../components/clinical/NurseNoteModal';
import { API_BASE_URL } from '../../config';

export default function VentilatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVitalsPatient, setActiveVitalsPatient] = useState(null);
  const [activeNotePatient, setActiveNotePatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/critical/ventilator/patients`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    container: { padding: '2rem', maxWidth: '1600px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' },
    card: {
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '28px',
      padding: '1.75rem',
      position: 'relative',
      color: 'white',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      transition: 'transform 0.3s ease'
    },
    statusBadge: {
      position: 'absolute',
      top: '1.25rem',
      right: '1.25rem',
      padding: '0.5rem 1rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: 900,
      background: '#ef4444',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      letterSpacing: '0.05em'
    },
    ventMetric: {
      background: '#1e293b',
      padding: '1.5rem',
      borderRadius: '20px',
      borderLeft: '4px solid #3b82f6',
      marginTop: '1.5rem',
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },
    noteSection: {
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '16px',
        border: '1px dashed #3b82f6'
    },
    btnGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' },
    btn: { padding: '0.85rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', border: '1px solid #334155', fontSize: '0.85rem', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }
  };

  const isDoctor = user?.role?.toUpperCase() === 'DOCTOR' || user?.role?.toUpperCase() === 'ADMIN';

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>Ventilator Care Unit</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0' }}>Critical respiratory support and automated monitoring</p>
        </div>
        <div style={{ padding: '1rem 2.5rem', background: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Active Ventilators</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444' }}>{patients.length}</div>
        </div>
      </div>

      <div style={styles.grid}>
        {patients.map(p => {
          const latestVitals = p.vitals?.[p.vitals.length - 1] || {};
          const latestNote = p.nurseNotes?.[p.nurseNotes.length - 1];
          const spo2 = parseInt(latestVitals.spo2 || '0');
          
          return (
            <div key={p._id} style={styles.card} className="hover-card-effect">
              <div style={styles.statusBadge}>
                <Wind size={14} /> ON VENTILATOR
              </div>
              
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#1e293b', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                  <User size={32} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{p.patientName}</h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>{p.mrn} • {p.age}y • {p.gender}</p>
                </div>
              </div>

              <div style={styles.ventMetric}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Oxygen Saturation (SpO2)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: spo2 < 90 ? '#ef4444' : '#10b981' }}>{spo2}%</div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                      <div style={{ width: `${spo2}%`, height: '100%', background: spo2 < 90 ? '#ef4444' : '#3b82f6', transition: 'width 1s ease-in-out' }}></div>
                  </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Bed Number</div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{p.ventilatorBedNumber || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Pulse Rate</div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{latestVitals.heartRate || '--'} <span style={{fontSize: '0.7rem'}}>BPM</span></div>
                  </div>
              </div>

              {latestNote && (
                  <div style={styles.noteSection}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <FileText size={14} color="#3b82f6" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Latest Observations</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>"{latestNote.note}"</p>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 700 }}>— {latestNote.nurseName} • {new Date(latestNote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
              )}

              <div style={styles.btnGroup}>
                {isDoctor ? (
                    <button onClick={() => navigate('/emr', { state: { selectedPatient: { ...p, patientId: p._id } } })} style={{ ...styles.btn, background: '#3b82f6', border: 'none' }}>
                        EMR Access
                    </button>
                ) : (
                    <button onClick={() => { setActiveNotePatient(p); setShowNoteModal(true); }} style={styles.btn}>
                        <FileText size={18} /> Add Note
                    </button>
                )}
                <button onClick={() => { setActiveVitalsPatient(p); setShowVitalsModal(true); }} style={styles.btn}>
                   <Activity size={18} /> Vitals
                </button>
                {!isDoctor && (
                    <button style={{ ...styles.btn, gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <Bell size={18} /> Emergency Alert
                    </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showVitalsModal && activeVitalsPatient && (
          <VitalsModal 
            patient={activeVitalsPatient} 
            onClose={() => setShowVitalsModal(false)} 
            onUpdate={fetchPatients} 
          />
      )}

      {showNoteModal && activeNotePatient && (
          <NurseNoteModal 
            patient={activeNotePatient} 
            onClose={() => setShowNoteModal(false)} 
            onUpdate={fetchPatients} 
          />
      )}

      {patients.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '5rem', background: '#0f172a', borderRadius: '32px', border: '1px dashed #1e293b', marginTop: '2rem' }}>
              <Wind size={64} color="#1e293b" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ color: '#94a3b8' }}>No Active Ventilators</h2>
              <p style={{ color: '#64748b' }}>System ready for respiratory support requests.</p>
          </div>
      )}
    </div>
  );
}
