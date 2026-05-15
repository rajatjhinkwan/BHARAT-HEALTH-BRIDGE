import React, { useState, useEffect } from 'react';
import { Users, Clock, Activity, Bed, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function HospitalMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/workflow/metrics`);
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

  const cards = [
    { label: 'Total Patients', value: metrics.totalPatients, icon: <Users size={24} />, color: 'var(--primary)' },
    { label: 'Waiting Queue', value: metrics.waitingQueue, icon: <Clock size={24} />, color: 'var(--warning)' },
    { label: 'Active ICU', value: metrics.activeICU, icon: <AlertTriangle size={24} />, color: 'var(--danger)' },
    { label: 'Ventilator Patients', value: metrics.ventilator, icon: <Activity size={24} />, color: '#991b1b' },
    { label: 'Available Beds', value: metrics.availableBeds, icon: <Bed size={24} />, color: 'var(--success)' },
    { label: 'Discharged Today', value: metrics.dischargedToday, icon: <CheckCircle size={24} />, color: 'var(--secondary)' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="card p-6 flex flex-col items-center text-center hover:translate-y-[-4px] transition-all">
          <div style={{ background: `${card.color}15`, color: card.color, padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem' }}>
            {card.icon}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</span>
          <div className="text-2xl font-black">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
