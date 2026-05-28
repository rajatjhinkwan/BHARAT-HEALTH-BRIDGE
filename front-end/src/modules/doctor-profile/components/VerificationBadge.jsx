import React from 'react';
import { ShieldCheck, Clock, XCircle } from 'lucide-react';

export default function VerificationBadge({ status = 'pending', badges = [] }) {
  const config = {
    verified: { icon: ShieldCheck, label: 'Verified', className: 'dhp-verified-badge' },
    pending: { icon: Clock, label: 'Pending', className: 'dhp-status-pill busy' },
    rejected: { icon: XCircle, label: 'Rejected', className: 'dhp-status-pill emergency' },
  };
  const { icon: Icon, label, className } = config[status] || config.pending;

  return (
    <span style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      <span className={className}>
        <Icon size={12} /> {label}
      </span>
      {badges.map((b) => (
        <span key={b} className="dhp-verified-badge">{b}</span>
      ))}
    </span>
  );
}
