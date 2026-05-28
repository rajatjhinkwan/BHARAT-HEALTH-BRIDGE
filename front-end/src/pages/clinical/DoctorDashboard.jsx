import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Play, CheckCircle2, Activity,
  RefreshCw, Timer, ExternalLink, Stethoscope, Inbox, AlertCircle, UserCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { getDoctorHeaders } from '../../utils/api';
import { normalizeDepartment } from '../../utils/departments';
import { useLiveQueue } from '../../hooks/useLiveQueue';
import { useDoctorLabNotifications } from '../../modules/laboratory/hooks/useDoctorLabNotifications';
import { useDoctorRadiologyNotifications } from '../../modules/radiology/hooks/useDoctorRadiologyNotifications';

const priorityClass = (level) => {
  const u = (level || 'LOW').toUpperCase();
  if (u === 'CRITICAL') return 'critical';
  if (u === 'HIGH') return 'high';
  if (u === 'MEDIUM') return 'medium';
  return 'low';
};

function ConsultationTimer({ startTime }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return undefined;
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="hb-time-label">
      <Timer size={14} className="hb-spin" />
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function QueuePatientCard({ patient, className = '', footer }) {
  const pClass = priorityClass(patient.priorityLevel);
  return (
    <article className={`hb-patient-card priority-${pClass} ${className}`.trim()}>
      <div className="hb-patient-card-header">
        <span className="hb-token">{patient.tokenNumber}</span>
        <span className={`hb-priority-pill ${pClass}`}>{patient.priorityLevel || 'NORMAL'}</span>
      </div>
      <h4 className="hb-patient-name">{patient.patientName}</h4>
      <p className="hb-patient-meta">
        {patient.mrn}
        {patient.age ? ` · ${patient.age}Y` : ''}
        {patient.gender ? ` / ${patient.gender}` : ''}
      </p>
      {patient.symptoms && (
        <div className="hb-patient-symptoms">&ldquo;{patient.symptoms}&rdquo;</div>
      )}
      <div className="hb-patient-card-footer">
        <span className="hb-time-label"><Clock size={12} /> {patient.time}</span>
        {footer}
      </div>
    </article>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const department = normalizeDepartment(user?.department || 'General Medicine');

  // Generate date list from today to 7 days ahead (8 days total)
  const getDatesWindow = () => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      dates.push({
        dateStr,
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const datesWindow = getDatesWindow();
  const [selectedDate, setSelectedDate] = useState(datesWindow[0].dateStr);

  const { queueData, loading, error, refresh } = useLiveQueue(department, { date: selectedDate });
  const { notifications: labNotifications, unread: labUnread } = useDoctorLabNotifications();
  const { notifications: radNotifications, unread: radUnread } = useDoctorRadiologyNotifications();

  const openEmr = (node) => {
    navigate('/emr', {
      state: {
        selectedPatient: {
          _id: node.patientId,
          patientName: node.patientName,
          queueId: node.queueId,
          tokenNumber: node.tokenNumber,
        },
      },
    });
  };

  const handleStartConsultation = async (queueId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/queue/start/${queueId}`, {
        method: 'PATCH',
        headers: getDoctorHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        refresh();
        openEmr(data);
      } else {
        alert(data.message || 'Could not start consultation');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleCallNext = async () => {
    const doctorId = user?._id || user?.id;
    if (!doctorId) {
      alert('Session expired. Please log in again.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${doctorId}`, {
        method: 'PATCH',
        headers: getDoctorHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        refresh();
        openEmr(data);
      } else {
        alert(data.message || 'No patients waiting.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (queueId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/queue/complete/${queueId}`, {
        method: 'PATCH',
        headers: getDoctorHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        refresh();
      } else {
        alert(data.message || 'Could not complete consultation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeSession = queueData.inConsultation?.find(
    (p) => p.doctor === user?.name && p.status === 'IN_CONSULTATION',
  );
  const myCompleted = queueData.completed?.filter((p) => p.doctor === user?.name) || [];
  const hasActive = !!activeSession;
  const waiting = queueData.waiting || [];
  const inConsultation = queueData.inConsultation || [];

  return (
    <div className="hb-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div className="hb-page-header-row">
            <div className="hb-page-header-icon">
              <Stethoscope size={28} />
            </div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Clinical operations</p>
              <h1>OPD queue management</h1>
              <p>
                {department}
                {' · '}
                Queue for {datesWindow.find(d => d.dateStr === selectedDate)?.fullLabel || selectedDate}
              </p>
            </div>
          </div>
          <div className="hb-header-actions">
            {error && (
              <span className="hb-error-label">
                <AlertCircle size={14} />
                {error}
              </span>
            )}
            <button
              type="button"
              className="hb-btn-primary"
              onClick={handleCallNext}
              disabled={hasActive || waiting.length === 0}
            >
              <Play size={16} />
              Call next
            </button>
            <button type="button" className="hb-icon-btn" onClick={() => navigate('/doctor/profile')} aria-label="Doctor profile" title="Manage profile">
              <UserCircle size={20} />
            </button>
            <button type="button" className="hb-icon-btn" onClick={refresh} aria-label="Refresh">
              <RefreshCw size={20} className={loading ? 'hb-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Horizontal Date Selector */}
        <div className="hb-date-selector-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
          {datesWindow.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                className={`hb-date-btn ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '1rem',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1e40af' : '#64748b',
                  cursor: 'pointer',
                  minWidth: '75px',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onClick={() => setSelectedDate(d.dateStr)}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', color: isSelected ? '#2563eb' : '#94a3b8' }}>{d.label}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isSelected ? '#1e3a8a' : '#1e293b', lineHeight: 1 }}>{d.dayNum}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isSelected ? '#2563eb' : '#64748b', marginTop: '0.25rem' }}>{d.month}</span>
              </button>
            );
          })}
        </div>

        {labUnread > 0 && (
          <div className="hb-lab-notify-banner" role="status">
            <Activity size={18} />
            <span>
              {labUnread} lab report{labUnread > 1 ? 's' : ''} ready
              {labNotifications[0]?.isCritical ? ' — includes critical values' : ''}
            </span>
            <button
              type="button"
              className="hb-btn-secondary"
              onClick={() => navigate('/emr')}
            >
              Review in EMR
            </button>
          </div>
        )}

        {radUnread > 0 && (
          <div className="hb-lab-notify-banner" style={{ borderColor: 'rgba(14, 165, 233, 0.4)', background: 'rgba(14, 165, 233, 0.08)' }} role="status">
            <Activity size={18} />
            <span>
              {radUnread} radiology report{radUnread > 1 ? 's' : ''} ready
              {radNotifications[0]?.isCritical ? ' — includes critical findings' : ''}
            </span>
            <button type="button" className="hb-btn-secondary" onClick={() => navigate('/emr')}>
              Review in EMR
            </button>
          </div>
        )}

        <div className="hb-metrics-row">
          <div className="hb-metric-card">
            <div className="hb-metric-icon warn">
              <Users size={20} />
            </div>
            <p className="hb-metric-label">Waiting</p>
            <p className="hb-metric-value">{waiting.length}</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon blue">
              <Activity size={20} />
            </div>
            <p className="hb-metric-label">In consultation</p>
            <p className="hb-metric-value">{inConsultation.length}</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon green">
              <CheckCircle2 size={20} />
            </div>
            <p className="hb-metric-label">My completed</p>
            <p className="hb-metric-value">{myCompleted.length}</p>
          </div>
        </div>

        <div className="hb-layout-3col">
          <section className="hb-section">
            <div className="hb-section-title">
              <h2><Users size={20} /> Waiting</h2>
              <span className="hb-badge-count">{waiting.length}</span>
            </div>
            <div className="hb-card-grid">
              {waiting.length > 0 ? (
                waiting.map((p) => (
                  <QueuePatientCard
                    key={p.queueId}
                    patient={p}
                    footer={(
                      <button
                        type="button"
                        className="hb-card-btn primary"
                        onClick={() => handleStartConsultation(p.queueId)}
                        disabled={hasActive}
                      >
                        <Play size={12} />
                        Start
                      </button>
                    )}
                  />
                ))
              ) : (
                <div className="hb-empty-state">
                  <Inbox size={40} />
                  <h4>Queue clear</h4>
                  <p>New registrations from reception will appear here.</p>
                </div>
              )}
            </div>
          </section>

          <section className="hb-section">
            <div className="hb-section-title">
              <h2><Stethoscope size={20} /> In consultation</h2>
              <span className={`hb-badge-count ${hasActive ? 'active' : ''}`}>
                {hasActive ? 'Active' : 'Idle'}
              </span>
            </div>
            {activeSession ? (
              <article className="hb-patient-card active-session">
                <div className="hb-patient-card-header">
                  <span className="hb-token">{activeSession.tokenNumber}</span>
                  <ConsultationTimer startTime={activeSession.consultationStartTime} />
                </div>
                <h4 className="hb-patient-name">{activeSession.patientName}</h4>
                <p className="hb-patient-meta">UHID {activeSession.mrn}</p>
                {activeSession.symptoms && (
                  <div className="hb-patient-symptoms">
                    &ldquo;{activeSession.symptoms}&rdquo;
                  </div>
                )}
                <div className="hb-hero-actions hb-critical-card-actions">
                  <button type="button" className="hb-btn-secondary" onClick={() => openEmr(activeSession)}>
                    <ExternalLink size={16} />
                    Open EMR
                  </button>
                  <button
                    type="button"
                    className="hb-btn-primary"
                    onClick={() => handleComplete(activeSession.queueId)}
                  >
                    <CheckCircle2 size={18} />
                    Complete
                  </button>
                </div>
              </article>
            ) : (
              <div className="hb-hero-idle">
                <Activity size={32} />
                <p>Select a waiting patient or use Call next to begin.</p>
              </div>
            )}
          </section>

          <section className="hb-section">
            <div className="hb-section-title">
              <h2><CheckCircle2 size={20} /> Completed</h2>
              <span className="hb-badge-count">{myCompleted.length}</span>
            </div>
            <div className="hb-card-grid">
              {myCompleted.length > 0 ? (
                myCompleted.map((p) => (
                  <QueuePatientCard
                    key={p.queueId}
                    patient={p}
                    footer={(
                      <span className="hb-time-label">
                        <Clock size={12} />
                        {p.consultationEndTime
                          ? new Date(p.consultationEndTime).toLocaleTimeString()
                          : 'Done'}
                      </span>
                    )}
                  />
                ))
              ) : (
                <div className="hb-empty-state">
                  <Inbox size={40} />
                  <h4>No history</h4>
                  <p>Completed sessions appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
