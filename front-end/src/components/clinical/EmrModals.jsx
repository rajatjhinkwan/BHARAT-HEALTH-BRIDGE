import React, { useState, useEffect } from 'react';
import { Calendar, FlaskConical, X } from 'lucide-react';
import { apiJson } from '../../utils/api';

const LAB_TESTS = ['CBC', 'LFT', 'KFT', 'HbA1c', 'Thyroid Panel', 'Urine Routine'];
const RAD_TYPES = [
  { type: 'MRI', bodyPart: 'Brain' },
  { type: 'MRI', bodyPart: 'Spine' },
  { type: 'CT', bodyPart: 'Brain' },
  { type: 'CT', bodyPart: 'Abdomen' },
  { type: 'X-RAY', bodyPart: 'Chest' },
  { type: 'X-RAY', bodyPart: 'Knee' },
  { type: 'ULTRASOUND', bodyPart: 'Abdomen' },
  { type: 'ULTRASOUND', bodyPart: 'Pelvis' },
];

export function ServiceOrderModal({ open, orderType, onClose, onConfirm, loading }) {
  const [selectedTests, setSelectedTests] = useState(['CBC', 'LFT', 'KFT']);
  const [radType, setRadType] = useState('MRI');
  const [bodyPart, setBodyPart] = useState('Brain');
  const [clinicalQuestion, setClinicalQuestion] = useState('');
  const [procedure, setProcedure] = useState('Minor procedure');
  const [otNumber, setOtNumber] = useState('OT-01');
  const [scheduledDate, setScheduledDate] = useState(
    () => new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [sessionType, setSessionType] = useState('DIALYSIS');
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (orderType === 'LAB') setSelectedTests(['CBC', 'LFT', 'KFT']);
    if (orderType === 'RAD') {
      setRadType('MRI');
      setBodyPart('Brain');
    }
  }, [open, orderType]);

  if (!open || !orderType) return null;

  const toggleTest = (t) => {
    setSelectedTests((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderType === 'LAB') {
      onConfirm({ tests: selectedTests.length ? selectedTests : ['CBC'] });
    } else if (orderType === 'RAD') {
      onConfirm({ type: radType, bodyPart, clinicalQuestion: clinicalQuestion.trim() });
    } else if (orderType === 'SURGERY') {
      onConfirm({
        procedure,
        otNumber,
        scheduledDate: new Date(scheduledDate).toISOString(),
      });
    } else if (orderType === 'SESSION') {
      onConfirm({ type: sessionType, notes: sessionNotes });
    }
  };

  const titles = {
    LAB: 'Order laboratory tests',
    RAD: 'Order radiology',
    SURGERY: 'Schedule surgery',
    SESSION: 'Start specialized session',
  };

  return (
    <div className="emr-modal-overlay" role="dialog" aria-modal="true">
      <div className="emr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emr-modal-header">
          <h3>{titles[orderType]}</h3>
          <button type="button" className="emr-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="emr-modal-body">
          {orderType === 'LAB' && (
            <div className="emr-checkbox-grid">
              {LAB_TESTS.map((t) => (
                <label key={t} className="emr-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(t)}
                    onChange={() => toggleTest(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          )}
          {orderType === 'RAD' && (
            <>
              <div className="emr-form-row">
                <label>Modality</label>
                <select value={radType} onChange={(e) => {
                  setRadType(e.target.value);
                  const preset = RAD_TYPES.find((r) => r.type === e.target.value);
                  if (preset) setBodyPart(preset.bodyPart);
                }}>
                  {['MRI', 'CT', 'X-RAY', 'ULTRASOUND'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="emr-form-row">
                <label>Body region</label>
                <input value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} />
              </div>
              <div className="emr-form-row">
                <label>Clinical question</label>
                <textarea
                  value={clinicalQuestion}
                  onChange={(e) => setClinicalQuestion(e.target.value)}
                  rows={2}
                  placeholder="e.g. Rule out acute intracranial bleed"
                />
              </div>
            </>
          )}
          {orderType === 'SURGERY' && (
            <>
              <div className="emr-form-row">
                <label>Procedure</label>
                <input value={procedure} onChange={(e) => setProcedure(e.target.value)} required />
              </div>
              <div className="emr-form-row">
                <label>OT number</label>
                <input value={otNumber} onChange={(e) => setOtNumber(e.target.value)} />
              </div>
              <div className="emr-form-row">
                <label>Scheduled date & time</label>
                <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
              </div>
            </>
          )}
          {orderType === 'SESSION' && (
            <>
              <div className="emr-form-row">
                <label>Session type</label>
                <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                  <option value="DIALYSIS">Dialysis</option>
                  <option value="CHEMOTHERAPY">Chemotherapy</option>
                </select>
              </div>
              <div className="emr-form-row">
                <label>Clinical notes</label>
                <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} rows={3} placeholder="Protocol or session details…" />
              </div>
            </>
          )}
          <div className="emr-modal-footer">
            <button type="button" className="emr-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="emr-btn-primary" disabled={loading}>
              {loading ? 'Placing order…' : 'Confirm order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FollowUpModal({ open, onClose, onConfirm, doctorId, department, loading }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('Follow-up consultation');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!open || !doctorId || !date) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const data = await apiJson(
          `/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${date}`
        );
        if (!cancelled) {
          const available = (data.slots || []).filter((s) => s.available).map((s) => s.time);
          setSlots(available);
          setTime(available[0] || '');
        }
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, doctorId, date]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!time) return;
    onConfirm({ appointmentDate: date, appointmentTime: time, reason, department });
  };

  return (
    <div className="emr-modal-overlay" role="dialog" aria-modal="true">
      <div className="emr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emr-modal-header">
          <h3><Calendar size={20} /> Schedule follow-up</h3>
          <button type="button" className="emr-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="emr-modal-body">
          <div className="emr-form-row">
            <label>Date</label>
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="emr-form-row">
            <label>Time slot {slotsLoading ? '(loading…)' : ''}</label>
            {slots.length === 0 && !slotsLoading ? (
              <p className="emr-form-hint">No slots available for this date. Pick another day.</p>
            ) : (
              <select value={time} onChange={(e) => setTime(e.target.value)} required disabled={!slots.length}>
                {slots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
          <div className="emr-form-row">
            <label>Department</label>
            <input value={department} readOnly />
          </div>
          <div className="emr-form-row">
            <label>Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          <div className="emr-modal-footer">
            <button type="button" className="emr-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="emr-btn-primary" disabled={loading || !time}>
              {loading ? 'Booking…' : 'Book appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmrToast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`emr-toast ${type || 'info'}`} role="status">
      {type === 'lab' && <FlaskConical size={16} />}
      {message}
    </div>
  );
}
