import React from 'react';
import { Activity, Wind, Zap } from 'lucide-react';

const getStatusColor = (status) => {
  switch(status) {
    case 'Available': return 'var(--color-success)';
    case 'Occupied': return 'var(--color-danger)';
    case 'Cleaning': return 'var(--color-cleaning)';
    case 'Reserved': return 'var(--color-warning)';
    case 'Maintenance': return 'var(--text-3)';
    default: return 'var(--text-tertiary)';
  }
};

const getEquipmentIcon = (eq) => {
  if (eq.includes('Ventilator')) return <Wind size={16} title="Ventilator" />;
  if (eq.includes('Monitor')) return <Activity size={16} title="Monitor" />;
  if (eq.includes('Defibrillator')) return <Zap size={16} title="Defibrillator" />;
  return null;
};

const BedCard = ({ bed, patient, onClick }) => {
  const statusColor = getStatusColor(bed.status);
  
  return (
    <div 
      className="bed-card animate-fade-in" 
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        '--card-accent': statusColor,
      }}
    >
      <div className="flex justify-between items-start">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1' }}>
              {bed.id}
            </h3>
            <p className="text-xs" style={{ margin: 0, marginTop: '0.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Floor {bed.floor || 1} • {bed.ward}</p>
          </div>
        </div>
        <span className={`badge badge-${bed.status.toLowerCase()}`}>
          {bed.status}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {bed.status === 'Occupied' && patient ? (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'rgba(15, 23, 42, 0.03)', 
            borderRadius: 'var(--r)',
            border: '1px solid rgba(15, 23, 42, 0.05)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <p className="text-sm font-bold" style={{ margin: 0, color: 'var(--text-primary)' }}>{patient.name}</p>
            <p className="text-xs font-medium" style={{ margin: 0, marginTop: '0.4rem', color: 'var(--text-2)' }}>Severity: <span style={{ color: 'var(--text-primary)' }}>{patient.severity}</span></p>
          </div>
        ) : (
          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p className="text-sm font-medium" style={{ margin: 0, color: 'var(--text-3)' }}>No Patient Assigned</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-auto" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <div className="text-xs font-bold" style={{ color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {bed.type}
        </div>
        <div className="flex gap-2" style={{ color: 'var(--color-primary)' }}>
          {(bed.equipment || bed.equipped || []).map((eq, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', backgroundColor: 'var(--bg-main)', borderRadius: '50%', color: 'var(--color-primary)' }}>
              {getEquipmentIcon(eq)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BedCard;
