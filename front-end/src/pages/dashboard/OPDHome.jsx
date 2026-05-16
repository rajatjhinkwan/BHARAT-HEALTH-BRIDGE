import React from 'react';
import { 
  UserPlus, Search, Printer, Send, 
  Clock, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';

const OPDHome = () => {
  const recentCards = [
    { token: 'T-112', name: 'Amitabh Bachchan', dept: 'Cardiology', doctor: 'Dr. Sharma', status: 'Waiting' },
    { token: 'T-111', name: 'Rekha G.', dept: 'Dermatology', doctor: 'Dr. Iyer', status: 'Called' },
    { token: 'T-110', name: 'Shah Rukh Khan', dept: 'Medicine', doctor: 'Dr. Fatima', status: 'Completed' },
  ];

  const deptQueues = [
    { name: 'Medicine', length: 12, wait: '15m' },
    { name: 'Orthopedics', length: 8, wait: '25m' },
    { name: 'Pediatrics', length: 5, wait: '10m' },
    { name: 'Cardiology', length: 14, wait: '45m' },
  ];

  return (
    <div className="dashboard-container animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Reception & OPD Command</h1>
          <p style={{ margin: 0 }}>Register patients, generate tokens, and manage the front-desk queue.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Printer size={18}/> Reprint Last</button>
          <button className="btn-primary"><UserPlus size={18}/> New Registration</button>
        </div>
      </div>

      {/* Queue Status Bar */}
      <div className="card mb-6">
        <h3 className="mb-4">Live Department Queue Status</h3>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {deptQueues.map((dq, idx) => (
            <div key={idx} style={{ minWidth: '180px', padding: '1rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--divider)' }}>
              <div className="font-bold text-sm mb-1">{dq.name}</div>
              <div className="flex justify-between items-end">
                <div className="text-xl font-bold">{dq.length} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IN LINE</span></div>
                <div className="text-xs font-bold text-warning">{dq.wait}</div>
              </div>
              <div className="w-full bg-[var(--divider)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--warning)] h-full" style={{ width: `${(dq.length / 20) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-dashboard-grid">
        {/* Quick Patient Registration Form */}
        <div className="card">
          <h3 className="mb-4">Quick Patient Registration</h3>
          <form className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="text" placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label>Age & Gender</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Age" style={{ flex: 1 }} />
                <select style={{ flex: 1 }}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Orthopedics</option>
                <option>Pediatrics</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Doctor Preference</label>
              <select>
                <option>No Preference (Next Available)</option>
                <option>Dr. Sharma</option>
                <option>Dr. Iyer</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', padding: '1rem' }}>
              GENERATE OPD CARD & TOKEN
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          {/* Today's Generated Cards */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3>Recent Tokens</h3>
              <button className="btn-icon"><RefreshCw size={14}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {recentCards.map((c, idx) => (
                <div key={idx} style={{ padding: '0.875rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--divider)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="queue-token">{c.token}</span>
                    <span className={`badge ${c.status === 'Called' ? 'badge-primary' : c.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.dept} • {c.doctor}</div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}><Printer size={12}/> Print</button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}><Send size={12}/> SMS</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full mt-4">View All Generated Cards</button>
          </div>

          {/* Appointment Verification */}
          <div className="card" style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }}>
            <h3>Verify Appointment</h3>
            <div className="form-group mt-2">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Appt ID or Mobile..." 
                  style={{ paddingLeft: '2.5rem', background: 'var(--surface)' }}
                />
              </div>
            </div>
            <button className="btn-primary w-full" style={{ background: 'var(--success)' }}>
              Check-In & Generate Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPDHome;
