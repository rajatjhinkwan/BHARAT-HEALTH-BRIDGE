import React, { useState } from 'react';
import { Droplet, Heart, Activity, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

const mockBloodStock = [
  { group: 'O+', units: 45, expiring: 2 },
  { group: 'O-', units: 8, expiring: 0 },
  { group: 'A+', units: 32, expiring: 5 },
  { group: 'A-', units: 12, expiring: 1 },
  { group: 'B+', units: 28, expiring: 3 },
  { group: 'B-', units: 5, expiring: 0 },
  { group: 'AB+', units: 15, expiring: 0 },
  { group: 'AB-', units: 3, expiring: 0 }
];

export default function BloodBank() {
  const [stock] = useState(mockBloodStock);

  const getStatusColor = (units) => {
      if (units < 10) return 'var(--danger)';
      if (units <= 20) return 'var(--warning)';
      return 'var(--success)';
  };

  const getStatusBg = (units) => {
      if (units < 10) return '#ffe4e6';
      if (units <= 20) return 'var(--warning-light)';
      return 'var(--success-light)';
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--border)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
    bloodCard: (units) => ({
       background: getStatusBg(units),
       border: `2px solid ${getStatusColor(units)}`,
       borderRadius: 'var(--radius-lg)',
       padding: '1.5rem',
       display: 'flex',
       flexDirection: 'column',
       alignItems: 'center',
       justifyContent: 'center',
       position: 'relative',
       boxShadow: units < 10 ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
       color: getStatusColor(units)
    }),
    groupLabel: { fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' },
    unitLabel: { fontSize: '1.2rem', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Droplet size={40} color="var(--danger)" fill="var(--danger)" />
            <div>
               <h1 style={{ margin: 0 }}>Blood Bank & Inventory Control</h1>
               <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time 8-Group Matrix Tracking</p>
            </div>
         </div>

         <div style={styles.grid}>
            {stock.map(item => (
                <div key={item.group} style={styles.bloodCard(item.units)}>
                    <Heart size={24} color={getStatusColor(item.units)} />
                    <div style={styles.groupLabel}>{item.group}</div>
                    <div style={styles.unitLabel}>{item.units} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>units</span></div>
                    
                    {item.expiring > 0 && (
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'var(--shadow)' }}>
                           <AlertTriangle size={10} /> {item.expiring} Exp. Soon
                        </div>
                    )}
                </div>
            ))}
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
             <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                 <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} color="var(--primary)"/> Issue Workflow</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input className="input" placeholder="Patient UHID" style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--background)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                    <select className="input" style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--background)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>
                       <option>Target Blood Group</option>
                       {stock.map(s => <option key={s.group}>{s.group}</option>)}
                    </select>
                    <select className="input" style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--background)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>
                       <option>Component: Whole Blood</option>
                       <option>Component: Plasma</option>
                       <option>Component: Platelets</option>
                       <option>Component: RBC</option>
                    </select>
                    <button className="btn-primary" style={{ padding: '1rem', marginTop: '1rem' }}>Cross-Match & Issue Units</button>
                 </div>
             </div>

             <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                 <h3 style={{ margin: '0 0 1rem 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} /> Critical Shortages</h3>
                 {stock.filter(s => s.units < 10).map(s => (
                     <div key={s.group} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', marginBottom: '1rem' }}>
                         <div style={{ fontWeight: 'bold' }}>{s.group} (Only {s.units} left)</div>
                         <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Trigger SMS Campaign</button>
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
