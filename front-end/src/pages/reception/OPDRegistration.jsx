import React, { useState } from 'react';
import { 
  UserPlus, Hash, FileText, CheckCircle, Clock, Activity, 
  User, Phone, MapPin, Calendar, Droplets, Info, ArrowRight, Fingerprint,
  ShieldCheck, AlertTriangle, Zap, ChevronRight, Smartphone, Sparkles,
  ClipboardCheck, UserCheck
} from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

export default function OPDRegistration() {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    dob: '',
    gender: 'Male',
    phone: '',
    address: '',
    aadharCardId: '',
    department: 'General Medicine',
    symptoms: '',
    priority: 'LOW'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hashValue, setHashValue] = useState('');

  const departments = [
    "General Medicine", "Cardiology", "Neurology", "Nephrology", 
    "Orthopedics", "ENT", "Dermatology", "Pediatrics", 
    "Gynecology", "Psychiatry", "Radiology", "Oncology", 
    "Pulmonology", "Urology", "Gastroenterology", "Endocrinology", 
    "Ophthalmology", "Emergency"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pHash = await generateBlockchainHash({ 
        type: "PATIENT_REGISTRATION", 
        patientName: formData.patientName,
        aadhar: formData.aadharCardId,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(`${API_BASE_URL}/workflow/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      setResult(data);
      setHashValue(pHash);
      
    } catch (error) {
      alert('Registration Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData({
        patientName: '', age: '', dob: '', gender: 'Male', phone: '', address: '', aadharCardId: '', department: 'General Medicine', symptoms: '', priority: 'LOW'
    });
  };

  if (result) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[48px] p-12 border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden shadow-2xl shadow-blue-500/5"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-sm">
                    <CheckCircle size={40} className="text-emerald-500" />
                </div>
                
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 block">Registration Success</span>
                <h1 className="text-4xl font-black text-slate-900 mb-2 italic uppercase">Patient Enrolled</h1>
                <p className="text-slate-500 font-bold mb-10 text-xs tracking-widest uppercase leading-relaxed">
                   Records for <b>{formData.patientName}</b> have been pushed to the <b>{formData.department}</b> queue.
                </p>
                
                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[40px] mb-8 border border-slate-100 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Queue Token</span>
                        <div className="text-6xl font-black text-blue-600 italic tracking-tighter">{result.token}</div>
                    </div>
                    <div className="relative z-10 border-l border-slate-200 pl-8 text-left flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Patient UHID</span>
                        <div className="text-xl font-black text-slate-800 tracking-tight">{result.uhid}</div>
                        <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                           <Activity size={10} className="text-blue-400" /> BHB Core v2.4 Verified
                        </div>
                    </div>
                </div>
                
                <div className="text-left bg-slate-900 p-8 rounded-[32px] mb-10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Fingerprint size={100} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                       <ShieldCheck size={16} className="text-blue-400" />
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Secure Blockchain Hash</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 break-all leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 relative z-10">
                        {hashValue}
                    </div>
                </div>
                
                <button 
                  onClick={resetForm} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[24px] font-black text-sm transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 group active:scale-[0.98]"
                >
                    PROCEED TO NEXT REGISTRATION <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 font-sans relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-3">
                <div className="flex items-center gap-4 text-blue-600">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <UserPlus size={28} />
                    </div>
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] block text-slate-400">BHB Operations Station</span>
                       <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">OPD Intake Console</h1>
                    </div>
                </div>
            </div>
            <div className="bg-white px-8 py-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Counter</p>
                    <p className="text-base font-black text-slate-700 italic tracking-tight uppercase">Desk-Delta-01</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Smartphone size={22} className="text-blue-500" />
                </div>
            </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-[56px] p-12 lg:p-16 border border-slate-100 shadow-2xl shadow-blue-500/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            
            <div className="col-span-full mb-2">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <User size={18} />
                   </div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] italic">Patient Identity Records</h3>
                </div>
                <div className="h-px w-full bg-slate-50"></div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input required name="patientName" value={formData.patientName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-14 pr-6 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300" placeholder="e.g. Samuel J. Reed" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                    <input required type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="Years" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <div className="relative">
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer">
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300" size={16} />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-14 pr-6 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300" placeholder="+91 XXXX-XXXXXX" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhar ID (UIDAI)</label>
              <div className="relative group">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input required name="aadharCardId" value={formData.aadharCardId} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-14 pr-6 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300" placeholder="XXXX XXXX XXXX" />
              </div>
            </div>

            <div className="col-span-full mt-6 mb-2">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <Zap size={18} />
                   </div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] italic">Clinical Triage Assignment</h3>
                </div>
                <div className="h-px w-full bg-slate-50"></div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Department</label>
              <div className="relative group">
                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                <select name="department" value={formData.department} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-14 pr-12 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm">
                    {departments.map(dept => (
                    <option key={dept}>{dept}</option>
                    ))}
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300" size={16} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Priority</label>
              <div className="relative">
                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm">
                  <option value="LOW">Routine · Low Urgency</option>
                  <option value="MEDIUM">General · Normal Consultation</option>
                  <option value="HIGH">High · Priority Clinical Care</option>
                  <option value="CRITICAL">Critical · Life Threatening</option>
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300" size={16} />
              </div>
            </div>

            <div className="col-span-full space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Presenting Symptoms</label>
              <div className="relative group">
                <FileText className="absolute left-6 top-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
                <textarea required name="symptoms" value={formData.symptoms} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[40px] p-8 pl-16 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[160px] resize-none shadow-sm placeholder:text-slate-300" placeholder="Enter clinical symptoms for triage evaluation..." />
              </div>
            </div>

          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-8 rounded-[32px] font-black text-lg mt-16 flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 group border border-blue-400/10"
          >
            {loading ? (
              <>
                <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="uppercase tracking-[0.2em]">Synchronizing Records...</span>
              </>
            ) : (
              <>
                <span className="uppercase tracking-[0.2em]">Generate Token & Commit to Queue</span>
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        body { background-color: #F8FAFC; font-family: 'Outfit', sans-serif; }
        
        .shadow-blue-600\\/20 {
            box-shadow: 0 15px 40px -10px rgba(37, 99, 235, 0.2);
        }
      `}} />
    </div>
  );
}
