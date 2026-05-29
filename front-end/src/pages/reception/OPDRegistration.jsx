import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';
import { API_BASE_URL } from '../../config';

export default function OPDRegistration() {
  const [formData, setFormData] = useState({
    patientName: '',
    dob: '',
    age: '',
    gender: 'Male',
    aadharCardId: '',
    phone: '',
    email: '',
    address: '',
    department: 'General Medicine',
    priority: 'LOW',
    insuranceProvider: '',
    policyNumber: '',
  });

  const [ageMode, setAgeMode] = useState('dob'); // 'dob' or 'age'
  const [dobParts, setDobParts] = useState({ year: '', month: '', day: '' });
  const [loading, setLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  const handleAgeModeChange = (mode) => {
    setAgeMode(mode);
    setFormData((prev) => ({
      ...prev,
      dob: mode === 'age' ? '' : prev.dob,
      age: mode === 'dob' ? '' : prev.age,
    }));
    if (mode === 'age') {
      setDobParts({ year: '', month: '', day: '' });
    }
  };

  const handleDobPartsChange = (name, value) => {
    const newParts = { ...dobParts, [name]: value };
    setDobParts(newParts);
    
    if (newParts.year && newParts.month && newParts.day) {
      const monthStr = String(newParts.month).padStart(2, '0');
      const dayStr = String(newParts.day).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        dob: `${newParts.year}-${monthStr}-${dayStr}`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dob: ''
      }));
    }
  };

  const departments = [
    'General Medicine', 'Cardiology', 'Neurology', 'Nephrology',
    'Orthopedics', 'ENT', 'Dermatology', 'Pediatrics',
    'Gynecology', 'Psychiatry', 'Radiology', 'Oncology',
    'Pulmonology', 'Urology', 'Gastroenterology', 'Endocrinology',
    'Ophthalmology', 'Emergency',
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      try {
        await generateBlockchainHash({
          type: 'PATIENT_REGISTRATION',
          patientName: formData.patientName,
          aadhar: formData.aadharCardId,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Blockchain hash is optional
      }

      const payload = {
        ...formData,
      };

      if (ageMode === 'dob') {
        delete payload.age;
      } else {
        payload.age = Number(formData.age);
        delete payload.dob;
      }

      const token = localStorage.getItem('hospflow_auth_token');
      const response = await fetch(`${API_BASE_URL}/workflow/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      const data = await response.json();
      setRegistrationResult({
        uhid: data.uhid,
        token: data.token,
        status: data.patient?.currentStatus || 'Triage Pending',
      });

      setFormData({
        patientName: '', dob: '', age: '', gender: 'Male', aadharCardId: '',
        phone: '', email: '', address: '', department: 'General Medicine',
        priority: 'LOW', insuranceProvider: '', policyNumber: '',
      });
      setDobParts({ year: '', month: '', day: '' });

      setTimeout(() => setRegistrationResult(null), 8000);
      alert(`Registered successfully!\nUHID: ${data.uhid}\nToken: ${data.token}\nDepartment: ${data.department}\n\nThe doctor queue will update automatically.`);
    } catch (error) {
      alert('Registration Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const displayUhid = registrationResult?.uhid || '—';
  const displayToken = registrationResult?.token || '—';
  const displayStatus = registrationResult?.status || 'Awaiting registration';

  return (
    <div className="hb-page hb-opd-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div className="hb-page-header-row">
            <div className="hb-page-header-icon">
              <UserPlus size={28} />
            </div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Reception · OPD</p>
              <h1>New patient registration</h1>
              <p>Register walk-ins — token and live queue update for the selected department</p>
            </div>
          </div>
        </header>

        <div className="hb-registration-strip">
          <div className="hb-reg-stat">
            <label>Global UHID</label>
            <strong>{displayUhid}</strong>
          </div>
          <div className="hb-reg-stat">
            <label>Visit token</label>
            <strong className="token">{displayToken}</strong>
          </div>
          <div className="hb-reg-stat">
            <label>Initial status</label>
            <strong>{displayStatus}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="hb-card hb-opd-form-card">
          <div className="hb-opd-form-grid">
            <div className="hb-form-group span-2">
              <label>Patient full name</label>
              <input required name="patientName" value={formData.patientName} onChange={handleChange} placeholder="e.g. Rahul Malhotra" />
            </div>
            <div className="hb-form-group">
              <label>Define age by</label>
              <select value={ageMode} onChange={(e) => handleAgeModeChange(e.target.value)}>
                <option value="dob">Date of Birth</option>
                <option value="age">Age (in Years)</option>
              </select>
            </div>
            {ageMode === 'dob' ? (
              <div className="hb-form-group span-2">
                <label>Date of birth</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    required 
                    style={{ flex: 2 }} 
                    value={dobParts.year} 
                    onChange={(e) => handleDobPartsChange('year', e.target.value)}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 121 }, (_, i) => 2026 - i).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                  <select 
                    required 
                    style={{ flex: 1.5 }} 
                    value={dobParts.month} 
                    onChange={(e) => handleDobPartsChange('month', e.target.value)}
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select 
                    required 
                    style={{ flex: 1 }} 
                    value={dobParts.day} 
                    onChange={(e) => handleDobPartsChange('day', e.target.value)}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="hb-form-group span-2">
                <label>Age</label>
                <input required type="number" min="0" max="150" name="age" value={formData.age} onChange={handleChange} placeholder="Years" />
              </div>
            )}
            <div className="hb-form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="hb-form-group">
              <label>Aadhar / national ID <span style={{ opacity: 0.7, fontSize: '0.85em', fontWeight: 'normal' }}>(Optional)</span></label>
              <input name="aadharCardId" value={formData.aadharCardId} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" />
            </div>
            <div className="hb-form-group">
              <label>Contact number</label>
              <input required name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            </div>
            <div className="hb-form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="patient@example.com" />
            </div>
            <div className="hb-form-group full">
              <label>Residential address</label>
              <input required name="address" value={formData.address} onChange={handleChange} placeholder="House, street, city, state" />
            </div>
            <div className="hb-form-group">
              <label>Target department</label>
              <select name="department" value={formData.department} onChange={handleChange}>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="hb-form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="LOW">Routine</option>
                <option value="MEDIUM">General</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <button type="submit" className="hb-btn-primary hb-opd-submit" disabled={loading}>
            {loading ? 'Processing…' : 'Commit registration & join queue'}
          </button>
        </form>
      </div>
    </div>
  );
}
