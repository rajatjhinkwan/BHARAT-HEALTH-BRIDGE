import React, { useState } from 'react';
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import EditableField from '../components/EditableField';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { doctorApi } from '../services/doctorApi';

export default function ContactSection() {
  const { doctor, saveSection, updateLocal, setDoctor } = useDoctorProfile();
  const contact = doctor?.contact || {};
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    updateLocal((d) => ({ ...d, contact: { ...d.contact, [name]: value } }));
  };

  const fields = [
    { name: 'mobile', label: 'Mobile Number', type: 'tel' },
    { name: 'alternateMobile', label: 'Alternate Mobile', type: 'tel' },
    { name: 'email', label: 'Email Address', type: 'email' },
    { name: 'emergencyContact', label: 'Emergency Contact', type: 'tel' },
    { name: 'clinicAddress', label: 'Clinic Address', className: 'full-width' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'pincode', label: 'Pincode' },
    { name: 'mapLocation', label: 'Google Maps Location (URL)', className: 'full-width' },
  ];

  const handleSave = () => saveSection({ contact });

  const sendOtp = async () => {
    await doctorApi.sendMobileOtp();
    setOtpSent(true);
    toast.success('OTP sent (demo: use 123456)');
  };

  const verifyOtp = async () => {
    const { data } = await doctorApi.verifyMobileOtp(otp);
    if (data.verified) {
      setDoctor((d) => ({ ...d, contact: { ...d.contact, mobileVerified: true } }));
      toast.success('Mobile verified');
    }
  };

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><Phone size={20} /> Contact Information</h2>
        <button type="button" className="dhp-btn dhp-btn-primary" onClick={handleSave}>Save Section</button>
      </div>
      <div className="dhp-form-grid">
        {fields.map((f) => (
          <EditableField
            key={f.name}
            label={f.label}
            name={f.name}
            type={f.type || 'text'}
            value={contact[f.name] || ''}
            onChange={update}
            className={f.className || ''}
          />
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(14,165,233,0.06)', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={18} /> Mobile Verification
          {contact.mobileVerified && <CheckCircle size={16} color="#10b981" />}
        </h4>
        {!contact.mobileVerified ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="dhp-btn dhp-btn-ghost" onClick={sendOtp}>Send OTP</button>
            {otpSent && (
              <>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--dhp-border)', width: '120px' }}
                />
                <button type="button" className="dhp-btn dhp-btn-primary" onClick={verifyOtp}>Verify</button>
              </>
            )}
          </div>
        ) : (
          <span style={{ color: '#10b981', fontWeight: 600 }}>Mobile number verified</span>
        )}
      </div>
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--dhp-border)', borderRadius: '12px', color: 'var(--dhp-muted)', fontSize: '0.85rem' }}>
        <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Map integration placeholder — connect Google Maps API for live clinic location preview.
      </div>
    </motion.div>
  );
}
