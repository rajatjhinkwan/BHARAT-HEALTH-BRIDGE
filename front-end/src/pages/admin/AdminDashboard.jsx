import React from 'react';
import { Link } from 'react-router-dom';
import VisualFloorPlan from '../../components/VisualFloorPlan';
import { Layers, Activity, Users, DownloadCloud, Stethoscope, TestTube, Crosshair, DollarSign, List, UserCog, ArrowRight, Server } from 'lucide-react';

export default function AdminDashboard() {
  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' },
    title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' },
    statHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' },
    statValue: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 },
    sectionTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' },
    gridMode: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
    superviseCard: (borderColor) => ({
       display: 'flex', 
       flexDirection: 'column', 
       background: 'var(--surface)', 
       padding: '1.5rem', 
       borderRadius: 'var(--radius)', 
       border: `1px solid var(--border)`, 
       borderTop: `4px solid ${borderColor}`,
       boxShadow: 'var(--shadow-sm)',
       textDecoration: 'none',
       color: 'var(--text-main)',
       transition: 'all 0.2s ease',
       cursor: 'pointer'
    }),
    cardIcon: {
       background: 'var(--primary-light)',
       padding: '0.75rem',
       borderRadius: 'var(--radius)',
       display: 'inline-flex',
       marginBottom: '1rem'
    }
  };

  const departments = [
    { name: "Live Queue", path: "/queue", icon: <List color="var(--primary)"/>, color: "var(--primary)", desc: "Supervise waiting patients and OPD flow" },
    { name: "Nurse Station", path: "/nurse", icon: <Activity color="var(--accent)"/>, color: "var(--accent)", desc: "Monitor triage and ward vitals" },
    { name: "Laboratory", path: "/lab", icon: <TestTube color="var(--purple)"/>, color: "var(--purple)", desc: "Oversee test requests and results" },
    { name: "Pharmacy", path: "/pharmacy", icon: <Crosshair color="var(--success)"/>, color: "var(--success)", desc: "Check inventory and dispensed meds" },
    { name: "Billing & Finance", path: "/billing", icon: <DollarSign color="var(--warning)"/>, color: "var(--warning)", desc: "Audit invoices, claims, and daily revenue" },
    { name: "HR & Roster", path: "/hr", icon: <UserCog color="var(--danger)"/>, color: "var(--danger)", desc: "Supervise staff attendance and leave" },
    { name: "Machine & Equipment Tracking", path: "/machines", icon: <Server color="var(--primary)"/>, color: "var(--primary)", desc: "Monitor all hospital machines, uptime & maintenance" }
  ];

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Supervision Portal</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>High-level hospital oversight and department management.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DownloadCloud size={18} /> Export Daily Report
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={{ fontWeight: 600 }}>Total Patients</span>
             <Users size={20} color="var(--primary)" />
          </div>
          <h2 style={styles.statValue}>482</h2>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>+12 Today</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={{ fontWeight: 600 }}>Available Beds</span>
             <Layers size={20} color="var(--accent)" />
          </div>
          <h2 style={styles.statValue}>32</h2>
          <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>Critical Capacity</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={{ fontWeight: 600 }}>Avg Wait Time</span>
             <Activity size={20} color="var(--warning)" />
          </div>
          <h2 style={styles.statValue}>14m</h2>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>-2m from yesterday</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={{ fontWeight: 600 }}>Revenue (Today)</span>
             <DollarSign size={20} color="var(--success)" />
          </div>
          <h2 style={styles.statValue}>$12.4k</h2>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={{ fontWeight: 600 }}>Tracked Machines</span>
             <Server size={20} color="var(--accent)" />
          </div>
          <h2 style={styles.statValue}>57</h2>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>97.8% Avg Uptime</span>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h2 style={styles.sectionTitle}>Department Environments</h2>
        <div style={styles.gridMode}>
           {departments.map((dept, i) => (
             <Link key={i} to={dept.path} style={styles.superviseCard(dept.color)} className="hover-card-effect">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ ...styles.cardIcon, background: `${dept.color}22` }}>
                     {dept.icon}
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{dept.name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{dept.desc}</p>
             </Link>
           ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={styles.sectionTitle}>Facility & Floor Plan Supervision</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <VisualFloorPlan wardName="Intensive Care Unit (ICU)" />
           <VisualFloorPlan wardName="Emergency Ward Level 1" />
        </div>
      </div>
    </div>
  );
}
