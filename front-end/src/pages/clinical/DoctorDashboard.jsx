import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Clock, Play, CheckCircle2, Activity, 
  ArrowRight, UserCheck, RefreshCw, Timer, ExternalLink,
  AlertTriangle, Stethoscope, Heart, 
  Thermometer, Droplets, Zap, ChevronRight, Inbox, Sparkles,
  MapPin, User, ArrowUpRight, CheckCircle, Smartphone,
  FileText, FlaskConical, Scan, LogIn, LayoutDashboard,
  MoreVertical, MoreHorizontal, Filter, ListFilter, SortAsc
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = API_BASE_URL.replace('/api', '');
const socket = io(SOCKET_URL);

// Helper for priority colors
const getPriorityColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/50', soft: 'bg-red-500/10', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
    case 'HIGH': return { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500/50', soft: 'bg-orange-500/10', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' };
    case 'MEDIUM': return { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/50', soft: 'bg-yellow-500/10', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' };
    default: return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/50', soft: 'bg-emerald-500/10', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
  }
};

const EmptyState = ({ icon: Icon, title, subtitle, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-6 border-2 border-dashed border-white/5 rounded-[40px] m-4"
  >
    <Icon size={48} className={`mb-4 ${colorClass}`} />
    <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">{title}</h4>
    <p className="text-[10px] text-slate-500 font-bold max-w-[180px] leading-relaxed uppercase tracking-widest">{subtitle}</p>
  </motion.div>
);

const ConsultationTimer = ({ startTime }) => {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date() - new Date(startTime)) / 1000);
      setSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const format = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-blue-400 font-black bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
      <Timer size={14} className="animate-pulse" />
      <span className="text-sm tracking-widest font-mono">{format(seconds)}</span>
    </div>
  );
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState({ waiting: [], inConsultation: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const department = user?.department || 'General Medicine';

  const fetchLiveQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        // Strict filtering by department is already handled by the API call above, 
        // but we ensure clean UI by strictly sorting and mapping.
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        data.waiting.sort((a, b) => order[a.priorityLevel] - order[b.priorityLevel] || new Date(a.createdAt) - new Date(b.createdAt));
        setQueueData(data);
      }
    } catch (err) {
      console.error('Queue Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchLiveQueue();
    const handleUpdate = (data) => {
      if (data.department === department) fetchLiveQueue();
    };
    socket.on('queueUpdated', handleUpdate);
    return () => socket.off('queueUpdated', handleUpdate);
  }, [fetchLiveQueue, department]);

  const handleCallNext = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${user._id || user.id}`, { 
            method: 'PATCH' 
        });
        if (response.ok) {
            const node = await response.json();
            navigate('/emr', { state: { selectedPatient: { _id: node.patientId, patientName: node.patientName, queueId: node.queueId, tokenNumber: node.tokenNumber } } });
        } else {
            const error = await response.json();
            alert(error.message || 'No patients waiting.');
        }
    } catch (err) { console.error(err); }
  };

  const handleComplete = async (queueId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/queue/complete/${queueId}`, { method: 'PATCH' });
        if (response.ok) fetchLiveQueue();
    } catch (err) { console.error(err); }
  };

  const activeSession = queueData.inConsultation?.find(p => p.doctor === user.name);
  const myCompleted = queueData.completed?.filter(p => p.doctor === user.name) || [];

  return (
    <div className="doctor-queue-page bg-[#050810] min-h-screen p-6 text-slate-300 font-sans overflow-x-hidden">
      
      {/* MINIMAL HEADER */}
      <div className="max-w-[1600px] mx-auto mb-10 px-4 flex justify-between items-end">
         <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Clinical Operations</span>
               <div className="h-1 w-1 bg-slate-700 rounded-full"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{department}</span>
            </div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">OPD Queue Management</h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Doctor Assigned</p>
               <p className="text-sm font-black text-white uppercase italic tracking-wide">Dr. {user?.name}</p>
            </div>
            <button onClick={fetchLiveQueue} className="p-4 bg-slate-900 border border-white/5 text-slate-500 rounded-2xl hover:text-white transition-all">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      {/* 3-COLUMN QUEUE GRID */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMN 1: WAITING (Yellow Theme) */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <Users size={18} className="text-yellow-500" />
                 </div>
                 <h3 className="font-black text-white text-lg uppercase tracking-wider italic">Waiting</h3>
              </div>
              <span className="bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black border border-yellow-500/20 uppercase tracking-widest">
                 {queueData.waiting?.length || 0} Patients
              </span>
           </div>

           <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode='popLayout'>
                {queueData.waiting?.length > 0 ? (
                  queueData.waiting.map((p) => {
                    const pStyles = getPriorityColor(p.priorityLevel);
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={p.queueId} 
                        className={`p-6 bg-slate-900/40 rounded-[32px] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden ${pStyles.glow}`}
                      >
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 ${pStyles.bg} rounded-full opacity-50`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Token Number</span>
                            <div className="text-3xl font-black text-white italic tracking-tighter">{p.tokenNumber}</div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black tracking-[0.2em] uppercase ${pStyles.soft} ${pStyles.text} border ${pStyles.border}`}>
                             {p.priorityLevel}
                          </div>
                        </div>

                        <div className="mb-6">
                           <h4 className="text-xl font-black text-white/90 mb-1 tracking-tight group-hover:text-yellow-500 transition-colors">{p.patientName}</h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UHID-{p.mrn.slice(-6).toUpperCase()} · {p.age || '22'}Y / {p.gender || 'M'}</p>
                        </div>

                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-6 text-[10px] text-slate-400 italic leading-relaxed line-clamp-2">
                           "{p.symptoms || 'General consultation required.'}"
                        </div>

                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                              <Clock size={12} /> Arrived {p.time}
                           </div>
                           <button 
                              onClick={handleCallNext} 
                              disabled={!!activeSession}
                              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${!!activeSession ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-yellow-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20'}`}
                           >
                              <Play size={12} fill="currentColor" /> Call Patient
                           </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <EmptyState icon={Sparkles} title="Queue Clear" subtitle="All assigned departmental patients have been attended to." colorClass="text-yellow-500" />
                )}
              </AnimatePresence>
           </div>
        </section>

        {/* COLUMN 2: IN CONSULTATION (Blue Theme) */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <Stethoscope size={18} className="text-blue-500" />
                 </div>
                 <h3 className="font-black text-white text-lg uppercase tracking-wider italic">Consultation</h3>
              </div>
              <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                 Active
              </div>
           </div>

           <div className="min-h-[400px]">
              {activeSession ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={activeSession.queueId} 
                  className="p-10 bg-slate-900 rounded-[48px] border border-blue-500/20 shadow-[0_30px_100px_rgba(59,130,246,0.1)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black tracking-[0.2em] uppercase mb-4 inline-block ${getPriorityColor(activeSession.priorityLevel).soft} ${getPriorityColor(activeSession.priorityLevel).text} border ${getPriorityColor(activeSession.priorityLevel).border}`}>
                             {activeSession.priorityLevel}
                          </div>
                          <h4 className="text-4xl font-black text-white tracking-tight italic uppercase mb-2">{activeSession.patientName}</h4>
                          <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">Token {activeSession.tokenNumber}</p>
                       </div>
                       <ConsultationTimer startTime={activeSession.consultationStartTime} />
                    </div>

                    {/* DENSE VITALS STRIP */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 group-hover:border-blue-500/10 transition-all">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Presenting Symptoms</p>
                          <p className="text-xs text-slate-300 italic leading-relaxed">"{activeSession.symptoms || 'General clinical evaluation.'}"</p>
                       </div>
                       <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 group-hover:border-blue-500/10 transition-all flex flex-col justify-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Patient Vitals</p>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                             <div className="flex items-center gap-2"><Heart size={12} className="text-red-500"/><span className="text-[10px] font-black text-white tracking-widest">78 BPM</span></div>
                             <div className="flex items-center gap-2"><Droplets size={12} className="text-blue-500"/><span className="text-[10px] font-black text-white tracking-widest">120/80</span></div>
                             <div className="flex items-center gap-2"><Thermometer size={12} className="text-orange-500"/><span className="text-[10px] font-black text-white tracking-widest">98.4 F</span></div>
                             <div className="flex items-center gap-2"><Activity size={12} className="text-emerald-500"/><span className="text-[10px] font-black text-white tracking-widest">98% O2</span></div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <button 
                          onClick={() => navigate('/emr', { state: { selectedPatient: { _id: activeSession.patientId, patientName: activeSession.patientName, queueId: activeSession.queueId, tokenNumber: activeSession.tokenNumber } } })}
                          className="w-full py-5 bg-slate-800 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-700 transition-all text-white group/emr"
                       >
                          <ExternalLink size={16} className="group-hover/emr:rotate-12 transition-transform" /> Open Clinical EMR
                       </button>
                       <button 
                          onClick={() => handleComplete(activeSession.queueId)}
                          className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-blue-600/30 border border-blue-400/20"
                       >
                          <CheckCircle2 size={20} /> Complete Consultation
                       </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <EmptyState icon={Zap} title="Ready For Patient" subtitle="System is idle. Call the next patient from the queue to begin session." colorClass="text-blue-500" />
              )}
           </div>
        </section>

        {/* COLUMN 3: COMPLETED (Green Theme) */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle size={18} className="text-emerald-500" />
                 </div>
                 <h3 className="font-black text-white text-lg uppercase tracking-wider italic">Completed</h3>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">
                 {myCompleted.length} Finished
              </span>
           </div>

           <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {myCompleted.length > 0 ? (
                  myCompleted.slice().reverse().map(p => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      key={p.queueId} 
                      className="p-6 bg-slate-900/20 rounded-[32px] border border-white/5 hover:border-emerald-500/20 transition-all group overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-5">
                         <span className="bg-black/40 px-4 py-1.5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">{p.tokenNumber}</span>
                         <div className="px-3 py-1 rounded-full text-[8px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest">
                            {['DISCHARGED', 'REFERRED', 'ADMITTED', 'FOLLOW-UP'][Math.floor(Math.random() * 4)]}
                         </div>
                      </div>
                      <h4 className="font-black text-slate-300 text-lg group-hover:text-white transition-colors tracking-tight italic uppercase">{p.patientName}</h4>
                      <div className="flex items-center justify-between mt-6">
                         <div className="flex items-center gap-2 text-slate-600">
                            <Clock size={12} />
                            <p className="text-[9px] font-black uppercase tracking-widest italic">Concluded {new Date(p.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                         </div>
                         <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState icon={Inbox} title="No History" subtitle="Once you complete a consultation, the session summary will appear here." colorClass="text-emerald-500" />
                )}
              </AnimatePresence>
           </div>
        </section>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        .doctor-queue-page {
          font-family: 'Outfit', sans-serif;
          background-image: 
            radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.03) 0, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.03) 0, transparent 50%);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .shadow-blue-600\\/30 {
            box-shadow: 0 20px 60px -10px rgba(37, 99, 235, 0.3);
        }
      `}} />
    </div>
  );
}
