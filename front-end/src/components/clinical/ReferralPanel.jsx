import React from 'react';
import { Share2, Image as ImageIcon, Droplets, Activity, Scissors, Heart, TestTube, ChevronRight, User, Stethoscope } from 'lucide-react';

const ReferralPanel = ({ handleReferral }) => {
  const departments = [
    { name: "General Medicine", icon: <Stethoscope size={32} />, color: "#64748b", desc: "Routine checkups & general health" },
    { name: "Cardiology", icon: <Heart size={32} />, color: "#ef4444", desc: "Heart & vascular diagnosis" },
    { name: "Neurology", icon: <Activity size={32} />, color: "#8b5cf6", desc: "Brain & nervous system" },
    { name: "Orthopedics", icon: <Scissors size={32} />, color: "#f59e0b", desc: "Bone, joint & muscle care" },
    { name: "ENT", icon: <Activity size={32} />, color: "#14b8a6", desc: "Ear, Nose, & Throat" },
    { name: "Pediatrics", icon: <User size={32} />, color: "#10b981", desc: "Children's health & development" },
    { name: "Dermatology", icon: <Activity size={32} />, color: "#f97316", desc: "Skin & hair treatments" },
    { name: "Laboratory", icon: <TestTube size={32} />, color: "#ec4899", desc: "Lab tests & sample analysis" },
    { name: "Radiology", icon: <ImageIcon size={32} />, color: "#3b82f6", desc: "Medical imaging & X-ray reports" },
    { name: "Emergency", icon: <Activity size={32} />, color: "#b91c1c", desc: "Critical & emergency care" },
    { name: "Psychiatry", icon: <Activity size={32} />, color: "#6366f1", desc: "Mental health & counseling" },
    { name: "Oncology", icon: <Activity size={32} />, color: "#7c3aed", desc: "Cancer treatment & care" }
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Share2 size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Departmental Referral</h3>
            <p className="text-sm text-slate-400">Select a department to refer the patient for further evaluation.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {departments.map(dept => (
            <button 
              key={dept.name} 
              className="p-6 bg-white rounded-3xl border border-slate-100 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group text-left" 
              onClick={() => handleReferral(dept.name)}
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" 
                style={{ background: `${dept.color}10`, color: dept.color }}
              >
                {dept.icon}
              </div>
              <div className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{dept.name}</div>
              <div className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">{dept.desc}</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                REFER NOW <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferralPanel;
