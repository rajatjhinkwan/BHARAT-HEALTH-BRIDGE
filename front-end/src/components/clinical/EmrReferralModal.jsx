import React from 'react';
import { X } from 'lucide-react';
import ReferralPanel from './ReferralPanel';

export default function EmrReferralModal({ open, onClose, handleReferral, submitting = false }) {
  if (!open) return null;

  return (
    <div className="emr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Department referral">
      <div className="emr-modal emr-referral-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emr-modal-header emr-referral-modal-header">
          <div>
            <h2>Refer to another department</h2>
            <p className="emr-modal-subtitle">
              Patient is moved to the target department queue. Their current consultation queue entry is completed when applicable.
            </p>
          </div>
          <button type="button" className="emr-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="emr-referral-modal-body">
          <ReferralPanel handleReferral={handleReferral} submitting={submitting} />
        </div>
      </div>
    </div>
  );
}
