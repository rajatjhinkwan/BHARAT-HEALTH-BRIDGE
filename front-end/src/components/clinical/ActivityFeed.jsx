import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/workflow/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && activities.length === 0) return null;

  return (
    <div className="activity-feed glass-card p-6 h-full" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <div className="flex items-center gap-2 mb-6 sticky top-0 bg-slate-900 z-10 py-2 border-b border-slate-800">
        <Activity size={18} className="text-primary" />
        <h3 className="text-xs font-black uppercase tracking-widest text-white m-0">Live Activity Stream</h3>
      </div>

      <div className="space-y-4">
        {activities.map((act, idx) => (
          <div key={idx} className="activity-item flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors border-l-2 border-primary-light">
            <div className="flex-shrink-0 mt-1">
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-black text-white">{act.patientName}</span>
                  <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
               <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{act.action}</div>
               <p className="text-[10px] text-slate-400 m-0 leading-relaxed">{act.details}</p>
               <div className="mt-2 flex items-center gap-2 opacity-60">
                  <User size={10} className="text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500">BY: {act.performedBy}</span>
               </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-12">
             <Activity size={32} className="mx-auto mb-4 text-slate-800" />
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">No recent data packet in buffer</p>
          </div>
        )}
      </div>
    </div>
  );
}
