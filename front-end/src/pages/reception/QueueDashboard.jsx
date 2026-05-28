import React, { useState } from 'react';
import {
  Users, Clock, CheckCircle2, Activity,
  RefreshCw, Inbox, ListOrdered,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizeDepartment } from '../../utils/departments';
import { useLiveQueue } from '../../hooks/useLiveQueue';

const departments = [
  'General Medicine', 'Cardiology', 'Neurology', 'Nephrology',
  'Orthopedics', 'ENT', 'Dermatology', 'Pediatrics',
  'Gynecology', 'Psychiatry', 'Radiology', 'Oncology',
  'Pulmonology', 'Urology', 'Gastroenterology', 'Endocrinology',
  'Ophthalmology', 'Emergency',
];

const priorityClass = (level) => {
  const u = (level || 'LOW').toUpperCase();
  if (u === 'CRITICAL') return 'critical';
  if (u === 'HIGH') return 'high';
  if (u === 'MEDIUM') return 'medium';
  return 'low';
};

function QueuePatientCard({ patient, footer }) {
  const pClass = priorityClass(patient.priorityLevel);
  return (
    <article className={`hb-patient-card priority-${pClass}`}>
      <div className="hb-patient-card-header">
        <span className="hb-token">{patient.tokenNumber}</span>
        <span className={`hb-priority-pill ${pClass}`}>{patient.priorityLevel || 'NORMAL'}</span>
      </div>
      <h4 className="hb-patient-name">{patient.patientName}</h4>
      <p className="hb-patient-meta">UHID {patient.mrn}</p>
      {patient.symptoms && (
        <div className="hb-patient-symptoms">&ldquo;{patient.symptoms}&rdquo;</div>
      )}
      <div className="hb-patient-card-footer">
        <span className="hb-time-label"><Clock size={12} /> Arrived {patient.time}</span>
        {footer}
      </div>
    </article>
  );
}

function QueueSection({ title, icon, count, patients, emptyTitle, emptySubtitle, renderFooter }) {
  const Icon = icon;
  return (
    <section className="hb-section">
      <div className="hb-section-title">
        <h2>
          {Icon && <Icon size={20} />}
          {title}
        </h2>
        <span className="hb-badge-count">{count}</span>
      </div>
      <div className="hb-card-grid">
        {patients.length > 0 ? (
          patients.map((p) => (
            <QueuePatientCard key={p.queueId} patient={p} footer={renderFooter?.(p)} />
          ))
        ) : (
          <div className="hb-empty-state">
            <Inbox size={40} />
            <h4>{emptyTitle}</h4>
            <p>{emptySubtitle}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function QueueDashboard() {
  const { user } = useAuth();
  const [selectedDept, setSelectedDept] = useState(normalizeDepartment(user?.department || 'General Medicine'));
  const role = (user?.role || '').toUpperCase();
  const watchDept = (role === 'RECEPTIONIST' || role === 'ADMIN' || role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN')
    ? selectedDept
    : normalizeDepartment(user?.department);
  const { queueData, loading, refresh } = useLiveQueue(watchDept);

  const canPickDept = role === 'RECEPTIONIST' || role === 'ADMIN' || role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN';
  const waiting = queueData.waiting || [];
  const inConsultation = queueData.inConsultation || [];
  const completed = queueData.completed || [];

  return (
    <div className="hb-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="hb-page-header-icon">
              <ListOrdered size={28} />
            </div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Reception · Live Queue</p>
              <h1>Department Queue Board</h1>
              <p>
                {watchDept}
                {' · '}
                Updates automatically when patients register at reception
              </p>
            </div>
          </div>
          <div className="hb-header-actions">
            {canPickDept && (
              <select
                className="hb-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(normalizeDepartment(e.target.value))}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            <button type="button" className="hb-icon-btn" onClick={refresh} aria-label="Refresh queue">
              <RefreshCw size={20} className={loading ? 'hb-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="hb-metrics-row">
          <div className="hb-metric-card">
            <div className="hb-metric-icon warn">
              <Users size={20} />
            </div>
            <p className="hb-metric-label">Waiting</p>
            <p className="hb-metric-value">{waiting.length}</p>
            <p className="hb-metric-sub">Registered, not yet called</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon blue">
              <Activity size={20} />
            </div>
            <p className="hb-metric-label">In consultation</p>
            <p className="hb-metric-value">{inConsultation.length}</p>
            <p className="hb-metric-sub">Currently with a doctor</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon green">
              <CheckCircle2 size={20} />
            </div>
            <p className="hb-metric-label">Completed</p>
            <p className="hb-metric-value">{completed.length}</p>
            <p className="hb-metric-sub">Seen today</p>
          </div>
        </div>

        <div className="hb-layout-3col">
        <QueueSection
          title="Waiting"
          icon={Users}
          count={waiting.length}
          patients={waiting}
          emptyTitle="Queue clear"
          emptySubtitle="New registrations from reception will appear here."
        />
        <QueueSection
          title="In consultation"
          icon={Activity}
          count={inConsultation.length}
          patients={inConsultation}
          emptyTitle="No active sessions"
          emptySubtitle="Patients move here when a doctor starts consultation."
          renderFooter={(p) => (p.doctor ? <span className="hb-time-label">{p.doctor}</span> : null)}
        />
        <QueueSection
          title="Completed"
          icon={CheckCircle2}
          count={completed.length}
          patients={completed}
          emptyTitle="No completed visits"
          emptySubtitle="Finished consultations appear here."
          renderFooter={(p) => (
            <span className="hb-time-label">
              <Clock size={12} />
              {p.consultationEndTime
                ? new Date(p.consultationEndTime).toLocaleTimeString()
                : 'Done'}
            </span>
          )}
        />
        </div>
      </div>
    </div>
  );
}
