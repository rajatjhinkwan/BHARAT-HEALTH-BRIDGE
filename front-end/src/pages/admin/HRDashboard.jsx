import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Plane, Ban, CheckCircle, Search, Edit2, Calendar } from 'lucide-react';

export default function HRDashboard() {
  const [personnel, setPersonnel] = useState([
    { id: 'DOC-CARD-123', name: 'Dr. R. Sharma', dept: 'Cardiology', role: 'Chief Resident', status: 'Present', shiftStart: '08:00 AM', timeIn: '07:45 AM', details: '', returnDate: '' },
    { id: 'NUR-ICU-123', name: 'Sister A. Mehta', dept: 'ICU Ward', role: 'Head Nurse', status: 'Present', shiftStart: '06:00 AM', timeIn: '05:52 AM', details: '', returnDate: '' },
    { id: 'LAB-123', name: 'Vikram Singh', dept: 'Laboratory', role: 'Lab Tech', status: 'Present', shiftStart: '09:00 AM', timeIn: '08:50 AM', details: '', returnDate: '' },
    { id: 'DOC-ORTH-123', name: 'Dr. V. Gupta', dept: 'Orthopedics', role: 'Attending', status: 'Not Arrived', shiftStart: '10:00 AM', timeIn: '--', details: '', returnDate: '' },
    { id: 'REC-123', name: 'Kavita Devi', dept: 'Reception', role: 'Receptionist', status: 'Not Arrived', shiftStart: '09:30 AM', timeIn: '--', details: '', returnDate: '' },
    { id: 'NUR-GEN-123', name: 'Sister P. Verma', dept: 'General Medicine', role: 'Staff Nurse', status: 'Leave', shiftStart: '--', timeIn: '--', details: 'Paid Time Off', returnDate: '15 Nov 2026' },
    { id: 'PHA-123', name: 'Arun Yadav', dept: 'Pharmacy', role: 'Pharmacist', status: 'Leave', shiftStart: '--', timeIn: '--', details: 'Sick Leave', returnDate: '12 Nov 2026' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const updateStatus = (id, newStatus) => {
    setPersonnel(personnel.map(p => {
      if(p.id === id) {
        if(newStatus === 'Leave') {
           const reason = window.prompt("Enter Leave Reason (e.g., Sick Leave):", p.details || "Personal Leave");
           const d = window.prompt("Enter Return Date (e.g., 20 Nov 2023):", p.returnDate || "");
           return { ...p, status: newStatus, details: reason || '', returnDate: d || '' };
        } else if(newStatus === 'Present') {
           const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
           return { ...p, status: newStatus, timeIn: time };
        }
        return { ...p, status: newStatus };
      }
      return p;
    }));
    setEditingId(null);
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    metricCard: (colorCode) => ({ background: 'var(--surface)', border: `1px solid ${colorCode}`, padding: '1.5rem', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `6px solid ${colorCode}`, boxShadow: 'var(--shadow-sm)' }),
    table: { width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
    th: { padding: '1rem', textAlign: 'left', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' },
    td: { padding: '1rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', verticalAlign: 'middle' },
    statusBadge: (status) => {
      let bg = 'var(--background)'; let color = 'var(--text-main)';
      if (status === 'Present') { bg = 'var(--success-light)'; color = 'var(--success)'; }
      else if (status === 'Not Arrived') { bg = 'var(--danger-light)'; color = 'var(--danger)'; }
      else if (status === 'Leave') { bg = 'var(--warning-light)'; color = 'var(--warning)'; }
      return { padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: bg, color: color, fontWeight: 'bold', fontSize: '0.8rem', display: 'inline-block' }
    },
    actionBtn: { padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', margin: '0.2rem' }
  };

  const filteredStaff = personnel.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const counts = {
    present: personnel.filter(p => p.status === 'Present').length,
    notArrived: personnel.filter(p => p.status === 'Not Arrived').length,
    leave: personnel.filter(p => p.status === 'Leave').length,
    totalScheduled: personnel.filter(p => p.status !== 'Leave').length
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={36} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0 }}>HR & Attendance</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage staff attendance, leaves, and records</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/shifts" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Calendar size={16} /> Shift roster
          </Link>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input type="text" placeholder="Search by ID or name…" style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', width: '100%', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--surface)' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.metricGrid}>
         <div style={styles.metricCard('var(--success)')}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16}/> Clocked In (Present)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{counts.present} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}> / {counts.totalScheduled} Scheduled</span></div>
         </div>
         <div style={styles.metricCard('var(--danger)')}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Ban size={16}/> Late / Not Arrived</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)' }}>{counts.notArrived}</div>
         </div>
         <div style={styles.metricCard('var(--warning)')}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Plane size={16}/> Out on Leave</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>{counts.leave}</div>
         </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Staff Tracking</h2>
        </div>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Shift / Time</th>
              <th style={styles.th}>Actions (HR)</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((p) => (
              <tr key={p.id} style={{ background: p.status === 'Not Arrived' ? '#fef2f2' : 'transparent' }}>
                <td style={styles.td}>
                   <div style={{ fontWeight: '600' }}>{p.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({p.id})</span></div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.role} - {p.dept}</div>
                </td>
                <td style={styles.td}>
                   <span style={styles.statusBadge(p.status)}>{p.status}</span>
                </td>
                <td style={styles.td}>
                   {p.status === 'Leave' ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: '600' }}>{p.details}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Return: {p.returnDate}</div>
                      </div>
                   ) : (
                      <div style={{ fontSize: '0.85rem' }}>
                         <div><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/> {p.shiftStart}</div>
                         <div style={{ color: p.status === 'Not Arrived' ? 'var(--danger)' : 'var(--text-muted)' }}>Badged: {p.timeIn}</div>
                      </div>
                   )}
                </td>
                <td style={styles.td}>
                   {editingId === p.id ? (
                      <div>
                         <button onClick={() => updateStatus(p.id, 'Present')} style={{...styles.actionBtn, background: 'var(--success-light)', color: 'var(--success)', borderColor: 'var(--success)'}}>Mark Present</button>
                         <button onClick={() => updateStatus(p.id, 'Leave')} style={{...styles.actionBtn, background: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'var(--warning)'}}>Grant Leave</button>
                         <button onClick={() => updateStatus(p.id, 'Not Arrived')} style={{...styles.actionBtn, background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger)'}}>Not Arrived</button>
                         <button onClick={() => setEditingId(null)} style={{...styles.actionBtn}}>Cancel</button>
                      </div>
                   ) : (
                      <button onClick={() => setEditingId(p.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                         <Edit2 size={14}/> Manage
                      </button>
                   )}
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No personnel records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
