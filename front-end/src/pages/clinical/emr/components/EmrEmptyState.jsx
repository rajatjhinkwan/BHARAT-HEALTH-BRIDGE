import React from 'react';
import { User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmrNoPatient() {
  const navigate = useNavigate();
  return (
    <div className="emr-empty-state">
      <User size={56} color="var(--emr-accent)" />
      <h2>No patient selected</h2>
      <p>Open the doctor queue, start a consultation, or select a patient to open the electronic medical record.</p>
      <div className="emr-empty-actions">
        <button type="button" className="emr-btn-primary" onClick={() => navigate('/doctor')}>
          Go to doctor queue
        </button>
        <button type="button" className="emr-btn-secondary" onClick={() => navigate('/emergency')}>
          Emergency dashboard
        </button>
      </div>
    </div>
  );
}

export function EmrLoading() {
  return (
    <div className="emr-empty-state">
      <Activity size={48} className="hb-spin" />
      <p>Loading patient record…</p>
    </div>
  );
}
