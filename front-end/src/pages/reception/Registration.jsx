import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { User, MapPin, Phone, Hash, AlertCircle, FileCheck, Droplet, Users, Activity, Link as LinkIcon, Fingerprint } from 'lucide-react';
import { generateBlockchainHash } from '../../utils/blockchain';

export default function Registration() {
  const generateNewUHID = () => 'UHID-DL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 899999 + 100000);

  const [formData, setFormData] = useState({
    uhid: '',
    patientName: '',
    dob: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '',
    email: '',
    address: '',
    aadharCardId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicIllness: ''
  });

  const [registeredData, setRegisteredData] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    setFormData(prev => ({ ...prev, uhid: generateNewUHID() }));
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: registeredData ? `PatientRecord_${registeredData.uhid}` : 'Patient_Record',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Structure the Identity Record
      const newPatient = { ...formData };

      // Real API Call to Backend
      const response = await fetch('http://localhost:4000/api/clinical/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      
      if (!response.ok) {
        throw new Error('Failed to register patient');
      }
      const savedPatient = await response.json();

      // Generate Blockchain Hash simulation for UI flair
      const payloadString = JSON.stringify({
         type: "PATIENT_IDENTITY_CREATION",
         timestamp: new Date().toISOString(),
         uhid: savedPatient.uhid,
         aadharHash: savedPatient.aadharCardId
      });
      const hash = await generateBlockchainHash(payloadString);
      
      setTxHash(hash);
      setRegisteredData({ ...savedPatient, registrationDate: savedPatient.createdAt });
      setLoading(false);
    } catch(err) {
      console.error(err);
      alert('Error registering patient: ' + err.message);
      setLoading(false);
    }
  };

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', minHeight: '80vh' },
    titleRow: { marginBottom: '2.5rem', textAlign: 'center' },
    title: { fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-main)', letterSpacing: '-1px' },
    subtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' },
    formCard: { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' },
    label: { fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' },
    inputWrp: { display: 'flex', alignItems: 'flex-start', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', background: 'var(--background)', transition: 'all 0.2s', gap: '0.75rem' },
    input: { border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.95rem', color: 'var(--text-main)' },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
    submitBtn: { width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', borderRadius: 'var(--radius)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' },
    hashBox: { background: 'var(--background)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: '1.5rem', wordBreak: 'break-all', fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--primary)' },
    uhidBox: { background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' },
    uhidText: { fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.05em', margin: 0 }
  };

  if (registeredData) {
    return (
      <div style={styles.container} className="animate-fade-in-up">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <FileCheck size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h2 style={styles.title}>Registration Successful</h2>
            <p style={styles.subtitle}>Patient Identity Record hashed to the simulated blockchain.</p>
          </div>
          
          <div style={{ width: '100%', maxWidth: '800px' }}>
             <div style={styles.hashBox}>
               <strong style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)'}}><LinkIcon size={16}/> Blockchain Transaction Hash Target</strong>
               {txHash}
             </div>
             
             <button onClick={() => handlePrint()} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
                Print Patient Identity File
             </button>
          </div>

          {/* Hidden Print Wrapper */}
          <div style={{ display: 'none' }}>
             <div ref={printRef} style={{ padding: '3rem', width: '800px', color: '#000' }}>
               <h1 style={{ fontSize: '2rem', borderBottom: '2px solid #ccc', paddingBottom: '1rem' }}>Patient Identity Record</h1>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                 <p><strong>Name:</strong> {registeredData.patientName}</p>
                 <p><strong>UHID:</strong> {registeredData.uhid}</p>
                 <p><strong>DOB:</strong> {registeredData.dob}</p>
                 <p><strong>Age:</strong> {registeredData.age}</p>
                 <p><strong>Date:</strong> {new Date(registeredData.registrationDate).toLocaleString()}</p>
                 <p><strong>Aadhar:</strong> {registeredData.aadharCardId}</p>
                 <h3 style={{ gridColumn: '1 / -1', borderBottom: '1px solid #ccc', marginTop: '1rem' }}>Medical & Contact</h3>
                 <p><strong>Blood Group:</strong> {registeredData.bloodGroup}</p>
                 <p><strong>Phone:</strong> {registeredData.phone}</p>
                 <p><strong>Emergency Contact:</strong> {registeredData.emergencyContactName} ({registeredData.emergencyContactPhone})</p>
                 <p><strong>Allergies:</strong> {registeredData.allergies || 'None'}</p>
                 <p><strong>Blockchain TX:</strong> <br/><span style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>{txHash}</span></p>
               </div>
             </div>
          </div>

          <button className="btn-secondary" onClick={() => { 
              setRegisteredData(null); 
              setFormData({ uhid: generateNewUHID(), patientName: '', dob: '', age: '', gender: 'Male', bloodGroup: 'A+', phone: '', email: '', address: '', aadharCardId: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '', chronicIllness: '' }); 
          }}>
             Register Next Patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.titleRow}>
        <h1 style={styles.title}>Patient Identity Registration</h1>
        <p style={styles.subtitle}>Enlist a new patient and secure identity to the ledger.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.uhidBox}>
           <Fingerprint size={28} color="var(--primary)" />
           <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pre-assigned UHID</p>
              <p style={styles.uhidText}>{formData.uhid}</p>
           </div>
        </div>

        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Details</h3>
        
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Full Legal Name</label>
          <div style={styles.inputWrp}>
            <User size={18} color="var(--primary)" />
            <input type="text" name="patientName" value={formData.patientName} onChange={handleChange} required style={styles.input} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>DOB (YYYY-MM-DD)</label>
            <div style={styles.inputWrp}>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required style={styles.input} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Age</label>
            <div style={styles.inputWrp}>
              <input type="number" name="age" value={formData.age} onChange={handleChange} required style={styles.input} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Gender</label>
            <div style={styles.inputWrp}>
                <select name="gender" value={formData.gender} onChange={handleChange} required style={styles.input}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Blood Group</label>
            <div style={styles.inputWrp}>
                <Droplet size={18} color="var(--danger)" />
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required style={styles.input}>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
            </div>
          </div>
        </div>

        <div style={styles.row}>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWrp}>
                    <Phone size={18} color="var(--primary)" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={styles.input} />
                </div>
            </div>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Aadhar Card ID</label>
                <div style={styles.inputWrp}>
                    <Hash size={18} color="var(--primary)" />
                    <input type="text" name="aadharCardId" value={formData.aadharCardId} onChange={handleChange} required style={styles.input} />
                </div>
            </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Residential Address</label>
          <div style={styles.inputWrp}>
            <MapPin size={18} color="var(--primary)" style={{ marginTop: '4px' }} />
            <textarea name="address" value={formData.address} onChange={handleChange} required style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }} />
          </div>
        </div>

        <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Emergency & Medical</h3>
        
        <div style={styles.row}>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Emergency Contact Name</label>
                <div style={styles.inputWrp}>
                    <Users size={18} color="var(--warning)" />
                    <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required style={styles.input} />
                </div>
            </div>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Emergency Contact Phone</label>
                <div style={styles.inputWrp}>
                    <Phone size={18} color="var(--warning)" />
                    <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} required style={styles.input} />
                </div>
            </div>
        </div>

        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Known Allergies</label>
            <div style={styles.inputWrp}>
              <Activity size={18} color="var(--danger)" />
              <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} style={styles.input} placeholder="e.g. Penicillin, Peanuts (or None)" />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Chronic Illnesses</label>
            <div style={styles.inputWrp}>
              <Activity size={18} color="var(--danger)" />
              <input type="text" name="chronicIllness" value={formData.chronicIllness} onChange={handleChange} style={styles.input} placeholder="e.g. Diabetes Type 2" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Hashing Data & Registering...' : 'Register Patient to Blockchain'}
        </button>
      </form>
    </div>
  );
}
