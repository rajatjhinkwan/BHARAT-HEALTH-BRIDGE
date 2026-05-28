import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './BookAppointment.css';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);

  const [formData, setFormData] = useState({
    patientMrn: '',
    department: '',
    doctorId: '',
    date: '',
    time: '',
    reason: '',
  });

  const getISTDate = (offsetDays = 0) => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    istDate.setDate(istDate.getDate() + offsetDays);
    return istDate;
  };

  const getISTDateString = (offsetDays = 0) => {
    const d = getISTDate(offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getISTDateString(0);
  const maxDateStr = getISTDateString(7);

  // Fetch all doctor appointments to count bookings per day
  useEffect(() => {
    if (!formData.doctorId) {
      setAppointmentsList([]);
      return;
    }
    fetch(`${API_BASE_URL}/appointments?doctorId=${encodeURIComponent(formData.doctorId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAppointmentsList)
      .catch(() => setAppointmentsList([]));
  }, [formData.doctorId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch(`${API_BASE_URL}/clinical/patients`),
          fetch(`${API_BASE_URL}/departments`),
        ]);
        if (pRes.ok) setPatients(await pRes.json());
        if (dRes.ok) setDepartments(await dRes.json());
      } catch (err) {
        console.error('Failed to load booking data', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!formData.department) {
      Promise.resolve().then(() => setDoctors([]));
      return;
    }
    fetch(`${API_BASE_URL}/doctors?department=${encodeURIComponent(formData.department)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [formData.department]);

  useEffect(() => {
    if (!formData.doctorId || !formData.date) {
      Promise.resolve().then(() => setSlots([]));
      return;
    }
    Promise.resolve().then(() => setLoadingSlots(true));
    fetch(
      `${API_BASE_URL}/appointments/availability?doctorId=${encodeURIComponent(formData.doctorId)}&date=${formData.date}`
    )
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [formData.doctorId, formData.date]);

  const selectedDoctor = doctors.find((d) => d.employeeId === formData.doctorId);
  const selectedPatient = patients.find((p) => p.mrn === formData.patientMrn);

  const handleNext = (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      if (!formData.patientMrn || !formData.department || !formData.doctorId) {
        setError('Please select patient, department, and doctor.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      handleBooking();
    }
  };

  const handleBooking = async () => {
    const patient = patients.find((p) => p.mrn === formData.patientMrn);
    if (!patient) {
      setError('Patient not found.');
      return;
    }
    if (!formData.time) {
      setError('Please select an available time slot.');
      return;
    }

    try {
      const token = localStorage.getItem('hospflow_auth_token');
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: patient._id,
          doctorId: formData.doctorId,
          department: formData.department,
          appointmentDate: formData.date,
          appointmentTime: formData.time,
          reason: formData.reason,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setConfirmed(data);
        setStep(3);
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  const resetForm = () => {
    setStep(1);
    setConfirmed(null);
    setError('');
    setFormData({
      patientMrn: '',
      department: '',
      doctorId: '',
      date: '',
      time: '',
      reason: '',
    });
  };

  const getMinDateIST = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const hour = istDate.getHours();
    if (hour >= 16) {
      istDate.setDate(istDate.getDate() + 1);
    }
    return istDate.toISOString().split('T')[0];
  };

  const minDate = getMinDateIST();

  return (
    <div className="book-appt-page animate-fade-in-up">
      <div className="book-appt-header">
        <div className="book-appt-header-icon">
          <CalendarIcon size={32} color="var(--primary)" />
        </div>
        <div>
          <h1>Schedule Appointment</h1>
          <p>Book outpatient consultations by department, doctor, and available slot.</p>
        </div>
      </div>

      <div className="book-appt-card">
        <div className="book-appt-steps">
          <div className={`book-appt-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`book-appt-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`book-appt-dot ${step >= 3 ? 'active' : ''}`} />
        </div>

        {error && <div className="book-appt-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleNext}>
            <h3 className="book-appt-section-title">Patient, department & doctor</h3>
            <div className="book-appt-grid">
              <div className="book-appt-field">
                <label>Registered patient</label>
                <div className="book-appt-input-wrap">
                  <User size={18} className="book-appt-icon" />
                  <select required value={formData.patientMrn} onChange={(e) => setFormData({ ...formData, patientMrn: e.target.value })}>
                    <option value="">Choose patient</option>
                    {patients.map((p) => (
                      <option key={p.mrn} value={p.mrn}>{p.patientName} ({p.mrn})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="book-appt-field">
                <label>Department</label>
                <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, doctorId: '' })}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="book-appt-field book-appt-field-full">
                <label>Doctor</label>
                <select required value={formData.doctorId} disabled={!formData.department} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                  <option value="">{formData.department ? 'Select doctor' : 'Choose department first'}</option>
                  {doctors.map((d) => (
                    <option key={d.employeeId} value={d.employeeId}>{d.name} — {d.specialization || d.department}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="book-appt-btn-primary">Continue <ChevronRight size={20} /></button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext}>
            <h3 className="book-appt-section-title">Date & time</h3>
            <div className="book-appt-summary">
              <div><span>Patient</span><strong>{selectedPatient?.patientName || formData.patientMrn}</strong></div>
              <div><span>Department</span><strong>{formData.department}</strong></div>
              <div><span>Doctor</span><strong>{selectedDoctor?.name || formData.doctorId}</strong></div>
            </div>
            <div className="book-appt-field book-appt-field-full">
              <label>Select Consultation Date</label>
              
              <div className="book-appt-calendar-container">
                <div className="book-appt-calendar-header">
                  <h4>{getISTDate(0).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                  <span className="book-appt-calendar-legend">
                    IST Today: {new Date(getISTDate(0)).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="book-appt-calendar-hint">
                  ℹ️ Green/orange badges represent the count of booked appointments. Appointment slots are limited to 7 days ahead (today to {new Date(getISTDate(7)).toLocaleDateString()}).
                </p>

                <div className="book-appt-calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="book-appt-calendar-weekday">{day}</div>
                  ))}
                  
                  {(() => {
                    const daysInMonth = [];
                    const nowIST = getISTDate(0);
                    const currentYear = nowIST.getFullYear();
                    const currentMonth = nowIST.getMonth();
                    
                    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const firstDayIdx = new Date(currentYear, currentMonth, 1).getDay();
                    
                    // Prepend offset days
                    for (let i = 0; i < firstDayIdx; i++) {
                      daysInMonth.push(<div key={`empty-${i}`} className="book-appt-calendar-day empty" />);
                    }
                    
                    // Render actual calendar days
                    for (let day = 1; day <= numDays; day++) {
                      const dayStr = String(day).padStart(2, '0');
                      const monthStr = String(currentMonth + 1).padStart(2, '0');
                      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
                      
                      const isWithin7Days = dateStr >= todayStr && dateStr <= maxDateStr;
                      
                      // Count appointments on this date
                      const bookedCount = appointmentsList.filter(a => a.appointmentDate === dateStr && a.status !== 'CANCELLED').length;
                      
                      let badgeText = '0 booked';
                      let badgeClass = '';
                      if (bookedCount > 0) {
                        badgeText = `${bookedCount} booked`;
                        badgeClass = bookedCount >= 8 ? 'full' : 'some';
                      }
                      
                      let dayClass = 'out-of-range';
                      if (isWithin7Days) {
                        dayClass = 'in-range';
                        if (formData.date === dateStr) {
                          dayClass = 'selected';
                        }
                      }
                      
                      daysInMonth.push(
                        <button
                          key={day}
                          type="button"
                          className={`book-appt-calendar-day ${dayClass}`}
                          disabled={!isWithin7Days}
                          onClick={() => setFormData({ ...formData, date: dateStr, time: '' })}
                        >
                          <span className="book-appt-day-num">{day}</span>
                          {isWithin7Days && (
                            <span className={`book-appt-day-badge ${badgeClass}`}>{badgeText}</span>
                          )}
                        </button>
                      );
                    }
                    
                    return daysInMonth;
                  })()}
                </div>
              </div>
            </div>
            <div className="book-appt-field">
              <label>Available slots {loadingSlots && '(loading…)'}</label>
              <div className="book-appt-slots">
                {slots.length === 0 && !loadingSlots && <p className="book-appt-muted">Select date and doctor to see slots.</p>}
                {slots.map((s) => (
                  <button key={s.time} type="button" disabled={!s.available}
                    className={`book-appt-slot ${formData.time === s.time ? 'selected' : ''} ${!s.available ? 'disabled' : ''}`}
                    onClick={() => setFormData({ ...formData, time: s.time })}>
                    <Clock size={14} /> {s.time}
                  </button>
                ))}
              </div>
            </div>
            <div className="book-appt-field">
              <label>Reason / notes</label>
              <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={3} placeholder="Chief complaint…" />
            </div>
            <div className="book-appt-actions">
              <button type="button" className="book-appt-btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="book-appt-btn-primary">Confirm booking</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="book-appt-success">
            <CheckCircle size={64} />
            <h2>Appointment confirmed</h2>
            {confirmed && (
              <div className="book-appt-summary book-appt-summary-center">
                <div><span>ID</span><strong>{confirmed.appointmentId}</strong></div>
                <div><span>When</span><strong>{confirmed.appointmentDate} at {confirmed.appointmentTime}</strong></div>
                <div><span>Doctor</span><strong>{confirmed.doctorName || confirmed.doctorId}</strong></div>
              </div>
            )}
            <div className="book-appt-actions book-appt-actions-center">
              <button type="button" className="book-appt-btn-primary" onClick={resetForm}>Book another</button>
              <button type="button" className="book-appt-btn-secondary" onClick={() => navigate('/queue')}>View queue</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}