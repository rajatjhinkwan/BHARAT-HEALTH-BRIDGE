import React, { useState } from 'react';
import { AlertOctagon, Activity, UserPlus, X, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TriageDashboard() {
  const [patients, setPatients] = useState([
    { id: 'EM-01', name: 'Unknown Male', condition: 'Multiple Trauma', priority: 'RED', triageTime: '10:14 AM' },
    { id: 'EM-02', name: 'Sarita Devi', condition: 'Chest Pain', priority: 'YELLOW', triageTime: '10:20 AM' },
    { id: 'EM-03', name: 'Anil Kumar', condition: 'Minor Laceration', priority: 'GREEN', triageTime: '10:45 AM' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    condition: '',
    priority: 'RED'
  });

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.condition) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = `EM-${String(patients.length + 1).padStart(2, '0')}`;
    
    setPatients([...patients, {
      ...newPatient,
      id,
      triageTime: timeString
    }]);
    setIsModalOpen(false);
    setNewPatient({ name: '', condition: '', priority: 'RED' });
  };

  const handleMovePatient = (id, newPriority) => {
    setPatients(patients.map(p => 
      p.id === id ? { ...p, priority: newPriority } : p
    ));
  };

  const handleAllocateBed = (id) => {
    if(window.confirm(`Allocate bed and remove patient ${id} from triage?`)) {
      setPatients(patients.filter(p => p.id !== id));
    }
  };

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '800',
      color: 'var(--text-main)',
      margin: 0
    },
    queueGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2rem'
    },
    column: (color) => ({
      background: 'var(--surface)',
      borderTop: `6px solid ${color}`,
      padding: '1.5rem',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      minHeight: '400px'
    }),
    colTitle: {
      margin: '0 0 1rem 0',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontSize: '0.9rem',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    card: {
      background: 'var(--background)',
      border: '1px solid var(--border)',
      padding: '1rem',
      borderRadius: 'var(--radius-sm)',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    actionRow: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    actionBtn: {
      flex: 1,
      padding: '0.4rem',
      fontSize: '0.75rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      fontWeight: 'bold',
      color: 'var(--text-main)',
      transition: 'all 0.2s'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'var(--surface)',
      padding: '2rem',
      borderRadius: 'var(--radius)',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    },
    inputGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
      color: 'var(--text-main)'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      background: 'var(--background)',
      color: 'var(--text-main)'
    }
  };

  const renderPatientCard = (p, color, lightColor) => (
    <div key={p.id} style={styles.card} className="animate-fade-in-up">
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.id} | {p.name}</div>
      <div style={{ color: color, fontWeight: 600 }}>{p.condition}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Triaged: {p.triageTime}</div>
      
      <div style={styles.actionRow}>
        {p.priority !== 'RED' && (
          <button style={styles.actionBtn} onClick={() => handleMovePatient(p.id, p.priority === 'GREEN' ? 'YELLOW' : 'RED')}>
            Escalate
          </button>
        )}
        {p.priority !== 'GREEN' && (
          <button style={styles.actionBtn} onClick={() => handleMovePatient(p.id, p.priority === 'RED' ? 'YELLOW' : 'GREEN')}>
            De-escalate
          </button>
        )}
      </div>

      <button 
        onClick={() => handleAllocateBed(p.id)}
        style={{ 
          width: '100%', padding: '0.5rem', marginTop: '0.25rem', 
          background: lightColor, color: color, border: 'none', 
          borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
        Allocate Bed
      </button>
    </div>
  );

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <AlertOctagon size={40} color="var(--danger)" />
        <div>
          <h1 style={styles.title}>Emergency Triage Console</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Color-coded priority queue.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-danger hover-scale" 
          style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
          + Incoming Ambulance Call
        </button>
      </div>

      <div style={styles.queueGrid}>
        {/* RED PRIORITY */}
        <div style={styles.column('var(--danger)')}>
           <h3 style={styles.colTitle}><span style={{ color: 'var(--danger)' }}>●</span> RED - Immediate / Resuscitation</h3>
           {patients.filter(p => p.priority === 'RED').map(p => renderPatientCard(p, 'var(--danger)', 'var(--danger-light)'))}
           {patients.filter(p => p.priority === 'RED').length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No immediate patients.</div>
           )}
        </div>

        {/* YELLOW PRIORITY */}
        <div style={styles.column('var(--warning)')}>
           <h3 style={styles.colTitle}><span style={{ color: 'var(--warning)' }}>●</span> YELLOW - Urgent</h3>
           {patients.filter(p => p.priority === 'YELLOW').map(p => renderPatientCard(p, 'var(--warning)', 'var(--warning-light)'))}
           {patients.filter(p => p.priority === 'YELLOW').length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No urgent patients.</div>
           )}
        </div>

        {/* GREEN PRIORITY */}
        <div style={styles.column('var(--success)')}>
           <h3 style={styles.colTitle}><span style={{ color: 'var(--success)' }}>●</span> GREEN - Minor</h3>
           {patients.filter(p => p.priority === 'GREEN').map(p => renderPatientCard(p, 'var(--success)', 'var(--success-light)'))}
           {patients.filter(p => p.priority === 'GREEN').length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No minor patients.</div>
           )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Activity size={24} color="var(--danger)" />
                New Triage Registration
              </h2>
              <X style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsModalOpen(false)} />
            </div>

            <form onSubmit={handleAddPatient}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Patient Name / Identifier</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  required
                  placeholder="e.g. Unknown Male or Rajesh Kumar"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Condition / Chief Complaint</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  required
                  placeholder="e.g. Severe bleeding, Chest pain"
                  value={newPatient.condition}
                  onChange={(e) => setNewPatient({...newPatient, condition: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Triage Priority</label>
                <select 
                  style={styles.input}
                  value={newPatient.priority}
                  onChange={(e) => setNewPatient({...newPatient, priority: e.target.value})}
                >
                  <option value="RED">RED - Immediate / Resuscitation</option>
                  <option value="YELLOW">YELLOW - Urgent</option>
                  <option value="GREEN">GREEN - Minor</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' }}>
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
