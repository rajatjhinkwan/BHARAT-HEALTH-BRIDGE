import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { apiJson } from '../../../../utils/api';

const TIME_SLOTS = [];
for (let h = 9; h < 17; h++) {
  for (const m of [0, 30]) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export default function EmrFollowUpModal({
  open,
  onClose,
  onConfirm,
  department,
  loading,
  defaultDoctorId,
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [reason, setReason] = useState('Follow-up consultation');
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(defaultDoctorId || '');
  const [slots, setSlots] = useState([]);
  const [useManualTime, setUseManualTime] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await apiJson(
          `/catalog/doctors?department=${encodeURIComponent(department || 'General Medicine')}`
        );
        setDoctors(list);
        const pick =
          list.find((d) => d.employeeId === defaultDoctorId)?.employeeId ||
          list[0]?.employeeId ||
          '';
        setDoctorId(pick);
      } catch {
        setDoctors([]);
      }
    })();
  }, [open, department, defaultDoctorId]);

  useEffect(() => {
    if (!open || !doctorId || !date || useManualTime) {
      Promise.resolve().then(() => setSlots([]));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson(
          `/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${date}`
        );
        if (!cancelled) {
          const available = (data.slots || []).filter((s) => s.available).map((s) => s.time);
          setSlots(available);
          setTime(available[0] || TIME_SLOTS[0]);
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
          setUseManualTime(true);
          setTime(TIME_SLOTS[0]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [open, doctorId, date, useManualTime]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!doctorId) {
      setError('Select a doctor for the follow-up.');
      return;
    }
    if (!time) {
      setError('Select a time slot.');
      return;
    }
    try {
      await onConfirm({
        appointmentDate: date,
        appointmentTime: time,
        reason,
        department,
        doctorId,
      });
    } catch (err) {
      setError(err.message || 'Could not book appointment');
    }
  };

  return (
    <div className="emr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="emr-modal emr-followup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emr-modal-header">
          <h2><Calendar size={20} /> Schedule follow-up</h2>
          <button type="button" className="emr-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="emr-vitals-form">
          <label className="emr-form-row span-2">
            <span>Doctor</span>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
              {doctors.length === 0 && <option value="">Loading doctors…</option>}
              {doctors.map((d) => (
                <option key={d.employeeId} value={d.employeeId}>
                  {d.name} · {d.department}
                </option>
              ))}
            </select>
          </label>
          <label className="emr-form-row">
            <span>Date</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="emr-form-row">
            <span>Time</span>
            {useManualTime || slots.length === 0 ? (
              <select value={time} onChange={(e) => setTime(e.target.value)} required>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <select value={time} onChange={(e) => setTime(e.target.value)} required>
                {slots.map((t) => (
                  <option key={t} value={t}>{t} (available)</option>
                ))}
              </select>
            )}
          </label>
          {!useManualTime && slots.length === 0 && doctorId && (
            <p className="emr-form-hint span-2">
              No live availability — pick a standard slot below or enable manual time.
            </p>
          )}
          <label className="emr-form-row span-2">
            <span>Reason</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </label>
          {error && <p className="emr-form-error span-2">{error}</p>}
          <div className="emr-modal-actions span-2">
            <button type="button" className="emr-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="emr-btn-primary" disabled={loading || !doctorId}>
              {loading ? 'Booking…' : 'Book follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
