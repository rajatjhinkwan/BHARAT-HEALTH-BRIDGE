import React from 'react';
import { 
  Users, UserCheck, TrendingUp, AlertCircle, 
  ArrowUpRight, FileText, Calendar, Shield, Activity
} from 'lucide-react';

const AdminHome = () => {
  const staffAttendance = [
    { dept: 'Doctors / Physicians', total: 42, present: 38, leave: 2, late: 2, pct: 90.4 },
    { dept: 'Nursing Staff', total: 128, present: 110, leave: 12, late: 6, pct: 85.9 },
    { dept: 'Surgical Team', total: 18, present: 18, leave: 0, late: 0, pct: 100 },
    { dept: 'Cleaning & Maintenance', total: 34, present: 24, leave: 6, late: 4, pct: 70.5 },
    { dept: 'OPD Reception', total: 12, present: 11, leave: 1, late: 0, pct: 91.6 },
    { dept: 'Pharmacists', total: 15, present: 14, leave: 1, late: 0, pct: 93.3 },
  ];

  const activityFeed = [
    { type: 'checkin', text: 'New patient registered at OPD Counter 2', time: '2 mins ago', icon: <ArrowUpRight size={16}/>, color: 'var(--primary)' },
    { type: 'emergency', text: 'Critical Trauma incoming - Bay 4 prepped', time: '5 mins ago', icon: <AlertCircle size={16}/>, color: 'var(--danger)' },
    { type: 'billing', text: 'Daily revenue target reached (105%)', time: '12 mins ago', icon: <TrendingUp size={16}/>, color: 'var(--success)' },
    { type: 'system', text: 'Blockchain node sync completed successfully', time: '20 mins ago', icon: <Shield size={16}/>, color: 'var(--purple)' },
  ];

  return (
    <div className="dashboard-container animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Administrator Command Center</h1>
          <p style={{ margin: 0 }}>Unified oversight of hospital operations and facility performance.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary"><FileText size={18}/> Export Report</button>
          <button className="btn-primary"><Calendar size={18}/> Staff Roster</button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="stats-grid">
        <div className="metrics-card">
          <div className="metrics-header">
            <span>TOTAL STAFF</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div className="metrics-value">249</div>
          <div className="metrics-footer text-success">92% Attendance Today</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>PATIENTS IN QUEUE</span>
            <Activity size={20} color="var(--accent)" />
          </div>
          <div className="metrics-value">114</div>
          <div className="metrics-footer text-warning">Avg Wait: 14m</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>DAILY REVENUE</span>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <div className="metrics-value">₹8,42,000</div>
          <div className="metrics-footer text-success">+12% vs Yesterday</div>
        </div>
        <div className="metrics-card">
          <div className="metrics-header">
            <span>PENDING EMERGENCIES</span>
            <AlertCircle size={20} color="var(--danger)" />
          </div>
          <div className="metrics-value">03</div>
          <div className="metrics-footer text-danger">2 Immediate (Red)</div>
        </div>
      </div>

      <div className="main-dashboard-grid">
        {/* Staff Attendance Panel */}
        <div className="card">
          <h3 className="mb-4">Real-Time Staff Attendance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Present</th>
                  <th>On Leave</th>
                  <th>Late</th>
                  <th>Status %</th>
                </tr>
              </thead>
              <tbody>
                {staffAttendance.map((row, idx) => (
                  <tr key={idx} className="attendance-row">
                    <td style={{ fontWeight: 600 }}>{row.dept}</td>
                    <td>{row.total}</td>
                    <td>{row.present}</td>
                    <td>{row.leave}</td>
                    <td>{row.late}</td>
                    <td>
                      <span className={`attendance-pct ${row.pct > 90 ? 'pct-high' : row.pct > 75 ? 'pct-mid' : 'pct-low'}`}>
                        {row.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary mt-4 w-full" style={{ borderStyle: 'dashed' }}>
            View Individual Staff Records
          </button>
        </div>

        {/* Right Column: Activity & Emergencies */}
        <div className="flex flex-col gap-6">
          {/* Emergency Overview Widget */}
          <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
            <h3>Emergency Triage Overview</h3>
            <div className="emergency-overview-grid">
              <div className="emergency-stat" style={{ color: 'var(--danger)' }}>
                <span className="count">02</span>
                <span className="label">Immediate</span>
              </div>
              <div className="emergency-stat" style={{ color: 'var(--warning)' }}>
                <span className="count">04</span>
                <span className="label">Urgent</span>
              </div>
              <div className="emergency-stat" style={{ color: 'var(--success)' }}>
                <span className="count">08</span>
                <span className="label">Minor</span>
              </div>
            </div>
            <button className="btn-primary mt-4 w-full" onClick={() => window.location.href='/emergency'}>
              Open Emergency Terminal
            </button>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <h3 className="mb-4">Hospital Activity Feed</h3>
            <div className="activity-feed">
              {activityFeed.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon" style={{ background: `${item.color}22`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="activity-details">
                    <div className="activity-text">{item.text}</div>
                    <div className="activity-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="btn-secondary" style={{ justifyContent: 'space-between' }}>
                Approve Leave Requests <span className="badge badge-warning">12</span>
              </button>
              <button className="btn-secondary" style={{ justifyContent: 'space-between' }}>
                View Blockchain Audit Trail <Shield size={16}/>
              </button>
              <button className="btn-secondary" style={{ justifyContent: 'space-between' }}>
                Generate Daily Report <ArrowUpRight size={16}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
