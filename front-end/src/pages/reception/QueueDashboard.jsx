import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Clock, Play, CheckCircle2, Activity, 
  ArrowRight, UserCheck, RefreshCw, Timer, ExternalLink,
  AlertTriangle, Stethoscope, MapPin, User, Search,
  LayoutGrid, BarChart3, Bell, ShieldCheck, Heart, Sparkles, Inbox,
  SortAsc, Filter, ListFilter
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = API_BASE_URL.replace('/api', '');
const socket = io(SOCKET_URL);

const getPriorityColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return { bg: 'bg-red-500', text: 'text-red-500', soft: 'bg-red-50', border: 'border-red-100' };
    case 'HIGH': return { bg: 'bg-orange-500', text: 'text-orange-500', soft: 'bg-orange-50', border: 'border-orange-100' };
    case 'MEDIUM': return { bg: 'bg-amber-500', text: 'text-amber-500', soft: 'bg-amber-50', border: 'border-amber-100' };
    default: return { bg: 'bg-emerald-500', text: 'text-emerald-500', soft: 'bg-emerald-50', border: 'border-emerald-100' };
  }
};

const MetricCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex-1 min-w-[240px]">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <div className="flex items-baseline gap-3">
      <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
      {subtext && <span className="text-xs font-bold text-slate-400">{subtext}</span>}
    </div>
  </div>
);

