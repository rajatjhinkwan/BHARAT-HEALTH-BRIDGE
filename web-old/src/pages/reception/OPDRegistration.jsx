import React, { useState } from 'react';
import { UserPlus, Hash, FileText, CheckCircle, Clock, Activity } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';
import { API_BASE_URL } from '../../config';

export default function OPDRegistration() {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    dob: '',
    gender: 'Male',
    phone: '',
    address: '',
    aadharCardId: '',
    department: 'General Medicine',
    symptoms: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hashValue, setHashValue] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pHash = await generateBlockchainHash({ 
        type: "PATIENT_REGISTRATION", 
        patientName: formData.patientName,
        aadhar: formData.aadharCardId 
      });
      
      const response = await fetch(`${API_BASE_URL}/workflow/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      const data = await response.json();
      setResult(data);
      setHashValue(pHash);
      
      // Auto-reset after 10s
      setTimeout(() => {
        setResult(null);
        setFormData({
            patientName: '', age: '', dob: '', gender: 'Male', phone: '', address: '', aadharCardId: '', department: 'General Medicine', symptoms: ''
        });
      }, 10000);

    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '3rem' },
    card: { background: 'white', borderRadius: '32px', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontWeight: '700', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' },
    input: { padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc' },
    submitBtn: { background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', marginTop: '2rem', width: '100%' }
  };

  if (result) {
    return (
        <div style={styles.container}>
            <div style={{ ...styles.card, textAlign: 'center' }}>
                <CheckCircle size={80} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Registration Success</h1>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Patient has been added to the <b>WAITING</b> queue.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px', marginBottom: '2rem' }}>
                    <div>
                        <span style={styles.label}>Queue Token</span>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>{result.token}</div>
                    </div>
                    <div>
                        <span style={styles.label}>Global UHID</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{result.uhid}</div>
                    </div>
                </div>
                
                <div style={{ textAlign: 'left', background: '#1e293b', color: '#94a3b8', padding: '1rem', borderRadius: '12px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    <span style={{ color: '#38bdf8' }}>BLOCKCHAIN_HASH:</span> {hashValue}
                </div>
                
                <button onClick={() => setResult(null)} style={{ ...styles.submitBtn, background: '#f1f5f9', color: '#475569', marginTop: '2rem' }}>Register Next Patient</button>
            </div>
        </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
        <div style={{ marginBottom: '3rem' }}>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900 }}>OPD Registration</h1>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Fill details to generate token and enter waiting queue.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Patient Full Name</label>
              <input required name="patientName" value={formData.patientName} onChange={handleChange} style={styles.input} placeholder="Enter full name" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Age</label>
              <input required type="number" name="age" value={formData.age} onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input required name="phone" value={formData.phone} onChange={handleChange} style={styles.input} placeholder="+91 XXXX XXXX" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Aadhar / ID</label>
              <input required name="aadharCardId" value={formData.aadharCardId} onChange={handleChange} style={styles.input} placeholder="XXXX XXXX XXXX" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Date of Birth</label>
              <input required type="date" name="dob" value={formData.dob} onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Department</label>
              <select name="department" value={formData.department} onChange={handleChange} style={styles.input}>
                {[
                  "General Medicine", "Cardiology", "Neurology", "Nephrology", 
                  "Orthopedics", "ENT", "Dermatology", "Pediatrics", 
                  "Gynecology", "Psychiatry", "Radiology", "Oncology", 
                  "Pulmonology", "Urology", "Gastroenterology", "Endocrinology", 
                  "Ophthalmology", "Emergency", "ICU", "Ventilator Ward", 
                  "Trauma", "Surgery", "Pathology", "Laboratory", "Pharmacy"
                ].map(dept => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Primary Symptoms / Complaints</label>
              <textarea required name="symptoms" value={formData.symptoms} onChange={handleChange} style={{ ...styles.input, height: '100px', resize: 'none' }} placeholder="Describe patient's condition..." />
            </div>

            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Full Address</label>
              <input required name="address" value={formData.address} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Processing...' : 'Register & Generate Token'}
          </button>
        </form>
      </div>
    </div>
  );
}
