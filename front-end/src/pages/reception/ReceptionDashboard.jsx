import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, Clock, Activity, ShieldAlert, Users, ArrowRight } from 'lucide-react';

const ReceptionDashboard = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'registration',
      title: 'OPD Registration',
      desc: 'Register new patients and generate tokens',
      icon: <UserPlus size={32} />,
      color: '#3b82f6',
      path: '/register-patient',
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    {
      id: 'appointments',
      title: 'Book Appointment',
      desc: 'Schedule and manage patient visits',
      icon: <Calendar size={32} />,
      color: '#8b5cf6',
      path: '/schedule',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    {
      id: 'queue',
      title: 'Live OPD Queue',
      desc: 'Monitor patient flow across departments',
      icon: <Clock size={32} />,
      color: '#10b981',
      path: '/queue',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      id: 'emergency',
      title: 'Emergency Entry',
      desc: 'Immediate triage for critical cases',
      icon: <ShieldAlert size={32} />,
      color: '#ef4444',
      path: '/emergency',
      bg: 'rgba(239, 68, 68, 0.1)'
    }
  ];

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' },
    header: { marginBottom: '4rem', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' },
    card: (color, bg) => ({
      background: 'white',
      borderRadius: '32px',
      padding: '2.5rem',
      border: '1px solid #f1f5f9',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      overflow: 'hidden'
    }),
    iconBox: (color, bg) => ({
      width: '64px',
      height: '64px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      background: bg,
      marginBottom: '1.5rem'
    })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 900, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={14}/> Reception Central Portal
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Welcome Back</h1>
        <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '0.5rem' }}>Select a module to manage patient workflow and hospital operations.</p>
      </div>

      <div style={styles.grid}>
        {actions.map(action => (
          <div 
            key={action.id} 
            style={styles.card(action.color, action.bg)}
            onClick={() => navigate(action.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = action.color + '40';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.02)';
              e.currentTarget.style.borderColor = '#f1f5f9';
            }}
          >
            <div style={styles.iconBox(action.color, action.bg)}>
              {action.icon}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>{action.title}</h3>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>{action.desc}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: action.color, fontWeight: 800, fontSize: '0.9rem' }}>
              Launch Module <ArrowRight size={16}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '5rem', background: '#f8fafc', borderRadius: '24px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid #f1f5f9' }}>
        <div style={{ background: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <Users size={24} style={{ color: 'var(--primary)', margin: 'auto' }}/>
        </div>
        <div>
            <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Daily Overview</h4>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>System status: Online | 24 Active Queues | 158 Patients Today</p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
