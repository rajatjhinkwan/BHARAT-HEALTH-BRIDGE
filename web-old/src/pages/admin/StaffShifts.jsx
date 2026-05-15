import React, { useState } from 'react';
import { Calendar, Users, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function StaffShifts() {
  const [activeTab, setActiveTab] = useState('calendar');

  const mockLeaveRequests = [
     { id: 'LR-001', name: 'Dr. John Smith', role: 'Doctor', type: 'Casual Leave', dates: '24 Apr - 26 Apr', status: 'pending' },
     { id: 'LR-002', name: 'Nurse Sarah', role: 'Nurse', type: 'Sick Leave', dates: '22 Apr - 23 Apr', status: 'approved' },
     { id: 'LR-003', name: 'Pharmacist Alex', role: 'Pharmacist', type: 'Earned Leave', dates: '10 May - 15 May', status: 'pending' },
  ];

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--border)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' },
    tabBar: { display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' },
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
        transition: 'all 0.2s',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`
    }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' },
    dayBlock: { minHeight: '120px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' },
    shiftBadge: (type) => ({ 
        fontSize: '0.75rem', 
        padding: '0.2rem 0.5rem', 
        borderRadius: '4px', 
        marginBottom: '0.3rem', 
        background: type === 'Morning' ? 'rgba(56, 189, 248, 0.1)' : (type === 'Evening' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)'),
        color: type === 'Morning' ? '#38bdf8' : (type === 'Evening' ? '#f59e0b' : '#94a3b8'),
        border: `1px solid ${type === 'Morning' ? 'rgba(56, 189, 248, 0.3)' : (type === 'Evening' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.3)')}`
    })
  };

  const renderCalendar = () => {
      // Mock calendar logic
      const days = [];
      for(let i=1; i<=30; i++) {
          days.push(
              <div key={i} style={styles.dayBlock}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{i}</div>
                  {i % 3 === 0 && <div style={styles.shiftBadge('Morning')}>Morning: 12 Staff</div>}
                  {i % 4 === 0 && <div style={styles.shiftBadge('Evening')}>Evening: 8 Staff</div>}
                  {i % 5 === 0 && <div style={styles.shiftBadge('Night')}>Night: 5 Staff</div>}
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
              <div>
                 <h1 style={{ margin: 0 }}>Staff & Shift Management</h1>
                 <p style={{ margin: 0, color: 'var(--text-muted)' }}>Auto-scheduling and leave workflow integration</p>
              </div>
           </div>

           <div style={styles.tabBar}>
               <div style={styles.tab(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')}><Calendar size={18}/> Shift Roster</div>
               <div style={styles.tab(activeTab === 'leaves')} onClick={() => setActiveTab('leaves')}><FileText size={18}/> Leave Approvals</div>
               <div style={styles.tab(activeTab === 'payroll')} onClick={() => setActiveTab('payroll')}><Clock size={18}/> Time & Payroll</div>
           </div>

           {activeTab === 'calendar' && (
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}>April 2026 Shift Roster</h3>
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Generate Auto-Schedule</button>
                  </div>
                  {renderCalendar()}
               </div>
           )}

           {activeTab === 'leaves' && (
               <div style={{ display: 'grid', gap: '1rem' }}>
                  {mockLeaveRequests.map(lr => (
                      <div key={lr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                 <h3 style={{ margin: 0 }}>{lr.name}</h3>
                                 <span style={{ fontSize: '0.8rem', background: 'var(--surface-hover)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{lr.role}</span>
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '1rem' }}>
                                 <span><strong>Type:</strong> {lr.type}</span>
                                 <span><strong>Dates:</strong> {lr.dates}</span>
                              </div>
                          </div>
                          
                          {lr.status === 'pending' ? (
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-primary" style={{ background: 'var(--success)', borderColor: 'var(--success)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16}/> Approve</button>
                                <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16}/> Reject</button>
                             </div>
                          ) : (
                             <div style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={18}/> Approved</div>
                          )}
                      </div>
                  ))}
               </div>
           )}

           {activeTab === 'payroll' && (
               <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                   <Clock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                   <h2>Payroll Engine Integration</h2>
                   <p>This module automatically calculates Overtime, Deductions, TDS, and PF based on the completed shift data.</p>
                   <button className="btn-secondary" style={{ marginTop: '1rem' }}>Connect to Financial Ledger</button>
               </div>
           )}
       </div>
    </div>
  );
}
