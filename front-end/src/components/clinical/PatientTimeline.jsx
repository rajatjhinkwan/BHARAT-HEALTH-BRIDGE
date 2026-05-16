import React from 'react';
import { Clock, Activity, ArrowRight, UserCheck, Heart } from 'lucide-react';

export default function PatientTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 opacity-50">
        <Clock size={48} className="mb-4" />
        <p className="font-bold uppercase tracking-widest text-[10px]">No Timeline Data Available</p>
      </div>
    );
  }

  const getIcon = (action) => {
    if (action.includes('REGISTER')) return <UserCheck size={14} />;
    if (action.includes('ADMIT')) return <ArrowRight size={14} />;
    if (action.includes('VITALS')) return <Activity size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="patient-timeline-container p-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
        <Heart size={16} className="text-primary" />
        Master Patient Journey
      </h3>
      
      <div className="timeline-list">
        {timeline.map((event, idx) => (
          <div key={idx} className="timeline-event">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div style={{ background: 'var(--primary-light)', padding: '0.4rem', borderRadius: '8px', color: 'var(--primary)' }}>
                  {getIcon(event.action)}
                </div>
                <span className="font-black text-sm text-slate-700">{event.action}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">{event.details}</p>
            
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary-light px-2 py-1 rounded">
                Dept: {event.department}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                By: {event.performedBy}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
