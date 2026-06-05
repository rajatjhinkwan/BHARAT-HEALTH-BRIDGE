import React from 'react';
import { Plus, X } from 'lucide-react';

const FREQ_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'HS', 'STAT'];

const emptyRow = () => ({ name: '', dose: '', freq: 'TDS', days: '' });

const PrescriptionPanel = ({ structuredMeds, setStructuredMeds }) => {
  const meds = structuredMeds?.length ? structuredMeds : [emptyRow()];

  const updateMed = (index, field, value) => {
    const next = meds.map((med, i) => (i === index ? { ...med, [field]: value } : med));
    setStructuredMeds(next);
  };

  const addRow = () => setStructuredMeds([...meds, emptyRow()]);

  const removeRow = (index) => {
    if (meds.length <= 1) {
      setStructuredMeds([emptyRow()]);
      return;
    }
    setStructuredMeds(meds.filter((_, i) => i !== index));
  };

  return (
    <div className="emr-rx-panel">
      <div className="emr-rx-panel-head">
        <h5 className="emr-rx-panel-title">Prescription Console</h5>
        <button type="button" className="emr-rx-add-btn" onClick={addRow}>
          <Plus size={12} />
          Add row
        </button>
      </div>

      <div className="emr-rx-rows">
        {meds.map((med, i) => (
          <div key={`rx-row-${i}`} className="emr-rx-row medicine-card-advanced">
            <div className="emr-rx-row-head">
              <span className="emr-rx-row-label">Item {i + 1}</span>
              <button
                type="button"
                className="emr-rx-remove-btn"
                onClick={() => removeRow(i)}
                aria-label={`Remove medicine row ${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>

            <div className="emr-rx-fields">
              <input
                type="text"
                placeholder="Medication name"
                className="structured-input emr-rx-input"
                value={med.name}
                onChange={(e) => updateMed(i, 'name', e.target.value)}
              />

              <div className="emr-rx-grid">
                <input
                  type="text"
                  placeholder="Dose (e.g. 500mg)"
                  className="structured-input emr-rx-input emr-rx-input-sm"
                  value={med.dose}
                  onChange={(e) => updateMed(i, 'dose', e.target.value)}
                />
                <select
                  className="structured-input emr-rx-input emr-rx-input-sm emr-rx-select"
                  value={med.freq || 'TDS'}
                  onChange={(e) => updateMed(i, 'freq', e.target.value)}
                >
                  {FREQ_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Days"
                  className="structured-input emr-rx-input emr-rx-input-sm"
                  value={med.days}
                  onChange={(e) => updateMed(i, 'days', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="emr-rx-hint">
        Structured medicines appear in the printed prescription and pharmacy dispense queue.
      </p>
    </div>
  );
};

export default PrescriptionPanel;
