import React, { useState, useEffect } from 'react';
import { Search, User, ArrowRight, Activity, MapPin, X } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const search = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('hospflow_auth_token');
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/workflow/search?query=${query}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (patient) => {
    navigate('/emr', { state: { patientId: patient._id } });
    if (onClose) onClose();
  };

  return (
    <div className="global-search-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', backdropFilter: 'blur(10px)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
        <X size={32} />
      </button>

      <div className="w-full max-w-2xl px-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            autoFocus
            type="text"
            placeholder="Search Patient Name, UHID, or Phone..."
            style={{ width: '100%', padding: '1.5rem 1.5rem 1.5rem 4.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1.25rem', outline: 'none' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-8 space-y-4">
          {loading && <p className="text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Scanning Ledger...</p>}
          
          {results.map((patient) => (
            <div 
              key={patient._id} 
              className="glass-card p-6 cursor-pointer hover:bg-white/10 transition-all flex items-center justify-between group"
              onClick={() => handleSelect(patient)}
            >
              <div className="flex items-center gap-6">
                <div style={{ width: 56, height: 56, background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={28} color="var(--primary)" />
                </div>
                <div>
                  <h3 className="text-white mb-1 flex items-center gap-2">
                    {patient.patientName}
                    {patient.priority === 'CRITICAL' && <span className="bg-red-500/20 text-red-500 text-[8px] px-2 py-0.5 rounded-full border border-red-500/30">CRITICAL</span>}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    <span>{patient.mrn}</span>
                    <span className="text-primary">•</span>
                    <span className="text-primary">{patient.currentStatus}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <MapPin size={10} /> {patient.currentDepartment || 'OPD'}
                    </div>
                    <div className="text-[10px] font-black text-white uppercase">{patient.assignedDoctor || 'No Doctor'}</div>
                 </div>
                 <div className="text-right" style={{ minWidth: '100px' }}>
                    <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Location</div>
                    <div className="text-xs font-black text-primary">{patient.currentWard || 'Outpatient'} - {patient.currentBed || 'N/A'}</div>
                 </div>
                 <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary transition-colors">
                    <ArrowRight size={20} className="text-white" />
                 </div>
              </div>
            </div>
          ))}

          {query.length >= 3 && results.length === 0 && !loading && (
            <div className="text-center p-12 text-slate-500">
               <Activity size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold uppercase tracking-widest text-[10px]">No matches found in clinical records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
