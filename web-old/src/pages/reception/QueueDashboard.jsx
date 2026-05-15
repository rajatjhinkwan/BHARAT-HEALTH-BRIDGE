import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Play, CheckCircle2, UserCheck, Activity, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

// Deriving socket URL from API_BASE_URL (removing /api)
const SOCKET_URL = API_BASE_URL.replace('/api', '');
const socket = io(SOCKET_URL);

export default function QueueDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState({ waiting: [], inConsultation: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(user?.department || 'General Medicine');

  const departments = [
    "General Medicine", "Cardiology", "Neurology", "Nephrology", 
    "Orthopedics", "ENT", "Dermatology", "Pediatrics", 
    "Gynecology", "Psychiatry", "Radiology", "Oncology", 
    "Pulmonology", "Urology", "Gastroenterology", "Endocrinology", 
    "Ophthalmology", "Emergency", "ICU", "Ventilator Ward", 
    "Trauma", "Surgery", "Pathology", "Laboratory", "Pharmacy"
  ];

  const fetchLiveQueue = useCallback(async () => {
    try {
      const deptQuery = user?.role === 'RECEPTIONIST' ? selectedDept : user?.department;
      const response = await fetch(`${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(deptQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
      }
    } catch (err) {
      console.error('Failed to fetch live queue', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, user?.department, user?.role]);

  useEffect(() => {
    fetchLiveQueue();

    socket.on('queueUpdated', (data) => {
      const deptQuery = user?.role === 'RECEPTIONIST' ? selectedDept : user?.department;
      if (!data.department || data.department === deptQuery) {
        fetchLiveQueue();
      }
    });

    return () => {
      socket.off('queueUpdated');
    };
  }, [fetchLiveQueue, selectedDept, user?.department, user?.role]);

  const handleCallNext = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${user._id}`, { 
            method: 'PATCH' 
        });
        
        if (response.ok) {
            const node = await response.json();
            // Fetch full patient data to pass to EMR
            const pResp = await fetch(`${API_BASE_URL}/clinical/patients/${node.patientId}`);
            const fullPatient = await pResp.json();
            navigate('/emr', { state: { selectedPatient: { ...fullPatient, queueId: node.queueId, tokenNumber: node.tokenNumber } } });
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to call next patient');
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleComplete = async (queueId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/queue/complete/${queueId}`, { 
            method: 'PATCH' 
        });
        if (response.ok) {
            fetchLiveQueue();
        }
    } catch (err) {
        console.error(err);
    }
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' },
    cols: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' },
    column: { background: '#f8fafc', borderRadius: '24px', padding: '1.5rem', minHeight: '700px', border: '1px solid #e2e8f0' },
    columnTitle: (color) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: color, paddingBottom: '1rem', borderBottom: `2px solid ${color}20` }),
    card: { background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    token: { background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 900, color: '#475569' },
    doctorBtn: { background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>
                {user?.role === 'RECEPTIONIST' ? 'Hospital Central Queue' : `${user?.department} Queue`}
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '1.1rem' }}>
                {user?.role === 'RECEPTIONIST' 
                    ? `Monitoring ${selectedDept}` 
                    : `Welcome Dr. ${user?.name?.split(' ')[0]} | ${user?.department} Dept`}
            </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user?.role === 'RECEPTIONIST' && (
                <select 
                    value={selectedDept} 
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none' }}
                >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            )}
            
            {user?.role === 'DOCTOR' && (
                <button onClick={handleCallNext} style={styles.doctorBtn}>
                    <Play size={20} fill="currentColor"/> Call Next Patient
                </button>
            )}
        </div>
      </div>

      <div style={styles.cols}>
        {/* Column 1: WAITING */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle('#eab308')}>
             <Clock size={20}/> WAITING ({queueData.waiting.length})
          </h3>
          {queueData.waiting.map(p => (
            <div key={p.queueId} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={styles.token}>{p.tokenNumber}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{p.time}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{p.patientName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Dept: <span style={{fontWeight: 700, color: 'var(--primary)'}}>{p.department}</span></div>
            </div>
          ))}
          {queueData.waiting.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '3rem' }}>No patients waiting</p>}
        </div>

        {/* Column 2: IN CONSULTATION */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle('#3b82f6')}>
             <Activity size={20}/> IN CONSULTATION ({queueData.inConsultation.length})
          </h3>
          {queueData.inConsultation.map(p => (
            <div key={p.queueId} style={{ ...styles.card, border: '2px solid #3b82f630', background: '#eff6ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ ...styles.token, background: '#3b82f6', color: 'white' }}>{p.tokenNumber}</span>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 800 }}>ACTIVE</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{p.patientName}</div>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '0.5rem', fontWeight: 700 }}>With {p.doctor}</div>
              
              <button 
                onClick={() => handleComplete(p.queueId)}
                style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <CheckCircle2 size={16}/> Finish Consultation
              </button>
            </div>
          ))}
          {queueData.inConsultation.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '3rem' }}>No active consultations</p>}
        </div>

        {/* Column 3: COMPLETED */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle('#22c55e')}>
             <CheckCircle2 size={20}/> COMPLETED ({queueData.completed.length})
          </h3>
          {queueData.completed.slice(0, 10).map(p => (
            <div key={p.queueId} style={{ ...styles.card, opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={styles.token}>{p.tokenNumber}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.patientName}</div>
              <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 800, marginTop: '0.25rem' }}>DISCHARGED</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
