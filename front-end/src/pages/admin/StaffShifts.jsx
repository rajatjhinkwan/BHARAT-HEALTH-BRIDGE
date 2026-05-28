import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

const ROSTER_MONTH = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const mockLeaveRequests = [
  { id: 'LR-001', name: 'Dr. R. Sharma', role: 'Doctor', type: 'Casual Leave', dates: '28 May - 30 May 2026', status: 'pending' },
  { id: 'LR-002', name: 'Sister A. Mehta', role: 'Nurse', type: 'Sick Leave', dates: '25 May - 26 May 2026', status: 'approved' },
  { id: 'LR-003', name: 'Vikram Singh', role: 'Pharmacist', type: 'Earned Leave', dates: '10 Jun - 15 Jun 2026', status: 'pending' },
  { id: 'LR-004', name: 'Kavita Devi', role: 'Lab Technician', type: 'Casual Leave', dates: '2 Jun 2026', status: 'pending' },
];

const SHIFT_STAFF = ['Dr. R. Sharma', 'Sister P. Verma', 'Arun Yadav', 'Dr. V. Gupta', 'Sister A. Mehta'];

export default function StaffShifts() {
  const [activeTab, setActiveTab] = useState('calendar');

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--border)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
    tabBar: { display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' },
    tab: (active) => ({
      padding: '0.75rem 1.5rem',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : 'var(--text-main)',
      borderRadius: '9999px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' },
    dayBlock: { minHeight: '110px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' },
    shiftBadge: (type) => ({
      fontSize: '0.7rem',
      padding: '0.2rem 0.4rem',
      borderRadius: '4px',
      marginBottom: '0.25rem',
      background: type === 'Morning' ? 'rgba(56, 189, 248, 0.12)' : type === 'Evening' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(100, 116, 139, 0.12)',
      color: type === 'Morning' ? '#0284c7' : type === 'Evening' ? '#d97706' : '#475569',
    }),
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const morningStaff = SHIFT_STAFF[i % SHIFT_STAFF.length];
      days.push(
        <div key={i} style={styles.dayBlock}>
          <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>{i}</div>
          {i % 2 === 0 && <div style={styles.shiftBadge('Morning')}>Morning — {morningStaff}</div>}
          {i % 3 === 0 && <div style={styles.shiftBadge('Evening')}>Evening — 8 staff</div>}
          {i % 5 === 0 && <div style={styles.shiftBadge('Night')}>Night — 5 staff</div>}
        </div>
      );
    }
    return <div style={styles.grid}>{days}</div>;
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
        <div style={styles.header}>
          <Users size={36} color="var(--primary)" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>Shift Roster & Leave</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Bharat Health Bridge — Uttarakhand facility staffing</p>
          </div>
          <Link to="/hr" className="btn-secondary" style={{ textDecoration: 'none' }}>← HR attendance</Link>
        </div>

        <div style={styles.tabBar}>
          <div style={styles.tab(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')}><Calendar size={18} /> Shift roster</div>
          <div style={styles.tab(activeTab === 'leaves')} onClick={() => setActiveTab('leaves')}><FileText size={18} /> Leave approvals</div>
          <div style={styles.tab(activeTab === 'attendance')} onClick={() => setActiveTab('attendance')}><Clock size={18} /> Leave & attendance</div>
        </div>

        {activeTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{ROSTER_MONTH} shift roster</h3>
              <button type="button" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Generate auto-schedule</button>
            </div>
            {renderCalendar()}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mockLeaveRequests.map((lr) => (
              <div key={lr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.35rem' }}>{lr.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lr.role} · {lr.type} · {lr.dates}</span>
                </div>
                {lr.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn-primary" style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} /> Approve</button>
                    <button type="button" className="btn-secondary" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={16} /> Reject</button>
                  </div>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}><CheckCircle size={16} /> Approved</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Clock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2>Leave & attendance records</h2>
            <p>Track present, on-leave, and late arrivals. Payment and payroll modules are not enabled for this deployment.</p>
            <Link to="/hr" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>Open HR attendance</Link>
          </div>
        )}
      </div>
    </div>
  );
}
