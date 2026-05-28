import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { apiJson } from '../../utils/api';

/**
 * Vitals are typically recorded by nurses at triage / nurse station.
 * Doctors and admins can also update vitals during an active EMR consultation.
 */
export default function EmrVitalsModal({ patient, recordedBy, onClose, onSaved }) {
  const v = patient?.vitals || {};
  const [form, setForm] = useState({
    bp: v.bp && v.bp !== '--' ? v.bp : '',
    heartRate: v.heartRate || v.hr || '',
    temp: v.temp && v.temp !== '--' ? String(v.temp).replace('°F', '') : '',
    spo2: v.spo2 && v.spo2 !== '--' ? String(v.spo2).replace('%', '') : '',
    respiratoryRate: v.respiratoryRate || '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient?._id) return;
    setLoading(true);
    setError('');
    try {
      await apiJson('/clinical/vitals', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patient._id,
          vitals: {
            bp: form.bp,
            heartRate: form.heartRate,
            hr: form.heartRate,
            temp: form.temp,
            spo2: form.spo2,
            respiratoryRate: form.respiratoryRate || undefined,
            recordedBy: recordedBy || 'Clinical staff',
            notes: form.notes,
          },
        }),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emr-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vitals-modal-title">
      <div className="emr-modal emr-vitals-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emr-modal-header">
          <div>
            <h2 id="vitals-modal-title">Record patient vitals</h2>
            <p className="emr-modal-subtitle">
              {patient?.name || patient?.patientName} · MRN {patient?.mrn}
            </p>
            <p className="emr-vitals-hint">
              Nurses usually capture vitals at registration or the nurse station. Updates here sync to the live EMR and timeline.
            </p>
          </div>
          <button type="button" className="emr-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form className="emr-vitals-form" onSubmit={handleSubmit}>
          <div className="emr-vitals-form-grid">
            <label className="emr-form-row span-2">
              <span>Blood pressure (mmHg)</span>
              <input
                required
                placeholder="128/84"
                value={form.bp}
                onChange={(e) => setForm({ ...form, bp: e.target.value })}
              />
            </label>
            <label className="emr-form-row">
              <span>Heart rate (bpm)</span>
              <input
                required
                type="number"
                min="30"
                max="220"
                placeholder="76"
                value={form.heartRate}
                onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
              />
            </label>
            <label className="emr-form-row">
              <span>SpO₂ (%)</span>
              <input
                required
                type="number"
                min="50"
                max="100"
                placeholder="97"
                value={form.spo2}
                onChange={(e) => setForm({ ...form, spo2: e.target.value })}
              />
            </label>
            <label className="emr-form-row">
              <span>Temperature (°F)</span>
              <input
                required
                placeholder="98.6"
                value={form.temp}
                onChange={(e) => setForm({ ...form, temp: e.target.value })}
              />
            </label>
            <label className="emr-form-row">
              <span>Resp. rate (optional)</span>
              <input
                type="number"
                placeholder="16"
                value={form.respiratoryRate}
                onChange={(e) => setForm({ ...form, respiratoryRate: e.target.value })}
              />
            </label>
            <label className="emr-form-row span-2">
              <span>Observation notes (optional)</span>
              <textarea
                rows={2}
                placeholder="Patient stable, no acute distress…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </div>

          {error && <p className="emr-form-error">{error}</p>}

          <div className="emr-modal-actions">
            <button type="button" className="emr-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="emr-btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Saving…' : 'Save vitals to EMR'}
            </button>
          </div>
        </form>

        <p className="emr-vitals-recorded-by">
          <Activity size={14} />
          Recording as: <strong>{recordedBy || 'Clinical staff'}</strong>
        </p>
      </div>
    </div>
  );
}
