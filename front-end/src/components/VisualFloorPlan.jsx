import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const MOCK_BEDS = Array.from({ length: 12 }, (_, i) => ({
  id: `B-${i + 1}`,
  status: i < 5 ? 'occupied' : (i < 8 ? 'cleaning' : 'free'),
  patientName: i < 5 ? `Patient ${i + 1}` : null
}));

export default function VisualFloorPlan({ wardName = "ICU Floor 1" }) {
  const [beds, setBeds] = useState(MOCK_BEDS);
  
  useEffect(() => {
    // Attempt WebSocket connection for strict real-time reqs
    const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');
    const socket = io(apiRoot);
    
    socket.on('connect', () => {
       console.log('Socket connected for floor plan');
    });

    socket.on('bedUpdate', (updatedBed) => {
      setBeds((prev) => prev.map(bed => bed.id === updatedBed.id ? updatedBed : bed));
    });

    return () => socket.disconnect();
  }, []);

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '1.5rem',
      padding: '2rem',
      background: 'var(--surface-hover)',
      borderRadius: 'var(--radius-lg)',
      border: '2px dashed var(--border)'
    },
    bedItem: (status) => ({
      position: 'relative',
      height: '140px',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid',
      backgroundColor: status === 'free' ? 'var(--success-light)' : (status === 'occupied' ? 'var(--danger-light)' : 'var(--warning-light)'),
      borderColor: status === 'free' ? 'var(--success)' : (status === 'occupied' ? 'var(--danger)' : 'var(--warning)'),
      cursor: 'pointer',
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform 0.2s'
    }),
    bedNumber: {
      fontSize: '1.25rem',
      fontWeight: '800',
      color: 'var(--text-main)',
      marginBottom: '0.25rem'
    },
    bedStatus: {
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase'
    }
  };

  return (
    <div className="card">
       <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>{wardName} - Visual Map</h3>
       <div style={styles.grid}>
          {beds.map(bed => (
            <div key={bed.id} style={styles.bedItem(bed.status)} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={styles.bedNumber}>{bed.id}</div>
              <div style={styles.bedStatus}>
                 {bed.status === 'occupied' ? 'OCCUPIED' : (bed.status === 'cleaning' ? 'CLEANING' : 'FREE')}
              </div>
              {bed.patientName && <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>{bed.patientName}</div>}
              
              {/* Context menu mock dots */}
              <div style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.5 }}>...</div>
            </div>
          ))}
       </div>
       <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
          * Connected to realtime Socket.io event stream 🟢
       </p>
    </div>
  );
}
