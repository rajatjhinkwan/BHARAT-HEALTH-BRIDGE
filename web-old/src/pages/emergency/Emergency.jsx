import React from 'react';
import { AlertCircle, Activity, HeartPulse, Clock, FilePlus2, UserX } from 'lucide-react';

export default function Emergency() {
    const dummyEmergencies = [
        { id: 'EMR-1001', time: '14:22', patient: 'Unknown Male (~35)', type: 'Trauma / RTA', priority: 'Code Red', status: 'In Surgery', location: 'O.T. 2' },
        { id: 'EMR-1002', time: '14:45', patient: 'Kiran Desai', type: 'Cardiac Arrest', priority: 'Code Blue', status: 'Resuscitation', location: 'ER Bed 1' },
        { id: 'EMR-1003', time: '15:10', patient: 'Aarav Mehta', type: 'Severe Allergic Reaction', priority: 'Code Yellow', status: 'Stabilized', location: 'ER Bed 4' },
        { id: 'EMR-1004', time: '15:30', patient: 'Sita Ramam', type: 'Stroke Protocol', priority: 'Code Red', status: 'CT Scan', location: 'Imaging Center' }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }} className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem 2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', margin: 0 }}>
                        <AlertCircle size={32} /> Emergency & Trauma Center
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Real-time active inbound emergency triage unit.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ background: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><FilePlus2 size={18}/> New Incoming ETA</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {dummyEmergencies.map(e => (
                    <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1rem', background: e.priority === 'Code Red' || e.priority === 'Code Blue' ? 'linear-gradient(90deg, rgba(239,68,68,0.2) 0%, transparent 100%)' : 'linear-gradient(90deg, rgba(234,179,8,0.2) 0%, transparent 100%)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: e.priority === 'Code Yellow' ? 'var(--warning)' : 'var(--danger)' }}>{e.priority}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Arrived: {e.time}</span>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {e.patient.includes('Unknown') ? <UserX size={20} color="var(--text-muted)" /> : <Activity size={20} color="var(--primary)" />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{e.patient}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {e.id}</div>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Diagnosis / Incident</div>
                                <div style={{ fontWeight: '600' }}>{e.type}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Location</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{e.location}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <HeartPulse size={14} /> {e.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
