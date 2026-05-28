import React, { useState } from 'react';
import {
  Share2, Image as ImageIcon, Activity, Scissors, Heart, TestTube,
  ChevronRight, User, Stethoscope, ArrowLeft, Send,
} from 'lucide-react';

const departments = [
  { name: 'General Medicine', icon: Stethoscope, color: '#64748b', desc: 'Routine checkups & general health' },
  { name: 'Cardiology', icon: Heart, color: '#ef4444', desc: 'Heart & vascular diagnosis' },
  { name: 'Neurology', icon: Activity, color: '#8b5cf6', desc: 'Brain & nervous system' },
  { name: 'Orthopedics', icon: Scissors, color: '#f59e0b', desc: 'Bone, joint & muscle care' },
  { name: 'ENT', icon: Activity, color: '#14b8a6', desc: 'Ear, nose & throat' },
  { name: 'Pediatrics', icon: User, color: '#10b981', desc: "Children's health" },
  { name: 'Dermatology', icon: Activity, color: '#f97316', desc: 'Skin treatments' },
  { name: 'Laboratory', icon: TestTube, color: '#ec4899', desc: 'Lab tests & analysis' },
  { name: 'Radiology', icon: ImageIcon, color: '#3b82f6', desc: 'Imaging & reports' },
  { name: 'Emergency', icon: Activity, color: '#b91c1c', desc: 'Critical care' },
  { name: 'Psychiatry', icon: Activity, color: '#6366f1', desc: 'Mental health' },
  { name: 'Oncology', icon: Activity, color: '#7c3aed', desc: 'Cancer care' },
];

export default function ReferralPanel({ handleReferral, submitting = false }) {
  const [selectedDept, setSelectedDept] = useState(null);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!selectedDept || !reason.trim() || submitting) return;
    setError('');
    try {
      await handleReferral(selectedDept.name, reason, priority);
    } catch (err) {
      setError(err.message || 'Referral could not be completed');
    }
  };

  return (
    <div className="referral-panel">
      <div className="referral-panel-inner">
        {!selectedDept ? (
          <>
            <div className="referral-panel-header">
              <div className="referral-panel-icon-wrap">
                <Share2 size={24} />
              </div>
              <div>
                <h3>Departmental referral</h3>
                <p>Select a department for further evaluation.</p>
              </div>
            </div>
            <div className="referral-grid">
              {departments.map((dept) => {
                const Icon = dept.icon;
                return (
                  <button
                    key={dept.name}
                    type="button"
                    className="referral-card"
                    onClick={() => setSelectedDept(dept)}
                  >
                    <div className="referral-card-icon" style={{ background: `${dept.color}18`, color: dept.color }}>
                      <Icon size={28} />
                    </div>
                    <div className="referral-card-title">{dept.name}</div>
                    <div className="referral-card-desc">{dept.desc}</div>
                    <div className="referral-card-cta">Select <ChevronRight size={12} /></div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="referral-form-container">
            <button type="button" className="referral-back-btn" onClick={() => setSelectedDept(null)}>
              <ArrowLeft size={16} /> Back to departments
            </button>
            <div className="referral-selected-banner">
              {(() => {
                const Icon = selectedDept.icon;
                return (
                  <div className="referral-card-icon" style={{ background: `${selectedDept.color}18`, color: selectedDept.color }}>
                    <Icon size={28} />
                  </div>
                );
              })()}
              <div>
                <h2>Refer to {selectedDept.name}</h2>
                <p>{selectedDept.desc}</p>
              </div>
            </div>
            <div className="emr-form-row">
              <label>Clinical reason <span className="emr-required">*</span></label>
              <textarea
                className="emr-textarea"
                placeholder="Reason for referral…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="emr-form-row">
              <label>Priority</label>
              <div className="referral-priority-row">
                {[
                  { value: 'Routine', label: 'Routine' },
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'Emergency', label: 'Emergency' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`referral-priority-btn ${priority === value ? `active ${value.toLowerCase()}` : ''}`}
                    onClick={() => setPriority(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="emr-form-error">{error}</p>}
            <button
              type="button"
              className="emr-btn-primary emr-btn-full"
              onClick={onSubmit}
              disabled={!reason.trim() || submitting}
            >
              <Send size={18} /> {submitting ? 'Sending referral…' : 'Confirm & send referral'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
