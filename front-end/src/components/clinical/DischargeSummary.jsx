import React from 'react';
import { Printer, ShieldCheck } from 'lucide-react';

export default function DischargeSummary({ patient, dischargeDetails = {} }) {
  if (!patient) return null;

  const meds = patient.prescriptions || patient.medications || [];
  const diagnosis = dischargeDetails.diagnosis || 'As per clinical evaluation during admission.';
  const notes = dischargeDetails.notes || 'Patient stable for discharge. Continue prescribed medications.';
  const followUp = dischargeDetails.followUp
    ? new Date(dischargeDetails.followUp).toLocaleDateString()
    : 'As advised by treating consultant';

  return (
    <div className="discharge-summary-container discharge-summary-preview">
      <div className="discharge-summary-layout printable">
        <div className="discharge-summary-header-row">
          <div>
            <h2>BHARAT HEALTH BRIDGE</h2>
            <p>Multi-Speciality Tertiary Care Hospital</p>
          </div>
          <div className="text-right">
            <div className="font-black text-sm">{new Date().toLocaleDateString()}</div>
            <div className="text-muted-small">REF: {patient.mrn}/DS</div>
          </div>
        </div>

        <div className="discharge-patient-grid">
          <div>
            <div className="discharge-row"><span>PATIENT</span><strong>{patient.patientName || patient.name}</strong></div>
            <div className="discharge-row"><span>MRN</span><strong>{patient.mrn}</strong></div>
            <div className="discharge-row"><span>AGE / GENDER</span><strong>{patient.age}Y / {patient.gender}</strong></div>
          </div>
          <div>
            <div className="discharge-row"><span>WARD</span><strong>{patient.currentWard || 'OPD'}</strong></div>
            <div className="discharge-row"><span>DISCHARGE</span><strong>{new Date().toLocaleDateString()}</strong></div>
            <div className="discharge-row"><span>DOCTOR</span><strong>{patient.assignedDoctor || 'Attending'}</strong></div>
          </div>
        </div>

        <section>
          <h3>Diagnosis</h3>
          <p>{diagnosis}</p>
        </section>

        <section>
          <h3>Clinical notes</h3>
          <p>{notes}</p>
        </section>

        <section>
          <h3>Medications on discharge</h3>
          {meds.length > 0 ? (
            <div className="discharge-meds-list">
              {meds.map((m, i) => (
                <div key={i} className="discharge-med-item">
                  <span>{m.name || m.medicine}</span>
                  <span>{m.dosage || m.dose} · {m.duration || m.days || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No medications listed.</p>
          )}
        </section>

        <section>
          <h3>Follow-up</h3>
          <p>{followUp}</p>
        </section>

        <div className="discharge-footer-sign">
          <ShieldCheck size={32} />
          <span>Treating consultant signature</span>
        </div>
      </div>
    </div>
  );
}
