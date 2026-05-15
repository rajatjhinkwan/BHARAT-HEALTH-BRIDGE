import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, Heart, User, Clock, AlertCircle, ChevronRight, Plus, FileText, Bell, Bed as BedIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VitalsModal from '../../components/clinical/VitalsModal';
import NurseNoteModal from '../../components/clinical/NurseNoteModal';
import WardVisualizer from '../../components/clinical/WardVisualizer';
import { API_BASE_URL } from '../../config';

export default function WardDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVitalsPatient, setActiveVitalsPatient] = useState(null);
  const [activeNotePatient, setActiveNotePatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const wardName = user?.assignedWard || 'ICU';

  const fetchData = async () => {
    try {
      // Fetch patients in this ward
      const pRes = await fetch(`${API_BASE_URL}/critical/wards/${encodeURIComponent(wardName)}/patients`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatients(pData);
      }

      // Fetch all beds to calculate stats
      const bRes = await fetch(`${API_BASE_URL}/critical/beds`);
      if (bRes.ok) {
        const bData = await bRes.json();
        const wardBeds = bData.filter(b => b.wardName === wardName);
        setBeds(wardBeds);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [wardName]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'var(--danger)';
      case 'IN ICU': return 'var(--danger)';
      case 'ON VENTILATOR': return '#991b1b';
      case 'UNDER OBSERVATION': return 'var(--warning)';
      case 'STABLE': return 'var(--success)';
      default: return 'var(--primary)';
    }
  };

  const styles = {
    container: { padding: '2rem', maxWidth: '1600px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' },
    statCard: { background: 'var(--surface)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' },
    card: (status) => ({
      background: 'var(--surface)',
      border: `1px solid ${status === 'CRITICAL' ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: '28px',
      padding: '1.75rem',
      position: 'relative',
      boxShadow: 'var(--shadow-xl)',
    }),
    badge: (status) => ({
      position: 'absolute',
      top: '1.25rem',
      right: '1.25rem',
      padding: '0.5rem 1rem',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: 900,
      background: getStatusColor(status),
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
    vitalItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    vitalValue: (color) => ({ fontSize: '1.1rem', fontWeight: 800, color: color }),
    btnGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' },
    btn: { padding: '0.85rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }
  };

  const occupiedBeds = beds.filter(b => b.occupied).length;
  const criticalPatients = patients.filter(p => p.currentStatus === 'CRITICAL' || p.currentStatus === 'IN ICU' || p.currentStatus === 'ON VENTILATOR').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>{wardName} Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0' }}>Real-time ward monitoring & nurse workflow</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>NURSE ON DUTY</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{user?.name}</div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Beds</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{beds.length}</div>
        </div>
        <div style={styles.statCard}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Occupied</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--danger)' }}>{occupiedBeds}</div>
        </div>
        <div style={styles.statCard}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Available</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>{beds.length - occupiedBeds}</div>
        </div>
        <div style={styles.statCard}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Critical</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--danger)' }}>{criticalPatients}</div>
        </div>
      </div>

      <div style={styles.grid}>
        {patients.map(p => {
          const latestVitals = p.vitals?.[p.vitals.length - 1] || {};
          const latestNote = p.nurseNotes?.[p.nurseNotes.length - 1];
          
          return (
            <div key={p._id} style={styles.card(p.currentStatus)}>
              <div style={styles.badge(p.currentStatus)}>{p.currentStatus}</div>
              
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--surface-hover)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={28} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{p.patientName}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{p.mrn} • {p.age}y • {p.gender}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>BED: {p.currentBed || 'N/A'}</span>
                <span style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>DR: {p.assignedDoctor || 'Assigned'}</span>
              </div>

              <div style={styles.vitalBox}>
                <div style={styles.vitalItem}>
                  <Heart size={18} color="var(--danger)" />
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>PULSE</div>
                    <div style={styles.vitalValue('var(--danger)')}>{latestVitals.heartRate || '--'} <span style={{fontSize: '0.65rem'}}>BPM</span></div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Droplets size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>SPO2</div>
                    <div style={styles.vitalValue('var(--primary)')}>{latestVitals.spo2 || '--'}%</div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Activity size={18} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>BP</div>
                    <div style={styles.vitalValue('#8b5cf6')}>{latestVitals.bp || '--'}</div>
                  </div>
                </div>
                <div style={styles.vitalItem}>
                  <Thermometer size={18} color="var(--warning)" />
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>TEMP</div>
                    <div style={styles.vitalValue('var(--warning)')}>{latestVitals.temp || '--'}°F</div>
                  </div>
                </div>
              </div>

              {latestNote && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px dashed var(--primary-light)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{latestNote.note}"</p>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>— {latestNote.nurseName}</div>
                  </div>
              )}

              <div style={styles.btnGroup}>
                <button onClick={() => { setActiveNotePatient(p); setShowNoteModal(true); }} style={{ ...styles.btn, background: 'var(--surface)', color: 'var(--text-main)' }}>
                    <FileText size={18} /> Note
                </button>
                <button onClick={() => { setActiveVitalsPatient(p); setShowVitalsModal(true); }} style={{ ...styles.btn, background: 'white', color: 'var(--text-main)' }}>
                   <Activity size={18} /> Vitals
                </button>
                <button style={{ ...styles.btn, gridColumn: 'span 2', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Bell size={18} /> Notify Doctor
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <WardVisualizer beds={beds} wardName={wardName} />

      {showVitalsModal && activeVitalsPatient && (
          <VitalsModal 
            patient={activeVitalsPatient} 
            onClose={() => setShowVitalsModal(false)} 
            onUpdate={fetchData} 
          />
      )}

      {showNoteModal && activeNotePatient && (
          <NurseNoteModal 
            patient={activeNotePatient} 
            onClose={() => setShowNoteModal(false)} 
            onUpdate={fetchData} 
          />
      )}

      {!loading && patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', borderRadius: '32px', border: '1px dashed var(--border)', marginTop: '2rem' }}>
              <BedIcon size={64} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--text-muted)' }}>No Patients in {wardName}</h2>
              <p style={{ color: 'var(--text-muted)' }}>The ward is currently available for admissions.</p>
          </div>
      )}
    </div>
  );
}
