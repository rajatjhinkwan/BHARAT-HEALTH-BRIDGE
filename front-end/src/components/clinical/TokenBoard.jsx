import React, { useState, useEffect } from 'react';
import { Monitor, ArrowRight, Activity, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function TokenBoard({ department = 'OPD' }) {
  const [serving, setServing] = useState(null);
  const [next, setNext] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('hospflow_auth_token');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(department)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const inConsultation = Array.isArray(data?.inConsultation) ? data.inConsultation : [];
        const waiting = Array.isArray(data?.waiting) ? data.waiting : [];
        setServing(inConsultation[0] || null);
        setNext(waiting[0] || null);
        setWaitingCount(waiting.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [department]);

  return (
    <div className="token-board-container glass-card p-12 max-w-4xl mx-auto my-12" style={{ background: '#020617', border: '4px solid var(--primary-light)' }}>
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
           <Monitor size={48} className="text-primary" />
           <div>
              <h1 className="text-white m-0" style={{ fontSize: '2.5rem' }}>LIVE TOKEN DISPLAY</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{department} DEPARTMENT CENTER</p>
           </div>
        </div>
        <div className="bg-primary/20 px-6 py-2 rounded-full border border-primary/30 flex items-center gap-2">
            <div className="pulse-dot"></div>
            <span className="text-primary font-black text-xs">LIVE SYNC ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {/* Now Serving */}
        <div className="serving-box p-8 rounded-3xl bg-primary/10 border-2 border-primary/20 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 block">NOW SERVING</span>
            <div className="text-8xl font-black text-white mb-4 animate-pulse">
                {serving ? serving.tokenNumber : '--'}
            </div>
            <div className="text-slate-300 font-bold uppercase text-sm">
                {serving ? serving.patientName : 'WAITING FOR CALL'}
            </div>
            {serving && (
                <div className="mt-4 text-xs font-black text-slate-500">
                    DOCTOR: {serving.doctor}
                </div>
            )}
        </div>

        {/* Next Token */}
        <div className="next-box p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 block">NEXT IN LINE</span>
            <div className="text-7xl font-black text-slate-400 mb-4">
                {next ? next.tokenNumber : '--'}
            </div>
            <div className="text-slate-500 font-bold uppercase text-sm">
                {next ? next.patientName : 'NO PENDING QUEUE'}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center px-4">
                <div className="text-left">
                    <span className="text-[9px] font-black text-slate-600 block mb-1">TOTAL WAITING</span>
                    <span className="text-xl font-black text-white">{waitingCount}</span>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-600 block mb-1">AVG. WAIT</span>
                    <span className="text-xl font-black text-white">12 MIN</span>
                </div>
            </div>
        </div>
      </div>

      <footer className="mt-12 text-center">
         <div className="flex items-center justify-center gap-8 opacity-30">
            <Clock size={16} className="text-slate-400" />
            <Activity size={16} className="text-slate-400" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bharat Health Bridge Queue System · Alpha v2.0</div>
         </div>
      </footer>
    </div>
  );
}
