import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ToggleSwitch from '../components/ToggleSwitch';
import { useDoctorProfile } from '../context/DoctorProfileContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUS_OPTIONS = ['online', 'offline', 'busy', 'emergency'];

export default function AvailabilitySection() {
  const { doctor, saveAvailability, updateLocal } = useDoctorProfile();
  const avail = doctor?.availability || { weeklySchedule: [], status: 'offline' };

  const schedule = avail.weeklySchedule?.length
    ? avail.weeklySchedule
    : DAYS.slice(0, 6).map((day) => ({ day, enabled: day !== 'Saturday', slots: [{ start: '09:00', end: '13:00' }] }));

  const updateSchedule = (newSchedule) => {
    updateLocal((d) => ({ ...d, availability: { ...d.availability, weeklySchedule: newSchedule } }));
  };

  const toggleDay = (idx) => {
    const next = [...schedule];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    updateSchedule(next);
  };

  const updateSlot = (dayIdx, slotIdx, field, value) => {
    const next = [...schedule];
    const slots = [...(next[dayIdx].slots || [])];
    slots[slotIdx] = { ...slots[slotIdx], [field]: value };
    next[dayIdx] = { ...next[dayIdx], slots };
    updateSchedule(next);
  };

  const addSlot = (dayIdx) => {
    const next = [...schedule];
    next[dayIdx].slots = [...(next[dayIdx].slots || []), { start: '14:00', end: '18:00' }];
    updateSchedule(next);
  };

  const removeSlot = (dayIdx, slotIdx) => {
    const next = [...schedule];
    next[dayIdx].slots = next[dayIdx].slots.filter((_, i) => i !== slotIdx);
    updateSchedule(next);
  };

  const handleSave = () => saveAvailability({ ...avail, weeklySchedule: schedule });

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><Calendar size={20} /> Availability Management</h2>
        <button type="button" className="dhp-btn dhp-btn-primary" onClick={handleSave}>Save Schedule</button>
      </div>

      <div className="dhp-form-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="dhp-field">
          <label>Current Status</label>
          <select
            value={avail.status || 'offline'}
            onChange={(e) => updateLocal((d) => ({ ...d, availability: { ...d.availability, status: e.target.value } }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="dhp-toggle-row" style={{ border: 'none', padding: '0.5rem 0' }}>
          <div className="dhp-toggle-info"><h4>Holiday Mode</h4><p>Pause all appointments</p></div>
          <ToggleSwitch
            id="holiday"
            checked={!!avail.holidayMode}
            onChange={(v) => updateLocal((d) => ({ ...d, availability: { ...d.availability, holidayMode: v } }))}
          />
        </div>
        <div className="dhp-toggle-row" style={{ border: 'none' }}>
          <div className="dhp-toggle-info"><h4>Emergency Available</h4><p>Accept emergency cases 24/7</p></div>
          <ToggleSwitch
            id="emergency"
            checked={!!avail.emergencyAvailable}
            onChange={(v) => updateLocal((d) => ({ ...d, availability: { ...d.availability, emergencyAvailable: v } }))}
          />
        </div>
      </div>

      {schedule.map((day, dayIdx) => (
        <div key={day.day} className="dhp-schedule-day">
          <div className="dhp-schedule-day-header">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <input type="checkbox" checked={day.enabled} onChange={() => toggleDay(dayIdx)} />
              {day.day}
            </label>
            <button type="button" className="dhp-btn dhp-btn-ghost" onClick={() => addSlot(dayIdx)}>
              <Plus size={14} /> Slot
            </button>
          </div>
          {day.enabled && (day.slots || []).map((slot, slotIdx) => (
            <div key={slotIdx} className="dhp-slot-row">
              <input type="time" value={slot.start} onChange={(e) => updateSlot(dayIdx, slotIdx, 'start', e.target.value)} />
              <span>to</span>
              <input type="time" value={slot.end} onChange={(e) => updateSlot(dayIdx, slotIdx, 'end', e.target.value)} />
              <button type="button" className="dhp-btn dhp-btn-ghost" onClick={() => removeSlot(dayIdx, slotIdx)} aria-label="Remove slot">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
