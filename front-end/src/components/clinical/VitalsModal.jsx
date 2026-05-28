import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function VitalsModal({ patient, onClose, onUpdate }) {
  const latest = (patient.vitals && patient.vitals.length) ? patient.vitals[patient.vitals.length - 1] : {};
  const [formData, setFormData] = useState({
    bp: latest.bp || '',
    heartRate: latest.heartRate || '',
    temp: latest.temp || '',
    spo2: latest.spo2 || '',
    respiratoryRate: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/critical/nurse/update-vitals/${patient._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recordedBy: 'Staff' })
      });
      if (res.ok) {
        alert('Vitals updated successfully');
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="animate-scale-in" style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Update Vitals</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{patient.patientName} • {patient.mrn}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-hover)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
           <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BLOOD PRESSURE (mmHg)</label>
              <input required style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})} placeholder="e.g. 120/80" />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>HEART RATE (BPM)</label>
              <input required style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} placeholder="72" />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SpO2 (%)</label>
              <input required style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} placeholder="98" />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TEMP (°F)</label>
              <input required style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} placeholder="98.6" />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RESP. RATE (BPM)</label>
              <input required style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.respiratoryRate} onChange={e => setFormData({...formData, respiratoryRate: e.target.value})} placeholder="16" />
           </div>
           <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>OBSERVATION NOTES</label>
              <textarea style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)', height: '80px', resize: 'none' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Initial clinical observation..." />
           </div>
           <button type="submit" style={{ gridColumn: 'span 2', background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Save size={20}/> Commit Observation to EMR
           </button>
        </form>
      </div>
    </div>
  );
}
