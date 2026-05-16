import React from 'react';
import HospitalMetrics from '../../components/clinical/HospitalMetrics';
import ActivityFeed from '../../components/clinical/ActivityFeed';
import { Activity, ShieldAlert, Zap, Bell } from 'lucide-react';

const LiveHospitalFeed = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
      <header className="flex justify-between items-center mb-10 bg-slate-900/50 backdrop-blur-xl p-8 rounded-[40px] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 shadow-inner">
            <Activity className="text-primary" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Hospital Operations</span>
              <div className="h-1 w-1 rounded-full bg-slate-700"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Global Metrics</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Live Hospital Feed
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl border border-red-500/20">
                <ShieldAlert size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Emergency Active</span>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 relative">
                <Bell size={20} className="text-slate-400" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-slate-900"></div>
            </div>
        </div>
      </header>

      <div className="mb-10">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <Zap size={14} className="text-amber-500" /> Real-time Hospital Analytics
        </h2>
        <HospitalMetrics />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-slate-900/40 rounded-[48px] border border-slate-800/50 p-8 backdrop-blur-md">
            <ActivityFeed />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .live-feed-container {
          background-image: 
            radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.05) 0, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0, transparent 50%);
        }
      `}} />
    </div>
  );
};

export default LiveHospitalFeed;
