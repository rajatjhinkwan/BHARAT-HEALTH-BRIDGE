import React, { useState, useEffect, useCallback } from 'react';
import { Activity, User as UserIcon, Calendar, Clock, ChevronRight, Stethoscope, ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';
import { useAuth } from '../../context/AuthContext';
import HospitalMetrics from '../../components/clinical/HospitalMetrics';
import ActivityFeed from '../../components/clinical/ActivityFeed';
import { API_BASE_URL } from '../../config';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    if (!user?.department) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(user.department)}`);
      if (resp.ok) {
        const data = await resp.json();
        setWaitingQueue(data.waiting);
        const current = data.inConsultation.find(p => p.doctor === user.name);
        setActivePatient(current);
      }
    } catch (err) {
      console.error('Failed to fetch queue', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleCallNext = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${user._id}`, {
        method: 'PATCH'
      });
      if (resp.ok) {
        fetchQueue();
      } else {
        const err = await resp.json();
        alert(err.message || 'Failed to call next patient');
      }
    } catch (err) {
      alert('Network error while calling next patient');
    }
  };

  const handleSelectPatient = (p) => {
    navigate('/emr', { state: { selectedPatient: { ...p, patientId: p.patientId || p._id } } });
  };

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
       <HospitalMetrics />
       <header className="dashboard-header">
          <div className="dashboard-title-group">
              <h1>
                  <Stethoscope size={36} color="var(--primary)" /> 
                  {user?.department} Queue
                  <span className="queue-count-badge">{waitingQueue.length} Waiting</span>
              </h1>
              <p className="dashboard-subtitle">Medical Officer: {user?.name} | Specialization: {user?.specialization || 'General'}</p>
          </div>
          <div className="header-status-pill flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                  <div className="pulse-dot" style={{ background: user?.availabilityStatus === 'AVAILABLE' ? 'var(--success)' : user?.availabilityStatus === 'IN CONSULTATION' ? 'var(--primary)' : 'var(--slate-500)' }}></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{user?.availabilityStatus || 'OFFLINE'}</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <span>Session: {new Date().toLocaleDateString()}</span>
          </div>
       </header>

       {activePatient ? (
         <section className="current-patient-hero">
            <div className="hero-content">
               <div className="hero-text-info">
                 <div className="hero-patient-label">IN CONSULTATION</div>
                 <h2 className="hero-patient-name">{activePatient.patientName}</h2>
                 <p className="hero-patient-meta">UHID: {activePatient.mrn} • Token: {activePatient.tokenNumber}</p>
               </div>
               <div className="hero-actions">
                  <button onClick={() => handleSelectPatient(activePatient)} className="btn-secondary">
                     Open Clinical EMR <ChevronRight size={18} />
                  </button>
               </div>
            </div>
         </section>
       ) : (
         <section className="current-patient-hero empty" style={{ background: 'var(--surface-hover)', border: '2px dashed var(--border)' }}>
             <div style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>
                 <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>No active consultation. Call the next patient to begin.</p>
                 <button onClick={handleCallNext} className="btn-primary" style={{ padding: '1rem 3rem' }}>
                     <Play size={18} fill="white" /> Call Next Patient
                 </button>
             </div>
         </section>
       )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2">
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Upcoming Queue</h3>
                </div>

                <div className="patient-grid">
                    {waitingQueue.map((p, index) => (
                        <div key={p.queueId} className="queue-card animate-fade-in-up">
                            <div className="card-top">
                                <div className="patient-rank">#{index + 1}</div>
                                <div className="patient-info">
                                    <h3 className="module-title">{p.patientName}</h3>
                                    <div className="patient-mrn-small">{p.mrn}</div>
                                </div>
                            </div>
                            
                            <div className="patient-tags-row">
                                <span className="tag-pill">{p.tokenNumber}</span>
                                <span className="tag-pill" style={{ 
                                    background: p.priority === 'CRITICAL' ? 'var(--danger-light)' : 'var(--surface-hover)',
                                    color: p.priority === 'CRITICAL' ? 'var(--danger)' : 'inherit',
                                    fontWeight: p.priority === 'CRITICAL' ? '900' : 'inherit'
                                }}>{p.priority || 'NORMAL'}</span>
                            </div>

                            <div className="card-footer">
                                <div className="time-slot">
                                    <Clock size={16} /> {p.time}
                                </div>
                                <button onClick={() => handleSelectPatient(p)} className="btn-primary btn-sm">
                                    Preview <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {waitingQueue.length === 0 && !activePatient && (
                        <div className="empty-state">
                            <Activity size={64} className="empty-icon" />
                            <h3>Queue Clear</h3>
                            <p className="dashboard-subtitle">All patients in {user?.department} have been served.</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
               <ActivityFeed />
               <div className="card mt-8 p-6 bg-slate-900 border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Internal Comm</h3>
                  <div className="space-y-4">
                     <button className="w-full btn-secondary text-xs py-2 justify-start">
                        <ShieldCheck size={14} /> Request Lab Support
                     </button>
                     <button className="w-full btn-secondary text-xs py-2 justify-start">
                        <Activity size={14} /> Alert ICU Team
                     </button>
                  </div>
               </div>
            </div>
        </div>
    </div>
  );
}
