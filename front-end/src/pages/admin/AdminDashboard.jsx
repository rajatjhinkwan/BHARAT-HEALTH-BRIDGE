import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Activity, Users, DownloadCloud, TestTube, Crosshair,
  List, UserCog, ArrowRight, Server, Wind, HeartPulse, Stethoscope,
  Radio, AlertTriangle, Pill, Calendar, Database,
} from 'lucide-react';
import { fetchAdminOverview } from '../../services/wardApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeIN } from '../../utils/locale';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleLabel =
    user?.role?.toUpperCase() === 'SUPER_ADMIN' ? 'Super Admin' : 'Hospital Admin';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAdminOverview();
        setOverview(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleExportReport = () => {
    const o = overview || {};
    const beds = o.beds || {};
    const ms = o.machines || {};
    const ph = o.pharmacy?.stats || {};
    const reportContent = `==================================================
BHARAT HEALTH BRIDGE - ADMIN COMMAND SUMMARY
Generated: ${new Date().toLocaleString('en-IN')}
Role: ${roleLabel}
==================================================

PATIENTS: ${o.patients?.total ?? 0}
BEDS — Total: ${beds.total ?? 0} | Available: ${beds.available ?? 0} | Occupied: ${beds.occupied ?? 0} | Cleaning: ${beds.cleaning ?? 0}
PHARMACY — Medicines: ${ph.totalMedicines ?? 0} | Low stock: ${ph.lowStock ?? 0} | Out: ${ph.outOfStock ?? 0}
LAB — Pending: ${o.lab?.pending ?? 0} | Critical: ${o.lab?.critical ?? 0}
EQUIPMENT — ${ms.total ?? 0} units | ${ms.operational ?? 0} operational
==================================================`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BHB_Admin_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' },
    sectionTitle: { fontSize: '1.35rem', fontWeight: 600, marginBottom: '1rem' },
    gridMode: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' },
    superviseCard: (borderColor) => ({
      display: 'flex', flexDirection: 'column', background: 'var(--surface)', padding: '1.25rem',
      borderRadius: 'var(--radius)', border: '1px solid var(--border)', borderTop: `4px solid ${borderColor}`,
      textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.2s ease',
    }),
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' },
    td: { padding: '0.6rem', borderBottom: '1px solid var(--border)' },
  };

  const departments = [
    { name: 'Live OPD Queue', path: '/queue', icon: <List color="var(--primary)" />, color: 'var(--primary)', desc: 'Department waiting lists' },
    { name: 'Nurse Station', path: '/nurse-station', icon: <Activity color="var(--success)" />, color: 'var(--success)', desc: 'Ward beds & allocation' },
    { name: 'Clinical EMR', path: '/emr', icon: <Stethoscope color="var(--accent)" />, color: 'var(--accent)', desc: 'Medical records' },
    { name: 'Laboratory', path: '/lab', icon: <TestTube color="#8b5cf6" />, color: '#8b5cf6', desc: 'Tests & reports' },
    { name: 'Pharmacy', path: '/pharmacy', icon: <Crosshair color="var(--success)" />, color: 'var(--success)', desc: 'Inventory & dispensing' },
    { name: 'Machine Tracking', path: '/machines', icon: <Server color="var(--primary)" />, color: 'var(--primary)', desc: 'Biomedical equipment' },
    { name: 'HR & Attendance', path: '/hr', icon: <UserCog color="var(--danger)" />, color: 'var(--danger)', desc: 'Staff presence' },
    { name: 'Shift Roster', path: '/shifts', icon: <Calendar color="var(--warning)" />, color: 'var(--warning)', desc: 'Roster & leave' },
    { name: 'Live Hospital Feed', path: '/live-feed', icon: <Radio color="var(--accent)" />, color: 'var(--accent)', desc: 'Real-time overview' },
    { name: 'ICU', path: '/icu', icon: <HeartPulse color="var(--danger)" />, color: 'var(--danger)', desc: 'Critical care' },
    { name: 'Emergency', path: '/emergency', icon: <AlertTriangle color="var(--warning)" />, color: 'var(--warning)', desc: 'ER workflow' },
    { name: 'Security Ledger', path: '/admin/blockchain', icon: <Database color="#a855f7" />, color: '#a855f7', desc: 'Medical record integrity audit' },
  ];

  const o = overview || {};
  const beds = o.beds || {};
  const ph = o.pharmacy || {};
  const lab = o.lab || {};
  const ms = o.machines || {};

  return (
    <div style={styles.container} className="animate-fade-in-up admin-dashboard">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Command Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Bharat Health Bridge · {roleLabel}
            {o.generatedAt && ` · Updated ${formatDateTimeIN(o.generatedAt)}`}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={handleExportReport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DownloadCloud size={18} /> Export summary
        </button>
      </div>

      <div style={styles.statsRow}>
        {[
          { label: 'Patients', value: o.patients?.total, icon: Users },
          { label: 'Beds available', value: beds.available, icon: Layers },
          { label: 'Beds occupied', value: beds.occupied, icon: Activity },
          { label: 'Cleaning', value: beds.cleaning, icon: Wind },
          { label: 'OPD waiting', value: o.opd?.totalWaiting, icon: List },
          { label: 'Low stock meds', value: ph.stats?.lowStock, icon: Pill },
          { label: 'Lab pending', value: lab.pending, icon: TestTube },
          { label: 'Equipment', value: ms.total, icon: Server },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              {s.label}
              <s.icon size={18} />
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0' }}>{loading ? '…' : (s.value ?? 0)}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <section style={{ ...styles.statCard, padding: '1.25rem' }}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Ward occupancy</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ward</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Free</th>
                <th style={styles.th}>Occ.</th>
                <th style={styles.th}>Clean</th>
              </tr>
            </thead>
            <tbody>
              {(o.wards || []).map((w) => (
                <tr key={w.key}>
                  <td style={styles.td}>
                    <Link to={`/nurse-station?ward=${encodeURIComponent(w.key)}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {w.label}
                    </Link>
                  </td>
                  <td style={styles.td}>{w.total}</td>
                  <td style={styles.td}>{w.available}</td>
                  <td style={styles.td}>{w.occupied}</td>
                  <td style={styles.td}>{w.cleaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ ...styles.statCard, padding: '1.25rem' }}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={20} color="var(--success)" /> Pharmacy snapshot
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-danger">Out of stock: {ph.stats?.outOfStock ?? 0}</span>
            <span className="badge badge-warning">Expiring: {ph.stats?.expiringSoon ?? 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {(ph.lowStock || []).slice(0, 4).map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{m.stock} left</span>
              </div>
            ))}
            {(ph.outOfStock || []).slice(0, 2).map((m, i) => (
              <div key={`o-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontWeight: 700 }}>Empty</span>
              </div>
            ))}
          </div>
          <Link to="/pharmacy" className="btn-primary w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', marginTop: 'auto' }}>
            Open Pharmacy OS <ArrowRight size={16} />
          </Link>
        </section>

        <section style={{ ...styles.statCard, padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TestTube size={20} color="#8b5cf6" /> Lab & Equipment
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
              <span>Pending lab orders</span> <strong style={{ color: 'var(--text-main)' }}>{lab.pending ?? 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
              <span>Processing samples</span> <strong style={{ color: 'var(--primary)' }}>{lab.processing ?? 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--danger)' }}>Critical lab alerts</span> <strong style={{ color: 'var(--danger)' }}>{lab.critical ?? 0}</strong>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
              <span>Biomedical Equipment</span> <strong>{ms.operational ?? 0} / {ms.total ?? 0} active</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
              <span>Network Uptime</span> <strong style={{ color: 'var(--success)' }}>{ms.avgUptime ?? 0}%</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
            <Link to="/lab" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', fontSize: '0.9rem' }}>
              Laboratory
            </Link>
            <Link to="/machines" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', fontSize: '0.9rem', borderColor: 'var(--primary)', color: 'var(--primary)', border: '1px solid' }}>
              Equipment
            </Link>
          </div>
        </section>
      </div>

      <div>
        <h2 style={styles.sectionTitle}>Hospital modules</h2>
        <div style={styles.gridMode}>
          {departments.map((dept) => (
            <Link key={dept.path} to={dept.path} style={styles.superviseCard(dept.color)} className="hover-card-effect">
              <div style={{ marginBottom: '0.75rem' }}>{dept.icon}</div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>{dept.name}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{dept.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
