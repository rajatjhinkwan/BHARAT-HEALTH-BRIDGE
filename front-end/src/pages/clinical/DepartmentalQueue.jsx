import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, CheckCircle2, Play, AlertCircle, 
  Search, Filter, ChevronRight, Activity, MapPin,
  Calendar, ArrowRight, UserCheck, Timer, LogOut,
  BarChart3, Zap, ShieldCheck, Heart, Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const DepartmentalQueue = () => {
  const { user } = useAuth();
  const department = user?.department || "General Ward";
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Waiting');
  const [servingNow, setServingNow] = useState(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // Faster refresh for ward management
    return () => clearInterval(interval);
  }, [department]);

  const fetchQueue = async () => {
    try {
      // Normalizing the URL to use the global API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        // The endpoint returns { waiting, inConsultation, completed }
        // We map this to the departmental view logic
        const allQueue = [...data.waiting, ...data.inConsultation, ...data.completed];
        setQueue(allQueue);
        const inProgress = data.inConsultation[0] || null;
        setServingNow(inProgress);
      }
      setLoading(false);
    } catch (err) {
      console.error("Queue Fetch Error:", err);
      setLoading(false);
    }
  };

  const updateStatus = async (queueId, newStatus) => {
    try {
      // Standardizing with the workflow API
      const endpoint = newStatus === 'COMPLETED' ? `complete/${queueId}` : `call-next/${user._id}`;
      const response = await fetch(`${API_BASE_URL}/workflow/queue/${endpoint}`, {
        method: 'PATCH',
      });
      if (response.ok) fetchQueue();
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  const getFilteredQueue = () => {
    if (activeTab === 'Waiting') return queue.filter(item => item.status === 'WAITING');
    if (activeTab === 'Active') return queue.filter(item => item.status === 'IN_CONSULTATION');
    if (activeTab === 'Completed') return queue.filter(item => item.status === 'COMPLETED');
    return queue;
  };

  return (
    <div className="dept-queue-console bg-[#050810] min-h-screen p-8 text-slate-300 font-sans">
      
      {/* HEADER: OPERATIONAL SUMMARY */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
            <MapPin size={32} className="text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Ward Operations</span>
              <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 Telemetry Live
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">{department} Console</h1>
            <p className="text-slate-500 font-bold text-xs mt-1">Operator: Dr. {user?.name} · Managed Ward Lifecycle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
           <div className="flex items-center gap-3 bg-white/5 p-4 px-6 rounded-[24px] border border-white/5">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Waiting</p>
                 <p className="text-xl font-black text-white">{queue.filter(p => p.status === 'WAITING').length}</p>
              </div>
              <div className="h-8 w-px bg-white/10 mx-2"></div>
              <div className="text-left">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Throughput</p>
                 <p className="text-xl font-black text-blue-500">88%</p>
              </div>
           </div>
           <button onClick={fetchQueue} className="p-4 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* MAIN OPERATIONS PANEL */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* SERVING NOW: IMMERSIVE HIGHLIGHT */}
          <AnimatePresence mode='wait'>
            {servingNow ? (
              <motion.div 
                key={servingNow.queueId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-600 rounded-[56px] p-12 text-white shadow-[0_40px_100px_rgba(37,99,235,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                <div className="absolute -right-20 -bottom-20 p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                  <Activity size={500} />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                         <div className="px-5 py-2 bg-white/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] backdrop-blur-xl border border-white/10">Active Procedure</div>
                         <div className="h-2 w-2 rounded-full bg-white animate-ping"></div>
                      </div>
                      <h2 className="text-6xl font-black italic tracking-tighter leading-none mb-4">{servingNow.patientName}</h2>
                      <div className="flex items-center gap-4 text-white/70 font-black text-xs uppercase tracking-widest">
                         <span>UHID: {servingNow.mrn}</span>
                         <div className="h-1 w-1 rounded-full bg-white/30"></div>
                         <span>TOKEN: {servingNow.tokenNumber}</span>
                      </div>
                    </div>
                    <div className="w-24 h-24 rounded-[32px] bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-2xl shadow-2xl group-hover:rotate-12 transition-transform">
                      <UserCheck size={48} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => updateStatus(servingNow.queueId, 'COMPLETED')}
                      className="px-10 py-5 bg-white text-blue-600 rounded-[24px] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center gap-3"
                    >
                      <CheckCircle2 size={18} /> Finalize Session
                    </button>
                    <button className="px-10 py-5 bg-white/10 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10">
                      Sync Diagnostics
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[56px] p-20 text-center flex flex-col items-center justify-center grayscale opacity-40">
                 <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center mb-6">
                    <Zap size={32} />
                 </div>
                 <h4 className="text-sm font-black text-white uppercase tracking-[0.4em]">System Idle</h4>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Ready for incoming clinical workflow</p>
              </div>
            )}
          </AnimatePresence>

          {/* QUEUE CONTROL CENTER */}
          <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[56px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-3 p-2 bg-black/40 rounded-[24px] border border-white/5">
                {['Waiting', 'Active', 'Completed'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative group w-full md:w-auto">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input placeholder="Search telemetry..." className="w-full md:w-72 pl-16 pr-8 py-4 bg-slate-950 border border-white/5 rounded-[24px] text-xs font-bold text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-800" />
              </div>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {loading ? (
                <div className="p-32 text-center text-slate-600 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Initializing Streams...</div>
              ) : getFilteredQueue().length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center mb-6">
                    <Inbox size={32} className="text-slate-700" />
                  </div>
                  <p className="font-black text-white uppercase tracking-[0.3em] text-xs">Queue Optimized</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2 leading-relaxed">No pending clinical actions detected for this ward.</p>
                </div>
              ) : getFilteredQueue().map((item, idx) => (
                <div key={item.queueId} className="p-8 hover:bg-white/[0.02] transition-colors flex items-center justify-between group relative overflow-hidden">
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-700 font-black text-xl italic group-hover:text-blue-500 transition-colors border border-white/5">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div>
                      <div className="font-black text-white text-xl flex items-center gap-4 italic tracking-tight">
                        {item.patientName}
                        {item.priorityLevel === 'CRITICAL' && (
                           <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[8px] font-black rounded-lg border border-red-500/20 tracking-[0.2em] animate-pulse">CRITICAL</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-2 flex items-center gap-3">
                        <span className="bg-white/5 px-3 py-1 rounded-lg">MRN: {item.mrn}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                        <span>Arrival {item.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10 relative z-10">
                    <div className="hidden xl:flex flex-col items-end">
                      <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                        <Timer size={14} className="text-blue-500" />
                        {item.waitTime || '12'}m
                      </div>
                      <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">Dwell Time</div>
                    </div>
                    
                    {item.status === 'WAITING' && (
                      <button 
                        onClick={() => updateStatus(item.queueId, 'IN_CONSULTATION')}
                        className="px-8 py-4 bg-slate-950 border border-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-3 shadow-2xl"
                      >
                        <Play size={14} fill="currentColor" /> Initialize
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: WARD TELEMETRY */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[56px] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
               <BarChart3 size={120} />
            </div>
            <h3 className="font-black text-white text-xl uppercase tracking-wider italic mb-10 flex items-center gap-4">
              <Activity size={24} className="text-blue-500" />
              Ward Analytics
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Patient Density', value: '72%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Clinical Throughput', value: '88%', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
                { label: 'Bed Utilization', value: '94%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Avg Procedure Time', value: '24m', icon: Timer, color: 'text-amber-500', bg: 'bg-amber-500/10' }
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between p-6 bg-slate-950 rounded-[32px] border border-white/5 group hover:border-blue-500/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} border border-current/10 shadow-inner group-hover:scale-110 transition-transform`}>
                      <stat.icon size={22} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black text-white tracking-tight italic">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[56px] p-10 text-white relative overflow-hidden shadow-[0_30px_60px_rgba(37,99,235,0.2)]">
            <div className="absolute inset-0 bg-black/10"></div>
            <h3 className="font-black text-2xl mb-4 relative z-10 italic uppercase">System Alerts</h3>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8 relative z-10">
              Operational load is entering peak phase. Ensure all clinical data buffers are synced with BHB-Core.
            </p>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden relative z-10 border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
              />
            </div>
            <div className="flex justify-between items-center mt-4 relative z-10">
               <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Load Coefficient: 0.82</span>
               <div className="h-2 w-2 rounded-full bg-white animate-ping"></div>
            </div>
            <Droplets className="absolute -right-6 -bottom-6 text-white/5 w-40 h-40" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        .dept-queue-console {
          font-family: 'Outfit', sans-serif;
          background-image: 
            radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.05) 0, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0, transparent 50%);
        }
      `}} />
    </div>
  );
};

const RefreshCw = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default DepartmentalQueue;
