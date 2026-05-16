import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

export default function NurseNoteModal({ patient, onClose, onUpdate }) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/critical/nurse/add-note/${patient._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nurseName: user?.name || 'Critical Care Nurse',
            note: note.trim()
        })
      });

      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="animate-scale-in" style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Add Nurse Note</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{patient.patientName} • {patient.mrn}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-hover)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit}>
           <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CLINICAL OBSERVATION</label>
              <textarea 
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', height: '150px', resize: 'none', fontSize: '1rem' }} 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                placeholder="Describe patient condition, oxygen adjustments, or any concerns..." 
              />
           </div>
           
           <button 
             type="submit" 
             disabled={loading}
             style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
           >
              {loading ? 'Saving...' : <><Save size={20}/> Save Note</>}
           </button>
        </form>
      </div>
    </div>
  );
}
