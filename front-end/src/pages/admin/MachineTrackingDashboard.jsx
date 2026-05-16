import React, { useState, useMemo } from 'react';
import { MACHINES, DEPARTMENTS, STATUS_MAP, getStatusCounts, getDeptCounts } from '../../data/hospitalMachines';
import { Search, LayoutGrid, List, Monitor, AlertTriangle, CheckCircle, XCircle, Clock, Zap, ChevronDown, X, Wrench, Calendar, MapPin, Shield, Hash, Activity, Server } from 'lucide-react';

export default function MachineTrackingDashboard() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const counts = useMemo(() => getStatusCounts(), []);
  const deptCounts = useMemo(() => getDeptCounts(), []);

  const filtered = useMemo(() => {
    return MACHINES.filter(m => {
      if (deptFilter !== 'all' && m.department !== deptFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q) || m.model.toLowerCase().includes(q) || m.serialNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, deptFilter, statusFilter]);

  const statusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle size={14} />;
      case 'maintenance': return <Wrench size={14} />;
      case 'offline': return <XCircle size={14} />;
      case 'calibration': return <Activity size={14} />;
      case 'standby': return <Clock size={14} />;
      default: return null;
    }
  };

  return (
    <div style={S.container} className="animate-fade-in-up">
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}><Server size={28} style={{ marginRight: 10 }} />Equipment & Machine Tracking</h1>
          <p style={S.subtitle}>Biomedical Engineering — Real-time asset monitoring across all departments</p>
        </div>
        <div style={S.headerActions}>
          <div style={S.lastSync}><Zap size={14} color="var(--success)" /> Live Sync: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        <StatCard label="Total Equipment" value={counts.total} icon={<Monitor size={20}/>} color="var(--primary)" />
        <StatCard label="Operational" value={counts.operational} icon={<CheckCircle size={20}/>} color="var(--success)" />
        <StatCard label="Maintenance" value={counts.maintenance} icon={<Wrench size={20}/>} color="var(--warning)" />
        <StatCard label="Offline" value={counts.offline} icon={<XCircle size={20}/>} color="var(--danger)" />
        <StatCard label="Avg. Uptime" value={`${counts.avgUptime}%`} icon={<Activity size={20}/>} color="var(--accent)" />
      </div>

      {/* Department Tabs */}
      <div style={S.deptTabs}>
        {DEPARTMENTS.map(d => (
          <button key={d.id} onClick={() => setDeptFilter(d.id)}
            style={{
              ...S.deptTab,
              background: deptFilter === d.id ? `${d.color}22` : 'transparent',
              borderColor: deptFilter === d.id ? d.color : 'var(--border)',
              color: deptFilter === d.id ? d.color : 'var(--text-muted)',
            }}>
            <span>{d.icon}</span> {d.name}
            {d.id !== 'all' && <span style={{ ...S.tabBadge, background: d.color + '22', color: d.color }}>{deptCounts[d.id] || 0}</span>}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <div style={S.searchBox}>
          <Search size={18} color="var(--text-muted)" />
          <input type="text" placeholder="Search by name, manufacturer, model, or serial..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          {search && <button onClick={() => setSearch('')} style={S.clearBtn}><X size={14} /></button>}
        </div>
        <div style={S.controlRight}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={S.select}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={S.viewToggle}>
            <button onClick={() => setViewMode('grid')} style={{ ...S.viewBtn, ...(viewMode === 'grid' ? S.viewBtnActive : {}) }}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('table')} style={{ ...S.viewBtn, ...(viewMode === 'table' ? S.viewBtnActive : {}) }}><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p style={S.resultCount}>Showing <strong>{filtered.length}</strong> of {MACHINES.length} machines</p>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div style={S.grid}>
          {filtered.map(machine => (
            <div key={machine.id} style={S.card} className="hover-card-effect" onClick={() => setSelectedMachine(machine)}>
              <div style={S.cardTop}>
                <div style={{ ...S.statusDot, background: STATUS_MAP[machine.status].color, boxShadow: `0 0 8px ${STATUS_MAP[machine.status].color}` }} />
                <span style={{ ...S.statusBadge, background: STATUS_MAP[machine.status].bg, color: STATUS_MAP[machine.status].color }}>
                  {statusIcon(machine.status)} {STATUS_MAP[machine.status].label}
                </span>
              </div>
              <h3 style={S.cardTitle}>{machine.name}</h3>
              <p style={S.cardMfr}>{machine.manufacturer} — {machine.model}</p>
              <div style={S.cardMeta}>
                <span style={S.metaItem}><MapPin size={12} /> {machine.location.split(',')[0]}</span>
                <span style={{ ...S.metaItem, color: DEPARTMENTS.find(d => d.id === machine.department)?.color }}>
                  {DEPARTMENTS.find(d => d.id === machine.department)?.icon} {DEPARTMENTS.find(d => d.id === machine.department)?.name}
                </span>
              </div>
              <div style={S.uptimeRow}>
                <span style={S.uptimeLabel}>Uptime</span>
                <span style={{ ...S.uptimeVal, color: machine.uptime >= 97 ? 'var(--success)' : machine.uptime >= 93 ? 'var(--warning)' : 'var(--danger)' }}>{machine.uptime}%</span>
              </div>
              <div style={S.uptimeTrack}>
                <div style={{ ...S.uptimeBar, width: `${machine.uptime}%`, background: machine.uptime >= 97 ? 'var(--success)' : machine.uptime >= 93 ? 'var(--warning)' : 'var(--danger)' }} />
              </div>
              <div style={S.cardFooter}>
                <span style={S.footerItem}><Calendar size={11} /> Next: {new Date(machine.nextMaintenance).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span style={{ ...S.warrantyBadge, color: machine.warrantyStatus === 'Active' ? 'var(--success)' : 'var(--danger)', background: machine.warrantyStatus === 'Active' ? 'var(--success-light)' : 'var(--danger-light)' }}>
                  <Shield size={10} /> {machine.warrantyStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={S.tableWrap}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Machine</th><th>Manufacturer</th><th>Department</th><th>Status</th><th>Location</th><th>Uptime</th><th>Next Maint.</th><th>Warranty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMachine(m)}>
                  <td style={{ fontWeight: 600 }}>{m.name}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.model}</span></td>
                  <td>{m.manufacturer}</td>
                  <td><span style={{ color: DEPARTMENTS.find(d => d.id === m.department)?.color }}>{DEPARTMENTS.find(d => d.id === m.department)?.icon} {DEPARTMENTS.find(d => d.id === m.department)?.name}</span></td>
                  <td><span style={{ ...S.statusBadge, background: STATUS_MAP[m.status].bg, color: STATUS_MAP[m.status].color }}>{statusIcon(m.status)} {STATUS_MAP[m.status].label}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{m.location}</td>
                  <td style={{ fontWeight: 700, color: m.uptime >= 97 ? 'var(--success)' : m.uptime >= 93 ? 'var(--warning)' : 'var(--danger)' }}>{m.uptime}%</td>
                  <td>{new Date(m.nextMaintenance).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><span style={{ ...S.warrantyBadge, color: m.warrantyStatus === 'Active' ? 'var(--success)' : 'var(--danger)', background: m.warrantyStatus === 'Active' ? 'var(--success-light)' : 'var(--danger-light)' }}><Shield size={10} /> {m.warrantyStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMachine && (
        <div style={S.overlay} onClick={() => setSelectedMachine(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()} className="animate-fade-in-up">
            <button onClick={() => setSelectedMachine(null)} style={S.modalClose}><X size={20} /></button>
            <div style={S.modalHeader}>
              <div style={{ ...S.statusDotLg, background: STATUS_MAP[selectedMachine.status].color, boxShadow: `0 0 12px ${STATUS_MAP[selectedMachine.status].color}` }} />
              <div>
                <h2 style={S.modalTitle}>{selectedMachine.name}</h2>
                <p style={S.modalSub}>{selectedMachine.manufacturer} — {selectedMachine.model}</p>
              </div>
            </div>
            <span style={{ ...S.statusBadge, background: STATUS_MAP[selectedMachine.status].bg, color: STATUS_MAP[selectedMachine.status].color, padding: '6px 14px', fontSize: '0.85rem', display: 'inline-flex', marginBottom: 20 }}>
              {statusIcon(selectedMachine.status)} {STATUS_MAP[selectedMachine.status].label}
            </span>
            <div style={S.modalGrid}>
              <ModalField icon={<Hash size={15}/>} label="Serial Number" value={selectedMachine.serialNumber} />
              <ModalField icon={<MapPin size={15}/>} label="Location" value={selectedMachine.location} />
              <ModalField icon={<Server size={15}/>} label="Department" value={DEPARTMENTS.find(d => d.id === selectedMachine.department)?.name} />
              <ModalField icon={<Activity size={15}/>} label="Uptime" value={`${selectedMachine.uptime}%`} highlight={selectedMachine.uptime >= 97 ? 'var(--success)' : 'var(--warning)'} />
              <ModalField icon={<Calendar size={15}/>} label="Last Maintenance" value={new Date(selectedMachine.lastMaintenance).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <ModalField icon={<Calendar size={15}/>} label="Next Maintenance" value={new Date(selectedMachine.nextMaintenance).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <ModalField icon={<Calendar size={15}/>} label="Purchase Date" value={new Date(selectedMachine.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <ModalField icon={<Shield size={15}/>} label="Warranty" value={selectedMachine.warrantyStatus} highlight={selectedMachine.warrantyStatus === 'Active' ? 'var(--success)' : 'var(--danger)'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statIcon, background: `${color}22`, color }}>{icon}</div>
      <div>
        <div style={{ ...S.statValue, color }}>{value}</div>
        <div style={S.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ModalField({ icon, label, value, highlight }) {
  return (
    <div style={S.modalField}>
      <div style={S.modalFieldIcon}>{icon}</div>
      <div>
        <div style={S.modalFieldLabel}>{label}</div>
        <div style={{ ...S.modalFieldValue, color: highlight || 'var(--text-main)' }}>{value}</div>
      </div>
    </div>
  );
}

const S = {
  container: { maxWidth: 1440, margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', color: 'var(--text-main)' },
  subtitle: { color: 'var(--text-muted)', margin: '6px 0 0', fontSize: '0.95rem' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 12 },
  lastSync: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-sm)' },
  statIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 },

  deptTabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--divider)' },
  deptTab: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'inherit' },
  tabBadge: { fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 8, marginLeft: 2 },

  controls: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', padding: '12px 0', fontSize: '0.9rem', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', width: '100%' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' },
  controlRight: { display: 'flex', gap: 8, alignItems: 'center' },
  select: { padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer', width: 'auto' },
  viewToggle: { display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  viewBtn: { padding: '10px 12px', background: 'var(--surface)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all 0.2s' },
  viewBtnActive: { background: 'var(--primary)', color: '#fff' },

  resultCount: { fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.25s', position: 'relative' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: '50%' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' },
  cardTitle: { fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' },
  cardMfr: { fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px', fontWeight: 500 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 },
  uptimeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  uptimeLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  uptimeVal: { fontSize: '0.85rem', fontWeight: 800 },
  uptimeTrack: { height: 5, borderRadius: 4, background: 'var(--divider)', overflow: 'hidden', marginBottom: 14 },
  uptimeBar: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--divider)' },
  footerItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 },
  warrantyBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 },

  tableWrap: { background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'auto', boxShadow: 'var(--shadow-sm)' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: 'var(--surface)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, maxWidth: 600, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' },
  modalClose: { position: 'absolute', top: 16, right: 16, background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  statusDotLg: { width: 16, height: 16, borderRadius: '50%', flexShrink: 0 },
  modalTitle: { fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' },
  modalSub: { fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0' },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  modalField: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: 'var(--surface-hover)', borderRadius: 12, border: '1px solid var(--divider)' },
  modalFieldIcon: { color: 'var(--primary)', marginTop: 2, flexShrink: 0 },
  modalFieldLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 },
  modalFieldValue: { fontSize: '0.9rem', fontWeight: 700 },
};
