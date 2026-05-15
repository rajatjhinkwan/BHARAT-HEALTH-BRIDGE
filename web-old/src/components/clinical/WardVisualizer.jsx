import React from 'react';
import { Bed as BedIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function WardVisualizer({ beds, wardName }) {
  if (!beds || beds.length === 0) return null;

  return (
    <div className="ward-visualizer card mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 style={{ margin: 0 }}>Visual Ward Map</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0">{wardName} Floor Plan</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--success)' }}></div>
              <span className="text-[10px] font-bold">AVAILABLE</span>
           </div>
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--danger)' }}></div>
              <span className="text-[10px] font-bold">OCCUPIED</span>
           </div>
           <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--warning)' }}></div>
              <span className="text-[10px] font-bold">CLEANING</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {beds.map((bed) => (
          <div 
            key={bed._id} 
            className="bed-node"
            style={{
              padding: '1rem',
              borderRadius: '16px',
              border: '2px solid',
              borderColor: bed.occupied ? 'var(--danger-light)' : 'var(--success-light)',
              background: bed.occupied ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <BedIcon size={24} color={bed.occupied ? 'var(--danger)' : 'var(--success)'} />
            <span className="font-black text-sm">{bed.bedNumber}</span>
            <div className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white border border-slate-100 shadow-sm">
               {bed.occupied ? 'OCCUPIED' : 'VACANT'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
