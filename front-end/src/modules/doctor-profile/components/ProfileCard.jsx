import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, ShieldCheck } from 'lucide-react';
import { useDoctorProfile } from '../context/DoctorProfileContext';

export default function ProfileCard() {
  const { doctor, uploadProfileImage, uploadProgress } = useDoctorProfile();
  const fileRef = useRef(null);

  const personal = doctor?.personal || {};
  const professional = doctor?.professional || {};
  const availability = doctor?.availability || {};
  const imageUrl = doctor?.profileImage?.url;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) await uploadProfileImage(file);
  };

  const status = availability.status || 'offline';

  return (
    <motion.aside
      className="dhp-profile-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dhp-avatar-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={personal.fullName} className="dhp-avatar" />
        ) : (
          <div className="dhp-avatar-placeholder">
            {(personal.fullName || 'D')[0]}
          </div>
        )}
        <button
          type="button"
          className="dhp-avatar-upload-btn"
          onClick={() => fileRef.current?.click()}
          aria-label="Upload profile photo"
        >
          <Camera size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="dhp-upload-progress">
            <div className="dhp-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      <h3 className="dhp-doctor-name">{personal.fullName || 'Dr. Physician'}</h3>
      <p className="dhp-specialization">{professional.specialization || 'General Medicine'}</p>
      <p className="dhp-hospital">{professional.hospitalName || 'Bharat Health Bridge'}</p>

      <div className="dhp-status-row">
        <span className={`dhp-status-pill ${status}`}>{status}</span>
        {doctor?.verification?.status === 'verified' && (
          <span className="dhp-verified-badge">
            <ShieldCheck size={12} /> Verified
          </span>
        )}
      </div>

      <div className="dhp-meta-grid">
        <div className="dhp-meta-item">
          <label>Experience</label>
          <span>{professional.experienceYears || 0} yrs</span>
        </div>
        <div className="dhp-meta-item">
          <label>Fee</label>
          <span>₹{professional.consultationFees || 500}</span>
        </div>
        <div className="dhp-meta-item">
          <label>Dept</label>
          <span>{professional.department || '—'}</span>
        </div>
        <div className="dhp-meta-item">
          <label>ID</label>
          <span>{professional.doctorId || '—'}</span>
        </div>
      </div>
    </motion.aside>
  );
}
