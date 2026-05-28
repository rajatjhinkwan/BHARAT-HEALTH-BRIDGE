import React from 'react';
import DischargeSummary from '../../../../components/clinical/DischargeSummary';

export default function EmrDischargeModal({
  open,
  onClose,
  patient,
  dischargeForm,
  setDischargeForm,
  structuredMeds,
  onConfirm,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="discharge-modal-overlay" onClick={onClose}>
      <div className="discharge-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="discharge-modal-form">
          <h3>Discharge summary</h3>
          <textarea
            placeholder="Diagnosis"
            value={dischargeForm.diagnosis}
            onChange={(e) => setDischargeForm({ ...dischargeForm, diagnosis: e.target.value })}
            rows={2}
          />
          <textarea
            placeholder="Notes / instructions"
            value={dischargeForm.notes}
            onChange={(e) => setDischargeForm({ ...dischargeForm, notes: e.target.value })}
            rows={3}
          />
          <input
            type="date"
            value={dischargeForm.followUp}
            onChange={(e) => setDischargeForm({ ...dischargeForm, followUp: e.target.value })}
          />
          <DischargeSummary
            patient={{ ...patient, patientName: patient.name, prescriptions: structuredMeds.filter((m) => m.name) }}
            dischargeDetails={dischargeForm}
          />
          <div className="discharge-modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-discharge-confirm" onClick={onConfirm} disabled={loading}>
              {loading ? 'Processing…' : 'Confirm discharge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