export default function QueueDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState({ waiting: [], inConsultation: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(user?.department || 'General Medicine');

  const departments = [
    "General Medicine", "Cardiology", "Neurology", "Nephrology", 
    "Orthopedics", "ENT", "Dermatology", "Pediatrics", 
    "Gynecology", "Psychiatry", "Radiology", "Oncology", 
    "Pulmonology", "Urology", "Gastroenterology", "Endocrinology", 
    "Ophthalmology", "Emergency"
  ];

  const fetchLiveQueue = useCallback(async () => {
    try {
      const deptQuery = (user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') ? selectedDept : user?.department;
      if (!deptQuery) return;

      const response = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(deptQuery)}`);
      if (response.ok) {
        const data = await response.json();
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        data.waiting.sort((a, b) => order[a.priorityLevel] - order[b.priorityLevel] || new Date(a.createdAt) - new Date(b.createdAt));
        setQueueData(data);
      }
    } catch (err) {
      console.error('Queue Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, user?.department, user?.role]);

  useEffect(() => {
    fetchLiveQueue();
    const handleUpdate = (data) => {
      const deptQuery = (user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') ? selectedDept : user?.department;
      if (data.department === deptQuery) fetchLiveQueue();
    };
    socket.on('queueUpdated', handleUpdate);
    return () => socket.off('queueUpdated', handleUpdate);
  }, [fetchLiveQueue, selectedDept, user?.department, user?.role]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-8 font-sans text-slate-700">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedDept} Queue</h1>
              <p className="text-slate-500 font-medium mt-1 uppercase tracking-[0.2em] text-[10px]">Real-time OPD Flow Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') && (
               <select 
                 value={selectedDept} 
                 onChange={(e) => setSelectedDept(e.target.value)}
                 className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500 transition-all min-w-[240px] appearance-none"
               >
                 {departments.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
             )}
             <button onClick={fetchLiveQueue} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200">
               <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </header>

        {/* METRICS */}
        <div className="flex flex-wrap gap-6">
           <MetricCard icon={Clock} label="Waiting Now" value={queueData.waiting?.length || 0} subtext="Average 14m" colorClass="bg-orange-50 text-orange-500" />
           <MetricCard icon={Activity} label="In Progress" value={queueData.inConsultation?.length || 0} subtext="3 Active Rooms" colorClass="bg-blue-50 text-blue-500" />
           <MetricCard icon={CheckCircle2} label="Completed" value={queueData.completed?.length || 0} subtext="Last 24 hours" colorClass="bg-emerald-50 text-emerald-500" />
           <MetricCard icon={Heart} label="Clinical Load" value="High" subtext="System Alert" colorClass="bg-red-50 text-red-500" />
        </div>

        {/* MAIN 3-COLUMN LOBBY VIEW */}
        <div className="grid grid-cols-12 gap-8">
           
           {/* WAITING LIST (4 cols) */}
           <div className="col-span-4 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 min-h-[800px]">
              <div className="flex justify-between items-center mb-10 px-2">
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-3">
                   <Clock className="text-orange-500" size={24} /> Waiting List
                </h3>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl text-sm font-bold">{(queueData.waiting || []).length}</span>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                  {(queueData.waiting || []).length > 0 ? (
                    queueData.waiting.map((p, idx) => {
                      const pColors = getPriorityColor(p.priorityLevel);
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={p.queueId} 
                          className="p-6 bg-white rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pColors.bg}`}></div>
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${pColors.soft} ${pColors.text} flex items-center justify-center font-bold text-lg border border-slate-50`}>
                                   {p.tokenNumber.slice(-3)}
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-900 text-lg mb-1">{p.patientName}</h4>
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">UHID-{p.mrn.slice(-5)}</p>
                                </div>
                             </div>
                             <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest ${pColors.soft} ${pColors.text} border ${pColors.border} uppercase`}>
                                {p.priorityLevel}
                             </span>
                          </div>
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                             <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <Clock size={12} /> Arrived {p.time}
                             </div>
                             <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{selectedDept}</div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                      <Inbox size={64} />
                      <p className="font-bold text-xs uppercase tracking-[0.3em] mt-4">Queue Clear</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
           </div>

           {/* IN CONSULTATION (4 cols) */}
           <div className="col-span-4 bg-blue-50/50 rounded-[32px] border border-blue-100 shadow-sm p-8 min-h-[800px]">
              <div className="flex justify-between items-center mb-10 px-2">
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-3">
                   <Activity className="text-blue-500" size={24} /> In Consultation
                </h3>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-sm font-bold">{(queueData.inConsultation || []).length}</span>
              </div>

              <div className="space-y-6">
                {(queueData.inConsultation || []).length > 0 ? (
                  queueData.inConsultation.map(p => (
                    <motion.div 
                      layout
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={p.queueId} 
                      className="p-8 bg-white rounded-[32px] border border-blue-200 shadow-xl shadow-blue-500/5 relative"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <span className="bg-blue-600 text-white px-6 py-2 rounded-2xl text-xl font-bold italic tracking-tighter">T{p.tokenNumber.slice(-2)}</span>
                        <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 text-xs">
                          <Timer size={14} className="animate-pulse" /> 12:42
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Live Session</p>
                        <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{p.patientName}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <ShieldCheck size={14} className="text-emerald-500" />
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Dr. {p.doctor}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
                         <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase">Consulting</span>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Room</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase">Room B-4</span>
                         </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <Activity size={64} className="animate-pulse" />
                    <p className="font-bold text-xs uppercase tracking-[0.3em] mt-4">System Idle</p>
                  </div>
                )}
              </div>
           </div>

           {/* COMPLETED (4 cols) */}
           <div className="col-span-4 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 min-h-[800px]">
              <div className="flex justify-between items-center mb-10 px-2">
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-3">
                   <CheckCircle2 className="text-emerald-500" size={24} /> Concluded
                </h3>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl text-sm font-bold">{(queueData.completed || []).length}</span>
              </div>

              <div className="space-y-4">
                {(queueData.completed || []).slice(0, 10).map(p => (
                  <div key={p.queueId} className="p-6 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:border-emerald-100 transition-all group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl text-[10px] font-black text-slate-500 tracking-widest italic">T-{p.tokenNumber.slice(-1)}</span>
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-emerald-100 uppercase">Concluded</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">{p.patientName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Attended by Dr. {p.doctor}</p>
                  </div>
                ))}
                {(queueData.completed || []).length === 0 && (
                   <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <CheckCircle2 size={64} />
                    <p className="font-bold text-xs uppercase tracking-[0.3em] mt-4">History Empty</p>
                  </div>
                )}
              </div>
           </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
          background-color: #F8FAFC;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
