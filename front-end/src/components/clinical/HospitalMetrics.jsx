import React, { useState, useEffect } from 'react';
import { Users, Clock, Activity, Bed, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function HospitalMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('hospflow_auth_token');
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/workflow/metrics`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest text-[10px]">Syncing Hospital Metrics...</div>;

  const m = metrics || {
    totalPatients: 0,
    waitingQueue: 0,
    activeICU: 0,
    ventilator: 0,
    availableBeds: 0,
    dischargedToday: 0
  };

  const cards = [
    { label: 'Total Patients', value: m.totalPatients ?? 0, icon: <Users size={24} />, color: 'var(--primary)' },
    { label: 'Waiting Queue', value: m.waitingQueue ?? 0, icon: <Clock size={24} />, color: 'var(--warning)' },
    { label: 'Active ICU', value: m.activeICU ?? 0, icon: <AlertTriangle size={24} />, color: 'var(--danger)' },
    { label: 'Ventilator Patients', value: m.ventilator ?? 0, icon: <Activity size={24} />, color: '#991b1b' },
    { label: 'Available Beds', value: m.availableBeds ?? 0, icon: <Bed size={24} />, color: 'var(--success)' },
    { label: 'Discharged Today', value: m.dischargedToday ?? 0, icon: <CheckCircle size={24} />, color: 'var(--secondary)' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="card p-6 flex flex-col items-center text-center hover:translate-y-[-4px] transition-all">
          <div style={{ background: `${card.color}15`, color: card.color, padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem' }}>
            {card.icon}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{card.label}</span>
          <div className="text-2xl font-black">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
