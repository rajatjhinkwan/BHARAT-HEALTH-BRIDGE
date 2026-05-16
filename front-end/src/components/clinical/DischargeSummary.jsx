import React from 'react';
import { FileText, Printer, CheckCircle, User, Calendar, ShieldCheck } from 'lucide-react';

export default function DischargeSummary({ patient }) {
  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="discharge-summary-container p-8 max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl my-8 border border-slate-100">
      <div className="flex justify-between items-center mb-8 no-print">
         <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Discharge Summary</h1>
         <button onClick={handlePrint} className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>
            <Printer size={18} /> Print Summary
         </button>
      </div>

      <div className="discharge-summary-layout printable">
        {/* Header */}
        <div className="flex justify-between border-b-4 border-primary pb-6 mb-8">
           <div>
              <h2 className="text-primary" style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>BHARAT HEALTH BRIDGE</h2>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 m-0 uppercase">Multi-Speciality Tertiary Care Hospital</p>
           </div>
           <div className="text-right">
              <div className="font-black text-sm">{new Date().toLocaleDateString()}</div>
              <div className="text-[10px] font-bold text-slate-400">REF: {patient.mrn}/DS</div>
           </div>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
           <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">PATIENT NAME</span> <span className="font-black">{patient.patientName}</span></div>
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">UHID / MRN</span> <span className="font-black">{patient.mrn}</span></div>
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">AGE / GENDER</span> <span className="font-black">{patient.age}Y / {patient.gender}</span></div>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">ADMISSION DATE</span> <span className="font-black">{new Date(patient.admissionDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">DISCHARGE DATE</span> <span className="font-black">{new Date().toLocaleDateString()}</span></div>
              <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">PRIMARY DOCTOR</span> <span className="font-black">{patient.assignedDoctor || 'Dr. Aryan'}</span></div>
           </div>
        </div>

        {/* Clinical Summary */}
        <div className="space-y-8">
           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary-light pb-2 mb-4">Diagnosis & History</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                 Patient presented with symptoms of acute respiratory distress and was managed in the {patient.currentWard || 'General Ward'}. 
                 Baseline investigations revealed moderate viral pneumonia.
              </p>
           </section>

           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary-light pb-2 mb-4">Treatment Provided</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                 The patient underwent intensive clinical management including oxygen therapy and broad-spectrum antibiotics. 
                 Vitals remained stable throughout the observation period. 
                 Last recorded SpO2: {patient.vitals?.spo2 || '98'}% on Room Air.
              </p>
           </section>

           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary-light pb-2 mb-4">Medications on Discharge</h3>
              <div className="grid grid-cols-1 gap-2">
                 <div className="p-3 bg-slate-50 rounded-lg text-xs font-bold flex justify-between">
                    <span>Tab. Azithromycin 500mg</span>
                    <span className="text-slate-400">1-0-0 x 5 Days</span>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-lg text-xs font-bold flex justify-between">
                    <span>Tab. Vitamin C 500mg</span>
                    <span className="text-slate-400">0-1-0 x 10 Days</span>
                 </div>
              </div>
           </section>

           <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary-light pb-2 mb-4">Follow-up Instructions</h3>
              <p className="text-sm text-slate-700 font-bold">
                 Review in OPD with Dr. Aryan after 7 days. Report immediately to ER if fever recurs or breathlessness increases.
              </p>
           </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-end">
           <div className="text-center">
              <div style={{ height: 60 }} className="mb-2"></div>
              <div className="w-40 border-t-2 border-slate-200 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Medical Superintendent</div>
           </div>
           <div className="text-center">
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-2">
                 <ShieldCheck size={40} className="text-primary opacity-20" />
              </div>
              <div className="w-40 border-t-2 border-slate-200 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Treating Consultant</div>
           </div>
        </div>
      </div>
    </div>
  );
}
