import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, CheckCircle2, Play, AlertCircle, 
  Search, Filter, ChevronRight, Activity, MapPin,
  Calendar, ArrowRight, UserCheck, Timer, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DepartmentalQueue = () => {
  const { user, logout } = useAuth();
  const department = user?.department || "General Queue";
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Waiting');
  const [servingNow, setServingNow] = useState(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [department]);

  const fetchQueue = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/queue/${encodeURIComponent(department)}`);
      const data = await response.json();
      setQueue(data);
      const inProgress = data.find(p => p.status === 'In Progress');
      if (inProgress) setServingNow(inProgress);
      setLoading(false);
    } catch (err) {
      console.error("Queue Fetch Error:", err);
      setLoading(false);
    }
  };

  const updateStatus = async (queueId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:4000/api/queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchQueue();
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (activeTab === 'Waiting') return item.status === 'Waiting';
    if (activeTab === 'In Progress') return item.status === 'In Progress';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{department} Ward</h1>
          </div>
          <p className="text-slate-500 font-medium">Logged in as <span className="text-primary font-bold">{user?.name}</span> · Real-time flow management.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-2 text-center border-r border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Waiting</div>
            <div className="text-xl font-bold text-slate-900">{queue.filter(p => p.status === 'Waiting').length}</div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Wait Time</div>
            <div className="text-xl font-bold text-slate-900">14m</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Queue Column */}
        <div className="col-span-8 space-y-8">
          {/* Serving Now Highlight */}
          {servingNow && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">NOW SERVING</span>
                    <h2 className="text-4xl font-bold mt-4">{servingNow.patientName}</h2>
                    <p className="text-white/70 font-medium mt-1">MRN: {servingNow.mrn} · {servingNow.priority} Priority</p>
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <UserCheck size={40} />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => updateStatus(servingNow.queueId, 'Completed')}
                    className="px-8 py-3 bg-white text-primary rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Complete Procedure
                  </button>
                  <button className="px-8 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all backdrop-blur-md">
                    View Clinical Notes
                  </button>
                </div>
              </div>
              <Activity className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64" />
            </motion.div>
          )}

          {/* Queue List Controls */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                {['Waiting', 'In Progress', 'All'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input placeholder="Search queue..." className="pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 ring-primary/20 w-64" />
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-20 text-center text-slate-400">Loading queue...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={24} />
                  </div>
                  <p className="font-bold">Queue is currently empty</p>
                  <p className="text-xs">New referrals will appear here automatically.</p>
                </div>
              ) : filteredQueue.map((item, idx) => (
                <div key={item.queueId} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {item.patientName}
                        {item.priority === 'Urgent' && <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded-full uppercase">URGENT</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-1">
                        MRN: {item.mrn} · Referred by {item.referringDoctor} · {item.time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                        <Timer size={14} className="text-slate-300" />
                        {item.waitTime || '12'}m
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Wait Time</div>
                    </div>
                    
                    {item.status === 'Waiting' && (
                      <button 
                        onClick={() => updateStatus(item.queueId, 'In Progress')}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                      >
                        <Play size={14} /> Start Service
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Operational Insights
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Patient Turnaround', value: '28m', icon: <Clock />, color: '#3b82f6' },
                { label: 'Equipment Load', value: '64%', icon: <Activity />, color: '#10b981' },
                { label: 'Pending Results', value: '12', icon: <Filter />, color: '#f59e0b' }
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                      {stat.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
            <h3 className="font-bold mb-4 relative z-10">Department Capacity</h3>
            <p className="text-white/50 text-xs leading-relaxed mb-6 relative z-10">
              Current operational load is at 82%. Consider reassigning staff for peak hours.
            </p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-primary w-[82%]" />
            </div>
            <MapPin className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentalQueue;
