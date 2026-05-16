import React from 'react';
import { 
  Activity, ClipboardCheck, AlertTriangle, Users, 
  Thermometer, Heart, Droplets, Pill, CheckCircle2
} from 'lucide-react';

const NurseHome = () => {
  const vitalsQueue = [
    { token: 'T-106', name: 'Priya Das', age: 28, wait: '8m' },
    { token: 'T-107', name: 'Manish Verma', age: 45, wait: '12m' },
    { token: 'T-108', name: 'Rajesh Khanna', age: 62, wait: '15m' },
  ];

  const medications = [
    { bed: 'ICU-04', patient: 'S. Bansal', med: 'Insulin Glargine', dosage: '10 Units', time: '11:00 AM' },
    { bed: 'W-202', patient: 'M. Tyagi', med: 'Ceftriaxone', dosage: '1g IV', time: '11:30 AM' },
  ];

  const doctors = [
    { name: 'Dr. Sharma', dept: 'Medicine', status: 'In Consultation', color: 'var(--warning)' },
    { name: 'Dr. Iyer', dept: 'Orthopedics', status: 'Available', color: 'var(--success)' },
    { name: 'Dr. Fatima', dept: 'Pediatrics', status: 'On Break', color: 'var(--text-muted)' },
  ];

  return (
    <div className="dashboard-container animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Nursing Station Dashboard</h1>
          <p style={{ margin: 0 }}>Monitor ward vitals, pre-consultation prep, and medication schedules.</p>
        </div>
        <button className="btn-primary">
          <Activity size={18}/> Update Ward Status
        </button>
      </div>

      <div className="stats-grid">
        <div className="metrics-card">
          <div className="metrics-header">
            <span>WARD OCCUPANCY</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div className="metrics-value">28/32</div>
          <div className="metrics-footer text-danger">4 Beds Available</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>PENDING VITALS</span>
            <Thermometer size={20} color="var(--accent)" />
          </div>
          <div className="metrics-value">05</div>
          <div className="metrics-footer">Queue: OPD Floor 1</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>DUE MEDICATIONS</span>
            <Pill size={20} color="var(--warning)" />
          </div>
          <div className="metrics-value">12</div>
          <div className="metrics-footer text-warning">02 Overdue</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>ACTIVE TRIAGE</span>
            <AlertTriangle size={20} color="var(--danger)" />
          </div>
          <div className="metrics-value">02</div>
          <div className="metrics-footer text-danger">Requires immediate prep</div>
        </div>
      </div>

      <div className="main-dashboard-grid">
        {/* Queue Assistance - Vitals Checklist */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Queue Assistance: Pre-Consultation</h3>
            <span className="badge badge-primary">OPD Waiting</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {vitalsQueue.map((p, idx) => (
              <div key={idx} className="card" style={{ padding: '1rem', background: 'var(--surface-hover)' }}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="queue-token">{p.token}</span>
                    <span style={{ fontWeight: 700, marginLeft: '1rem' }}>{p.name} ({p.age}y)</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wait: {p.wait}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="badge badge-secondary" style={{ textTransform: 'none' }}><Heart size={12}/> BP</div>
                  <div className="badge badge-secondary" style={{ textTransform: 'none' }}><Thermometer size={12}/> Temp</div>
                  <div className="badge badge-secondary" style={{ textTransform: 'none' }}><Activity size={12}/> Pulse</div>
                  <div className="badge badge-secondary" style={{ textTransform: 'none' }}><Droplets size={12}/> SpO2</div>
                </div>
                <button className="btn-primary w-full" style={{ padding: '0.5rem' }}>
                  Record Vitals & Mark Ready
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Medication Tracker */}
          <div className="card">
            <h3>Medication Tracker</h3>
            <div className="flex flex-col gap-3 mt-4">
              {medications.map((m, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--warning)' }}>
                  <div className="flex justify-between font-bold text-sm">
                    <span>{m.bed} - {m.patient}</span>
                    <span className="text-warning">{m.time}</span>
                  </div>
                  <div className="text-sm mt-1">{m.med} ({m.dosage})</div>
                  <button className="btn-secondary w-full mt-2" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={14}/> Mark Administered
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Coordination */}
          <div className="card">
            <h3>Doctor Coordination</h3>
            <div className="flex flex-col gap-3 mt-4">
              {doctors.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-[var(--surface-hover)]">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.dept}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pulse-dot" style={{ background: d.color }}></span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Escalation */}
          <div className="card" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)' }}>
            <h3 style={{ color: 'var(--danger)' }}>Triage Escalation</h3>
            <p style={{ fontSize: '0.85rem' }}>Manually escalate patient priority for immediate attention.</p>
            <button className="btn-primary w-full" style={{ background: 'var(--danger)' }}>
              Escalate Priority
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseHome;
