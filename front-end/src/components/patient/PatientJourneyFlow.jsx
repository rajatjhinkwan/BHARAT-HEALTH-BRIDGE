import React from 'react';
import { GitBranch, CheckCircle2, Clock3, FlaskConical, ScanSearch, Landmark } from 'lucide-react';

function formatTime(value) {
  if (!value) return 'Pending';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Pending';
  return dt.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function getBranchIcon(type) {
  const upper = (type || '').toUpperCase();
  if (upper === 'LABORATORY') return <FlaskConical size={14} />;
  if (upper === 'RADIOLOGY') return <ScanSearch size={14} />;
  return <Landmark size={14} />;
}

function normalizeFlow(journey = {}) {
  const timelineSteps = Array.isArray(journey.steps) ? journey.steps : [];
  const branches = Array.isArray(journey.branches) ? journey.branches : [];
  const queueTransitions = Array.isArray(journey.queueTransitions) ? journey.queueTransitions : [];

  const flowSteps = [];

  if (queueTransitions.length > 0) {
    const activeQueue = queueTransitions[queueTransitions.length - 1];
    flowSteps.push({
      id: 'queue-active',
      title: `Queue: ${activeQueue.department || 'Department'}`,
      detail: `${activeQueue.tokenNumber || 'Token pending'} · ${activeQueue.status || 'WAITING'}`,
      timestamp: activeQueue.updatedAt,
      done: ['COMPLETED', 'REFERRED'].includes((activeQueue.status || '').toUpperCase()),
    });
  }

  timelineSteps.slice(-5).forEach((step) => {
    flowSteps.push({
      id: step.id,
      title: step.action || 'Clinical update',
      detail: step.details || step.department || 'Clinical',
      timestamp: step.timestamp,
      done: true,
    });
  });

  if (branches.length > 0) {
    flowSteps.push({
      id: 'branch-marker',
      title: 'Parallel service referrals',
      detail: 'Doctor can send multiple departments in parallel',
      timestamp: null,
      done: false,
      markerOnly: true,
    });
  }

  return { flowSteps, branches: branches.slice(-6) };
}

export default function PatientJourneyFlow({ journey }) {
  const { flowSteps, branches } = normalizeFlow(journey);

  if (flowSteps.length === 0 && branches.length === 0) {
    return <p className="muted">Your care journey will appear here once consultation starts.</p>;
  }

  return (
    <div className="pp-flow">
      <div className="pp-flow-steps">
        {flowSteps.map((step, idx) => (
          <div className="pp-flow-step" key={step.id || idx}>
            {!step.markerOnly ? (
              <div className={`pp-flow-dot ${step.done ? 'done' : ''}`}>
                {step.done ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
              </div>
            ) : (
              <div className="pp-flow-dot branch"><GitBranch size={13} /></div>
            )}
            <div className="pp-flow-step-body">
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
              {step.timestamp && <small>{formatTime(step.timestamp)}</small>}
            </div>
          </div>
        ))}
      </div>

      {branches.length > 0 && (
        <div className="pp-branch-grid">
          {branches.map((branch) => (
            <div className="pp-branch-card" key={branch.id}>
              <div className="pp-branch-header">
                <span className="pp-branch-type">{getBranchIcon(branch.type)} {branch.type}</span>
                <span className="pp-status">{branch.status}</span>
              </div>
              <strong>{branch.label}</strong>
              <p>{branch.orderedBy} · Priority: {branch.priority}</p>
              {branch.tokenNumber && <small>Token: {branch.tokenNumber}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
