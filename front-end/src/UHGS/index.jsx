import React, { useState, useEffect } from 'react';
import HospitalGraph from './components/HospitalGraph';
import NodeDetail from './components/NodeDetail';
import { 
  Activity, ShieldCheck, Search, Bell, ArrowLeft, 
  RefreshCw, Filter, ShieldAlert, User, Calendar, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../utils/api';
import './UHGS.css';

const getActionBadge = (action) => {
  const act = (action || '').toUpperCase();
  if (act.includes('LOGIN')) return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', text: 'AUTH' };
  if (act.includes('DISPENSE') || act.includes('dispensed')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', text: 'PHARMACY' };
  if (act.includes('VITALS')) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', text: 'VITALS' };
  if (act.includes('CONSULTATION') || act.includes('EMR')) return { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', text: 'CLINICAL' };
  if (act.includes('SURGERY')) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', text: 'SURGERY' };
  if (act.includes('LAB') || act.includes('RADIOLOGY') || act.includes('RESULT')) return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', text: 'DIAGNOSTICS' };
  if (act.includes('REFERRAL') || act.includes('REFER')) return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', text: 'REFERRAL' };
  return { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', text: 'SYSTEM' };
};

export default function UHGSContainer() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('ops'); // 'ops' | 'audit'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const navigate = useNavigate();

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const loadAuditLogs = () => {
    setLoading(true);
    setError(null);
    apiJson('/admin/audit-logs')
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load audit logs:', err);
        setError(err.message || 'Failed to fetch logs');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const filteredLogs = logs.filter((log) => {
    const textMatch = 
      (log.actor || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (log.raw || '').toLowerCase().includes(localSearch.toLowerCase());
    
    if (!textMatch) return false;
    if (categoryFilter === 'ALL') return true;
    
    const badge = getActionBadge(log.action || '');
    return badge.text === categoryFilter;
  });

  return (
    <div className={`uhgs-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header / Command Bar */}
      {!isFullscreen && (
        <header className="uhgs-header" style={{ padding: '1rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/admin')} 
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                UHGS <span className="text-primary">Command</span> Center
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Universal Hospital Governance System - Facility Oversight & Logs</p>
            </div>

            {/* Toggle Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.2)', padding: '4px', borderRadius: '12px', marginLeft: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => setActiveTab('ops')}
                style={{
                  background: activeTab === 'ops' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Activity size={15} /> Facility Graph
              </button>
              <button 
                onClick={() => setActiveTab('audit')}
                style={{
                  background: activeTab === 'audit' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <ShieldCheck size={15} /> System Audit Trail
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '0.4rem 0.8rem', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
              SECURE SYSTEM ACTIVE
            </div>
          </div>
        </header>
      )}

      {/* Operations Node Graph View */}
      {activeTab === 'ops' ? (
        <main style={{ position: 'relative' }}>
          <HospitalGraph 
            onNodeSelect={(node) => setSelectedNode(node)} 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
          
          <NodeDetail 
            selectedNode={selectedNode} 
            onClose={() => setSelectedNode(null)} 
          />
        </main>
      ) : (
        /* Security Audit Trail Dashboard */
        <main style={{ padding: '2rem', height: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              
              {/* Category filters */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['ALL', 'AUTH', 'CLINICAL', 'DIAGNOSTICS', 'PHARMACY', 'VITALS', 'REFERRAL', 'SURGERY'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      background: categoryFilter === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: categoryFilter === cat ? '#fff' : '#94a3b8',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Text Search and Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Search size={16} color="#94a3b8" />
                  <input 
                    placeholder="Search logs, actors..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: '200px' }} 
                  />
                </div>
                <button 
                  onClick={loadAuditLogs}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: '#f87171' }}>
                <ShieldAlert size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Logs List Container */}
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600, width: '120px' }}>Date</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600, width: '100px' }}>Time</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600, width: '140px' }}>Category</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600, width: '220px' }}>Actor</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Action details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                          Fetching system audit log nodes from host disk...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                          No audit trail nodes found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, idx) => {
                        const badge = getActionBadge(log.action || '');
                        return (
                          <tr 
                            key={idx} 
                            style={{ 
                              borderBottom: '1px solid rgba(255, 255, 255, 0.02)', 
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                              transition: 'background 0.2s' 
                            }}
                            className="hover-row-effect"
                          >
                            <td style={{ padding: '1rem', color: '#cbd5e1', fontWeight: 500 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={13} color="#64748b" />
                                {log.date || 'Today'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={13} color="#64748b" />
                                {log.timestamp || '—'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                background: badge.bg, 
                                color: badge.color, 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '6px', 
                                fontSize: '0.7rem', 
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                              }}>
                                {badge.text}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                  <User size={12} color="#94a3b8" />
                                </div>
                                {log.actor || 'System Engine'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem', fontSize: '0.85rem' }}>{log.action}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{log.details || log.raw}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Status Footer / Command Summary */}
      {!isFullscreen && activeTab === 'ops' && (
        <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 2rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', zIndex: 40 }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nodes Connected: <span style={{ color: '#fff', fontWeight: 600 }}>12</span></div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Departments: <span style={{ color: '#fff', fontWeight: 600 }}>04</span></div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Staff: <span style={{ color: '#fff', fontWeight: 600 }}>156</span></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latency: <span style={{ color: 'var(--success)', fontWeight: 600 }}>12ms</span></div>
        </footer>
      )}
    </div>
  );
}
