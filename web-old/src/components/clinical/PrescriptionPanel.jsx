import React from 'react';
import { Plus, X } from 'lucide-react';

const PrescriptionPanel = ({ structuredMeds, setStructuredMeds }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">Prescription Console</h5>
        <button 
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1" 
          onClick={() => setStructuredMeds([...structuredMeds, { name: '', dose: '', freq: 'TID', days: '' }])}
        >
          <Plus size={12} /> ADD ROW
        </button>
      </div>
      <div className="space-y-3">
        {structuredMeds.map((med, i) => (
          <div key={i} className="medicine-card-advanced border-none shadow-sm !p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold text-slate-300">ITEM {i + 1}</span>
              <button 
                onClick={() => setStructuredMeds(structuredMeds.filter((_, idx) => idx !== i))} 
                className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="space-y-3">
              <input 
                placeholder="Medication Name" 
                className="structured-input !text-xs !py-2" 
                value={med.name} 
                onChange={(e) => {
                  const newMeds = [...structuredMeds];
                  newMeds[i].name = e.target.value;
                  setStructuredMeds(newMeds);
                }} 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  placeholder="Dose" 
                  className="structured-input !py-1.5 !text-[10px]" 
                  value={med.dose} 
                  onChange={(e) => {
                    const newMeds = [...structuredMeds];
                    newMeds[i].dose = e.target.value;
                    setStructuredMeds(newMeds);
                  }} 
                />
                <input 
                  placeholder="Days" 
                  className="structured-input !py-1.5 !text-[10px]" 
                  value={med.days} 
                  onChange={(e) => {
                    const newMeds = [...structuredMeds];
                    newMeds[i].days = e.target.value;
                    setStructuredMeds(newMeds);
                  }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionPanel;
