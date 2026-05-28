import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Play, Activity, MapPin,
  Timer, Zap, Heart, Droplets, RefreshCw, Inbox, Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { isOversightRole } from '../../utils/roles';
import { OPD_DEPARTMENTS, normalizeDepartment } from '../../utils/departments';

import { useLiveQueue } from '../../hooks/useLiveQueue';

const priorityClass = (level) => {
  const u = (level || 'LOW').toUpperCase();
  if (u === 'CRITICAL') return 'critical';
  if (u === 'HIGH') return 'high';
  if (u === 'MEDIUM') return 'medium';
  return 'low';
};

const DepartmentalQueue = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canPickDept = isOversightRole(role);
  const [selectedDept, setSelectedDept] = useState(
    () => normalizeDepartment(user?.department || 'General Medicine')
  );
  const department = canPickDept ? selectedDept : normalizeDepartment(user?.department || 'General Medicine');
  
  const { queueData, loading, refresh: fetchQueue } = useLiveQueue(department, { pollMs: 8000 });
  const [activeTab, setActiveTab] = useState('Waiting');
  const [search, setSearch] = useState('');

  const queue = [...(queueData.waiting || []), ...(queueData.inConsultation || []), ...(queueData.completed || [])];
  const servingNow = queueData.inConsultation?.[0] || null;

  const updateStatus = async (queueId, newStatus) => {
    try {
      let response;
      if (newStatus === 'COMPLETED') {
        response = await fetch(`${API_BASE_URL}/workflow/queue/complete/${queueId}`, {
          method: 'PATCH',
          headers: { 'x-user-id': user?._id || user?.id || '' },
        });
      } else {
        response = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${user._id || user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueId }),
        });
      }
      if (response.ok) fetchQueue();
    } catch (err) {
      console.error('Status Update Error:', err);
    }
  };

  const getFilteredQueue = () => {
    let list = queue;
    if (activeTab === 'Waiting') list = queue.filter((item) => item.status === 'WAITING');
    if (activeTab === 'Active') list = queue.filter((item) => item.status === 'IN_CONSULTATION');
    if (activeTab === 'Completed') list = queue.filter((item) => item.status === 'COMPLETED');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.patientName?.toLowerCase().includes(q) ||
          item.mrn?.toLowerCase().includes(q) ||
          String(item.tokenNumber || '').includes(q),
      );
    }
    return list;
  };

  const waitingCount = queue.filter((p) => p.status === 'WAITING').length;
  const filtered = getFilteredQueue();

  return (
    <div className="hb-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="hb-page-header-icon">
              <MapPin size={28} />
            </div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Department queue</p>
              {canPickDept ? (
                <select
                  className="hb-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(normalizeDepartment(e.target.value))}
                  style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}
                >
                  {OPD_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <h1>{department} console</h1>
              )}
              <p>Operator: {user?.name} · OPD workflow</p>
            </div>
          </div>
          <div className="hb-header-actions">
            <div className="hb-metric-card" style={{ padding: '0.75rem 1.25rem', margin: 0 }}>
              <p className="hb-metric-label">Total waiting</p>
              <p className="hb-metric-value" style={{ fontSize: '1.25rem' }}>{waitingCount}</p>
            </div>
            <button type="button" className="hb-icon-btn" onClick={fetchQueue} aria-label="Refresh">
              <RefreshCw size={20} className={loading ? 'hb-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="hb-layout-2col">
          <div>
            {servingNow ? (
              <section className="hb-hero-active">
                <p className="hb-hero-meta">Serving now</p>
                <h2>{servingNow.patientName}</h2>
                <p className="hb-hero-meta">UHID {servingNow.mrn} · Token {servingNow.tokenNumber}</p>
                <div className="hb-hero-actions">
                  <button
                    type="button"
                    className="hb-btn-white"
                    onClick={() => updateStatus(servingNow.queueId, 'COMPLETED')}
                  >
                    <CheckCircle2 size={18} />
                    Finalize session
                  </button>
                </div>
              </section>
            ) : (
              <section className="hb-hero-idle">
                <Zap size={32} />
                <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800 }}>System idle</h4>
                <p>Ready for incoming patients — {department}</p>
              </section>
            )}

            <section className="hb-section">
              <div className="hb-section-title">
                <div className="hb-tabs" style={{ margin: 0, flex: 1 }}>
                  {['Waiting', 'Active', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`hb-tab ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', minWidth: '200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="hb-select"
                    style={{ paddingLeft: '2.5rem', width: '100%', minWidth: '180px' }}
                    placeholder="Search patients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="hb-card-grid">
                {loading ? (
                  <div className="hb-empty-state">
                    <RefreshCw size={32} className="hb-spin" />
                    <h4>Loading queue</h4>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="hb-empty-state">
                    <Inbox size={40} />
                    <h4>Queue clear</h4>
                    <p>No pending actions for {department}.</p>
                  </div>
                ) : (
                  filtered.map((item) => {
                    const pClass = priorityClass(item.priorityLevel);
                    return (
                      <article key={item.queueId} className={`hb-patient-card priority-${pClass}`}>
                        <div className="hb-patient-card-header">
                          <span className="hb-token">{item.tokenNumber}</span>
                          {item.priorityLevel === 'CRITICAL' && (
                            <span className={`hb-priority-pill ${pClass}`}>Critical</span>
                          )}
                        </div>
                        <h4 className="hb-patient-name">{item.patientName}</h4>
                        <p className="hb-patient-meta">MRN {item.mrn} · Arrival {item.time}</p>
                        <div className="hb-patient-card-footer">
                          <span className="hb-time-label">
                            <Timer size={12} />
                            {item.waitTime || '—'}m dwell
                          </span>
                          {item.status === 'WAITING' && (
                            <button
                              type="button"
                              className="hb-card-btn primary"
                              onClick={() => updateStatus(item.queueId, 'IN_CONSULTATION')}
                            >
                              <Play size={12} />
                              Call next
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <aside>
            <section className="hb-section">
              <div className="hb-section-title">
                <h2><Activity size={20} /> Department analytics</h2>
              </div>
              <div className="hb-metrics-row" style={{ marginBottom: 0 }}>
                {[
                  { label: 'Waiting', value: String(waitingCount), icon: Heart },
                  { label: 'In consultation', value: String(queue.filter((q) => q.status === 'IN_CONSULTATION').length), icon: Activity },
                  { label: 'Completed today', value: String(queue.filter((q) => q.status === 'COMPLETED').length), icon: Timer },
                ].map((stat) => (
                  <div key={stat.label} className="hb-metric-card">
                    <div className="hb-metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <stat.icon size={18} />
                    </div>
                    <p className="hb-metric-label">{stat.label}</p>
                    <p className="hb-metric-value" style={{ fontSize: '1.25rem' }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="hb-hero-active" style={{ marginTop: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Live sync</h2>
              <p className="hb-hero-meta" style={{ marginTop: '0.5rem' }}>
                Queue refreshes every 15 seconds. Bharat Health Bridge — {department}.
              </p>
              <Droplets size={80} style={{ position: 'absolute', right: '-1rem', bottom: '-1rem', opacity: 0.15 }} />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DepartmentalQueue;
