import React from 'react';
import { Activity, FlaskConical, Image as ImageIcon, Scissors, Droplets, LogOut } from 'lucide-react';
import { canDischargePatient } from '../utils/patientStatus';

export default function EmrClinicalMovement({
  patient,
  emergencyCase,
  actionLoading,
  selectedWard,
  setSelectedWard,
  wardsList,
  hasClinicalPatient,
  onEmergencyStatus,
  onAdmit,
  onQuickIcu,
  onQuickVent,
  onRefer,
  onFollowUp,
  onDischarge,
  onServiceOrder,
}) {
  if (emergencyCase) {
    return (
      <div className="action-pad-card emergency-protocol-card">
        <div className="pad-title-row">
          <h3 className="pad-title pad-title-danger">Emergency protocol</h3>
          <Activity size={18} />
        </div>
        <div className="emergency-status-actions">
          <button type="button" className="er-action-btn" disabled={actionLoading} onClick={() => onEmergencyStatus('IN ICU')}>Send to ICU</button>
          <button type="button" className="er-action-btn" disabled={actionLoading} onClick={() => onEmergencyStatus('ON VENTILATOR')}>Ventilator</button>
          <button type="button" className="er-action-btn" disabled={actionLoading} onClick={() => onEmergencyStatus('LAB PENDING')}>Send to lab</button>
          <button type="button" className="er-action-btn primary-action" disabled={actionLoading} onClick={() => onEmergencyStatus('ADMITTED')}>Admit patient</button>
          <button type="button" className="er-action-btn span-2" disabled={!hasClinicalPatient} onClick={onRefer}>Refer department</button>
          <button type="button" className="er-action-btn discharge span-2" disabled={actionLoading} onClick={() => onEmergencyStatus('DISCHARGED')}>Discharge</button>
        </div>
        <div className="er-status-box">
          <label>Current status</label>
          <span>{emergencyCase.currentStatus}</span>
        </div>
      </div>
    );
  }

  if (!hasClinicalPatient) return null;

  const showDischarge = canDischargePatient(patient);

  return (
    <>
      <div className="action-pad-card critical-movement-card emr-movement-card">
        <div className="pad-title-row">
          <h3 className="pad-title pad-title-primary">Clinical movement</h3>
          <Activity size={18} />
        </div>
        {patient.currentStatus && (
          <span className="patient-status-chip">
            {patient.currentStatus}
            {patient.currentWard ? ` · ${patient.currentWard}` : ''}
          </span>
        )}
        <label className="ward-select-label">Target ward / department</label>
        <select className="emr-ward-select" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
          {wardsList.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <div className="emergency-status-actions">
          <button type="button" className="er-action-btn primary-action span-2" disabled={actionLoading} onClick={onAdmit}>
            Admit to ward
          </button>
          <button type="button" className="er-action-btn" disabled={actionLoading} onClick={onQuickIcu}>Quick ICU</button>
          <button type="button" className="er-action-btn" disabled={actionLoading} onClick={onQuickVent}>Quick vent</button>
          <button type="button" className="er-action-btn span-2" onClick={onRefer}>Refer to department</button>
          <button type="button" className="er-action-btn followup-action span-2" onClick={onFollowUp} disabled={actionLoading}>
            Schedule follow-up
          </button>
          {showDischarge ? (
            <button type="button" className="er-action-btn discharge span-2 emr-btn-with-icon" onClick={onDischarge} disabled={actionLoading}>
              <LogOut size={14} />
              Discharge patient
            </button>
          ) : (
            <p className="emr-movement-hint span-2">
              Discharge is available after the patient is admitted to a ward (bed assigned).
            </p>
          )}
        </div>
      </div>

      <div className="action-pad-card emr-service-orders-card">
        <h3 className="pad-title">Service orders</h3>
        <div className="pad-grid pad-grid-compact">
          <button type="button" className="pad-btn" onClick={() => onServiceOrder('LAB')}>
            <div className="pad-btn-icon lab"><FlaskConical size={16} /></div>
            <span className="pad-btn-label">Order lab</span>
          </button>
          <button type="button" className="pad-btn" onClick={() => onServiceOrder('RAD')}>
            <div className="pad-btn-icon rad"><ImageIcon size={16} /></div>
            <span className="pad-btn-label">Radiology</span>
          </button>
          <button type="button" className="pad-btn" onClick={() => onServiceOrder('SURGERY')}>
            <div className="pad-btn-icon surg"><Scissors size={16} /></div>
            <span className="pad-btn-label">Surgery</span>
          </button>
          <button type="button" className="pad-btn" onClick={() => onServiceOrder('SESSION')}>
            <div className="pad-btn-icon dial"><Droplets size={16} /></div>
            <span className="pad-btn-label">Dialysis</span>
          </button>
        </div>
      </div>
    </>
  );
}
