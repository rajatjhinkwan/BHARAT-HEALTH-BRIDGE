import React from 'react';
import { Clock, Activity, ArrowRight, UserCheck, Heart, FileText, Pill } from 'lucide-react';

export default function PatientTimeline({ timeline = [], historyRecords = [] }) {
  const historyEvents = (historyRecords || []).map((r) => ({
    action: r.type?.replace(/_/g, ' ').toUpperCase() || 'RECORD',
    details: r.title,
    department: r.hospital || 'Clinical',
    performedBy: r.doctor || 'System',
    timestamp: r.createdAt,
  }));

  const merged = [...(timeline || []), ...historyEvents].sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );

  if (merged.length === 0) {
    return (
      <div className="timeline-empty">
        <Clock size={48} />
        <p>No timeline data available</p>
      </div>
    );
  }

  const getIcon = (action) => {
    const a = (action || '').toUpperCase();
    if (a.includes('REGISTER')) return <UserCheck size={14} />;
    if (a.includes('ADMIT') || a.includes('DISCHARGE')) return <ArrowRight size={14} />;
    if (a.includes('VITALS')) return <Activity size={14} />;
    if (a.includes('PRESCRIPTION')) return <Pill size={14} />;
    if (a.includes('REPORT') || a.includes('LAB')) return <FileText size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="patient-timeline-container p-6">
      <h3 className="timeline-section-title">
        <Heart size={16} />
        Master Patient Journey
      </h3>

      <div className="timeline-list">
        {merged.map((event, idx) => (
          <div key={idx} className="timeline-event">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="timeline-event-icon">{getIcon(event.action)}</div>
                <span className="timeline-event-action">{event.action}</span>
              </div>
              <span className="timeline-event-time">
                {event.timestamp
                  ? new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : '—'}
              </span>
            </div>
            <p className="timeline-event-details">{event.details}</p>
            <div className="timeline-event-meta">
              <span>Dept: {event.department}</span>
              <span>By: {event.performedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
