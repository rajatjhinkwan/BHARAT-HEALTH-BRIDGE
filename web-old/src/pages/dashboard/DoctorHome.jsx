import React from 'react';
import { 
  User, Play, Search, AlertCircle, Clock, 
  CheckCircle2, ArrowRight, ExternalLink, Zap, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorHome = () => {
  const navigate = useNavigate();
  
  const patientQueue = [
    { token: 'T-104', name: 'Rohan Sharma', wait: '5m', status: 'Waiting', type: 'Regular' },
    { token: 'T-105', name: 'Anjali Gupta', wait: '12m', status: 'Waiting', type: 'Follow-up' },
    { token: 'T-102', name: 'Vikram Singh', wait: '--', status: 'In Progress', type: 'Emergency' },
    { token: 'T-106', name: 'Priya Das', wait: '25m', status: 'Waiting', type: 'Regular' },
  ];

  const emergencyCases = [
    { name: 'Unknown Male (Trauma)', level: 'Immediate', time: '10:42 AM', status: '🔴 Immediate' },
    { name: 'Suresh Kumar (Chest Pain)', level: 'Urgent', time: '10:50 AM', status: '🟡 Urgent' },
  ];

  return (
    <div className="dashboard-container animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Clinical Command Center</h1>
          <p style={{ margin: 0 }}>Manage your queue, clinical records, and emergency consultations.</p>
        </div>
        <button className="btn-primary" style={{ height: '50px', padding: '0 2rem', fontSize: '1rem' }} onClick={() => navigate('/emr')}>
          <Play size={20} fill="currentColor"/> CALL NEXT PATIENT
        </button>
      </div>

      <div className="stats-grid">
        <div className="metrics-card">
          <div className="metrics-header">
            <span>PATIENTS SEEN TODAY</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div className="metrics-value">18</div>
          <div className="metrics-footer">Target: 25</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>AVG CONSULTATION</span>
            <Clock size={20} color="var(--primary)" />
          </div>
          <div className="metrics-value">12.5m</div>
          <div className="metrics-footer text-success">Within efficient range</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>PENDING SIGNATURES</span>
            <Zap size={20} color="var(--warning)" />
          </div>
          <div className="metrics-value">04</div>
          <div className="metrics-footer text-warning">E-Prescriptions pending</div>
        </div>
      </div>

      <div className="main-dashboard-grid">
        {/* Patient Queue */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Today's Patient Queue</h3>
            <span className="badge badge-primary">Active: 12</span>
          </div>
          
          <div className="queue-list">
            {patientQueue.map((p, idx) => (
              <div key={idx} className={`queue-item ${p.status === 'In Progress' ? 'triage-urgent' : ''}`}>
                <div className="queue-token">{p.token}</div>
                <div className="patient-info-mini">
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.type} • Wait: {p.wait}</span>
                </div>
                <div className="status-indicator" style={{ color: p.status === 'In Progress' ? 'var(--warning)' : 'var(--text-muted)' }}>
                  {p.status === 'In Progress' ? <Activity size={14} className="animate-pulse"/> : null}
                  {p.status}
                </div>
                <button className="btn-icon" style={{ marginLeft: '1rem' }} onClick={() => navigate('/emr')}>
                  <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-secondary w-full mt-4">View Full Queue History</button>
        </div>

        {/* Emergency & Quick Access */}
        <div className="flex flex-col gap-6">
          {/* Quick EMR Search */}
          <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
            <h3>Quick EMR Access</h3>
            <div className="form-group mt-2">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Patient Name, Token, or Mobile..." 
                  style={{ paddingLeft: '2.5rem', background: 'var(--surface)' }}
                />
              </div>
            </div>
            <button className="btn-primary w-full"><ExternalLink size={16}/> Open Electronic Record</button>
          </div>

          {/* Emergency Triage Panel */}
          <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
            <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20}/> Emergency Triage
            </h3>
            <div className="flex flex-col gap-3 mt-4">
              {emergencyCases.map((ev, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--divider)' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontWeight: 700 }}>{ev.name}</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>IMMEDIATE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arrived: {ev.time}</span>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Attend Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Pad Shortcut */}
          <div className="card">
            <h3>Clinical Action Pad</h3>
            <p style={{ fontSize: '0.85rem' }}>Quickly access your digital prescription and diagnostics pad.</p>
            <button className="btn-secondary w-full" onClick={() => navigate('/emr')}>
              Open Full Action Pad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorHome;
