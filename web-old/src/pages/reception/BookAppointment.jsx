import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, CheckCircle, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientMrn: '',
    doctor: '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/clinical/patients');
        if(response.ok) {
           const data = await response.json();
           setPatients(data);
        }
      } catch (err) {
        console.error('Failed to fetch patients', err);
      }
    };
    fetchPatients();
  }, []);

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else if (step === 2) handleBooking();
  };

  const handleBooking = async () => {
     const patient = patients.find(p => p.mrn === formData.patientMrn);
     
     if(patient) {
       try {
         const appointmentData = {
            patientId: patient._id,
            patientName: patient.patientName,
            doctor: formData.doctor,
            department: formData.doctor.includes('Cardio') ? 'Cardiology' : (formData.doctor.includes('Neuro') ? 'Neurology' : (formData.doctor.includes('ENT') ? 'ENT' : 'General Medicine')),
            date: formData.date,
            time: formData.time,
            type: 'Consultation',
            reason: formData.reason
         };

         const response = await fetch('http://localhost:4000/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
         });

         if(response.ok) {
            setStep(3);
         } else {
            throw new Error('Failed to book appointment');
         }
       } catch (err) {
         console.error(err);
         alert('Error booking: ' + err.message);
       }
     }
  };


  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '3rem' },
    header: { marginBottom: '3rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1.5rem' },
    card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '3rem', borderRadius: '32px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' },
    stepIndicator: { display: 'flex', gap: '1rem', marginBottom: '3rem' },
    stepDot: (active) => ({ width: '40px', height: '6px', borderRadius: '3px', background: active ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s' }),
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' },
    label: { fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { padding: '0.9rem 1.25rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '1.05rem', outline: 'none', width: '100%', fontFamily: 'inherit', transition: 'all 0.2s' },
    btnPrimary: { width: '100%', padding: '1.1rem', fontSize: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' },
    summaryBox: { background: 'var(--surface-hover)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '2rem' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: '20px' }}>
            <CalendarIcon size={32} color="var(--primary)" />
        </div>
        <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Schedule Appointment</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: '0.2rem 0 0' }}>Manage outpatient patient flow and token issuance.</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.stepIndicator}>
            <div style={styles.stepDot(step >= 1)}></div>
            <div style={styles.stepDot(step >= 2)}></div>
            <div style={styles.stepDot(step >= 3)}></div>
        </div>

        {step === 1 && (
          <form onSubmit={handleNext}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: 4, height: 24, background: 'var(--primary)', borderRadius: 2 }}></div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Select Patient & Department</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={styles.fieldGroup}>
                <label style={styles.label}>Registered Patient</label>
                <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
                    <select required style={{ ...styles.input, paddingLeft: '3rem' }} value={formData.patientMrn} onChange={(e) => setFormData({...formData, patientMrn: e.target.value})}>
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map(p => <option key={p.mrn} value={p.mrn}>{p.patientName} ({p.mrn})</option>)}
                    </select>
                </div>
                </div>

                <div style={styles.fieldGroup}>
                <label style={styles.label}>Select Specialization</label>
                <select required style={styles.input} value={formData.doctor} onChange={(e) => setFormData({...formData, doctor: e.target.value})}>
                    <option value="">Select a Doctor...</option>
                    <option value="Dr. Aryan (Cardio)">Dr. Aryan (Cardiology)</option>
                    <option value="Dr. Vikram (Surgeon)">Dr. Vikram (Trauma Surgeon)</option>
                    <option value="Dr. Sara (ENT)">Dr. Sara (ENT Specialist)</option>
                    <option value="Dr. Lenna (Neuro)">Dr. Lenna (Neurology)</option>
                </select>
                </div>
            </div>
            
            <button style={styles.btnPrimary} type="submit">
                Continue to Slot Selection <ChevronRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: 4, height: 24, background: 'var(--primary)', borderRadius: 2 }}></div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Date & Time Allocation</h3>
            </div>
            
            <div style={styles.summaryBox}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Patient MRN</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{formData.patientMrn}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Consulting Specialist</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{formData.doctor}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               <div style={styles.fieldGroup}>
                 <label style={styles.label}>Date</label>
                 <div style={{ position: 'relative' }}>
                   <CalendarIcon size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
                   <input type="date" required style={{ ...styles.input, paddingLeft: '3rem' }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                 </div>
               </div>
               <div style={styles.fieldGroup}>
                 <label style={styles.label}>Available Time Slot</label>
                 <div style={{ position: 'relative' }}>
                   <Clock size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
                   <select required style={{ ...styles.input, paddingLeft: '3rem' }} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}>
                      <option value="">Select Time...</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:15 PM">02:15 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                   </select>
                 </div>
               </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Consultation Notes / Reason</label>
              <textarea style={{ ...styles.input, height: '100px', resize: 'none' }} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Patient's primary complaint or medical context..." />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
               <button type="button" onClick={() => setStep(1)} style={{ ...styles.btnPrimary, background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', flex: 0.4 }}>Back</button>
               <button type="submit" style={{ ...styles.btnPrimary, flex: 1 }}>Commit to Queue & Issue Token</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
             <div style={{ background: 'var(--success-light)', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 2rem', color: 'var(--success)' }}>
                <CheckCircle size={64} style={{ margin: 'auto' }} />
             </div>
             <h2 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem', fontWeight: 900 }}>Appointment Confirmed</h2>
             <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>The patient has been successfully pushed into the <b>Outpatient Queue Database</b>.</p>
             <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button style={{ ...styles.btnPrimary, width: 'auto', padding: '1rem 2rem' }} onClick={() => { setStep(1); setFormData({ patientMrn: '', doctor: '', date: '', time: '', reason: ''}); }}>Book Another</button>
                <button className="btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '16px', fontWeight: 700 }} onClick={() => navigate('/queue')}>View Live Queue</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
