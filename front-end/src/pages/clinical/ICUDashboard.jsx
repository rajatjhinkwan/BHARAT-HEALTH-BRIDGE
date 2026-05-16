import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, Heart, User, Clock, AlertCircle, ChevronRight, Plus, FileText, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VitalsModal from '../../components/clinical/VitalsModal';
import NurseNoteModal from '../../components/clinical/NurseNoteModal';

import { API_BASE_URL } from '../../config';

export default function ICUDashboard() {
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
      const res = await fetch(`${API_BASE_URL}/critical/icu/patients`);
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

  const getCriticality = (p) => {
    const spo2 = parseInt(p.vitals?.[p.vitals.length - 1]?.spo2 || '100');
    if (spo2 < 90) return 'CRITICAL';
    if (spo2 < 95) return 'STABLE';
    return 'STABLE';
  };

  const styles = {
    container: { padding: '2rem', maxWidth: '1600px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' },
    card: (criticality) => ({
      background: 'var(--surface)',
      border: `1px solid ${criticality === 'CRITICAL' ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: '28px',
      padding: '1.75rem',
      position: 'relative',
      boxShadow: 'var(--shadow-xl)',
      transition: 'transform 0.3s ease'
    }),
    badge: (criticality) => ({
      position: 'absolute',
      top: '1.25rem',
      right: '1.25rem',
      padding: '0.5rem 1rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 900,
      background: criticality === 'CRITICAL' ? 'var(--danger)' : 'var(--success)',
      color: 'white',
      letterSpacing: '0.05em'
    }),
    vitalBox: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginTop: '1.5rem',
      background: 'var(--background)',
      padding: '1.25rem',
      borderRadius: '20px',
      border: '1px solid var(--border)'
    },
    vitalItem: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
    vitalValue: (color) => ({ fontSize: '1.25rem', fontWeight: 800, color: color }),
    noteSection: {
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '16px',
        border: '1px dashed var(--primary-light)'
    },
    btnGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' },
    btn: { padding: '0.85rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }
  };

  const isDoctor = user?.role?.toUpperCase() === 'DOCTOR' || user?.role?.toUpperCase() === 'ADMIN';

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>ICU Monitoring Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0' }}>Real-time critical care tracking for Intensive Care Unit</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ padding: '1rem 2.5rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active ICU Patients</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>{patients.length}</div>
            </div>
        </div>
      </div>

      <div style={styles.grid}>
        {patients.map(p => {
          const crit = getCriticality(p);
          const latestVitals = p.vitals?.[p.vitals.length - 1] || {};
          const latestNote = p.nurseNotes?.[p.nurseNotes.length - 1];
          
          return (
            <div key={p._id} style={styles.card(crit)} className="hover-card-effect">
              <div style={styles.badge(crit)}>{crit}</div>
              
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--surface-hover)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <User size={32} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{p.patientName}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{p.mrn} • {p.age}y • {p.gender}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900 }}>BED: {p.icuBedNumber || 'N/A'}</span>
                <span style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>{p.currentStatus}</span>
              </div>

              <div style={styles.vitalBox}>
                <div style={styles.vitalItem}>
                  <Heart size={20} color="var(--danger)" />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Pulse Rate</div>
                    <div style={styles.vitalValue('var(--danger)')}>{latestVitals.heartRate || '--'} <span style={{fontSize: '0.75rem'}}>BPM</span></div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Droplets size={20} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Oxygen SpO2</div>
                    <div style={styles.vitalValue('var(--primary)')}>{latestVitals.spo2 || '--'}%</div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Activity size={20} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>BP (mmHg)</div>
                    <div style={styles.vitalValue('#8b5cf6')}>{latestVitals.bp || '--'}</div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Thermometer size={20} color="var(--warning)" />
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Temperature</div>
                    <div style={styles.vitalValue('var(--warning)')}>{latestVitals.temp || '--'}°F</div>
                  </div>
                </div>
              </div>

              {latestNote && (
                  <div style={styles.noteSection}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <FileText size={14} color="var(--primary)" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Latest Nurse Note</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{latestNote.note}"</p>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 700 }}>— {latestNote.nurseName} • {new Date(latestNote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
              )}

              <div style={styles.btnGroup}>
                {isDoctor ? (
                    <button onClick={() => navigate('/emr', { state: { selectedPatient: { ...p, patientId: p._id } } })} style={{ ...styles.btn, background: 'var(--primary)', color: 'white', border: 'none' }}>
                        <ChevronRight size={18} /> Open EMR
                    </button>
                ) : (
                    <button onClick={() => { setActiveNotePatient(p); setShowNoteModal(true); }} style={{ ...styles.btn, background: 'var(--surface)', color: 'var(--text-main)' }}>
                        <FileText size={18} /> Add Note
                    </button>
                )}
                <button onClick={() => { setActiveVitalsPatient(p); setShowVitalsModal(true); }} style={{ ...styles.btn, background: 'white', color: 'var(--text-main)' }}>
                   <Activity size={18} /> Update Vitals
                </button>
                {!isDoctor && (
                    <button style={{ ...styles.btn, gridColumn: 'span 2', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <Bell size={18} /> Notify Doctor
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
          <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: '32px', border: '1px dashed var(--border)', marginTop: '2rem' }}>
              <Activity size={64} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--text-muted)' }}>No Patients in ICU</h2>
              <p style={{ color: 'var(--text-muted)' }}>The unit is currently available for admissions.</p>
          </div>
      )}
    </div>
  );
}
