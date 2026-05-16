import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Activity, Clock, MapPin, Phone, ShieldCheck, Database, Calendar } from 'lucide-react';

export default function NodeDetail({ selectedNode, onClose }) {
  if (!selectedNode) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online': return 'status-online';
      case 'Offline': return 'status-offline';
      case 'Busy': return 'status-busy';
      default: return 'status-online';
    }
  };

  const nodeStats = {
    STAFF: { status: 'Online', role: 'Senior Nurse', shift: 'Night Shift', contact: '+91 98765 43210' },
    DOCTOR: { status: 'Busy', role: 'Chief Resident', shift: 'Day Shift', contact: '+91 87654 32109' },
    BED: { status: 'Occupied', role: 'Asset', shift: 'Available in 2h', contact: 'Room 302' },
    DEPARTMENT: { status: 'Operational', role: 'Facility', shift: 'Active 24/7', contact: 'Ext 102' },
    ROOT: { status: 'Secure', role: 'Main Infrastructure', shift: 'System OK', contact: 'Admin Sec' }
  };

  const stat = nodeStats[selectedNode.type] || nodeStats.ROOT;

  return (
    <motion.div 
      className="uhgs-glass-panel uhgs-sidebar"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{selectedNode.label}</h3>
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span className={`detail-status-dot ${getStatusColor(stat.status)}`}></span>
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>{stat.status}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="detail-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
             <ShieldCheck size={14} /> Designation
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{stat.role}</div>
        </div>

        <div className="detail-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
             <Clock size={14} /> Operating Hours
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{stat.shift}</div>
        </div>

        <div className="detail-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
             <Phone size={14} /> Contact/Location
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{stat.contact}</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
         <button className="btn-primary" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '0.8rem' }}>
            Open Records
         </button>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
         <p style={{ fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.5)' }}>Last updated: Just now</p>
      </div>
    </motion.div>
  );
}
