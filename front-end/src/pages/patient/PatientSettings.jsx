import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import './PatientPortal.css';

export default function PatientSettings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Basic Details States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [chronicIllness, setChronicIllness] = useState(user?.chronicIllness || '');
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContactPhone || '');

  // File Upload States
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Aadhar (Compulsory)
  const [aadharId, setAadharId] = useState(user?.aadharCardId || '');
  const [aadharPreview, setAadharPreview] = useState(user?.aadharCardImage || null);
  const [aadharFile, setAadharFile] = useState(null);

  // Secondary Health Cards (Optional)
  const [hasSecondaryCard, setHasSecondaryCard] = useState(!!user?.healthCardImage || false);
  const [cardType, setCardType] = useState(user?.healthCardType || 'Ayushman Card (PM-JAY)');
  const [cardPreview, setCardPreview] = useState(user?.healthCardImage || null);
  const [cardFile, setCardFile] = useState(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const aadharInputRef = useRef(null);
  const cardInputRef = useRef(null);

  if (!user) {
    navigate('/patient-login');
    return null;
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAadharChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadharFile(file);
      setAadharPreview(URL.createObjectURL(file));
    }
  };

  const handleCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCardFile(file);
      setCardPreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    // Validate Aadhaar (compulsory)
    if (!aadharId || aadharId.trim().length !== 12 || isNaN(aadharId)) {
      setMessageType('error');
      setMessage('Aadhar Card is compulsory. Please enter a valid 12-digit numeric Aadhaar ID.');
      return;
    }
    if (!aadharPreview) {
      setMessageType('error');
      setMessage('Aadhar Card is compulsory. Please upload a scan of your Aadhaar Card.');
      return;
    }

    setSaving(true);
    setMessage('');
    setMessageType('info');
    
    try {
      const token = localStorage.getItem('hospflow_auth_token');
      const formData = new FormData();
      
      // Append text fields
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('bloodGroup', bloodGroup);
      formData.append('allergies', allergies);
      formData.append('chronicIllness', chronicIllness);
      formData.append('emergencyContactName', emergencyName);
      formData.append('emergencyContactPhone', emergencyPhone);
      
      // Aadhaar
      formData.append('aadharCardId', aadharId);

      // Secondary Card
      if (hasSecondaryCard) {
        formData.append('healthCardType', cardType);
      } else {
        formData.append('healthCardType', '');
      }

      // Append files
      if (avatarFile) {
        formData.append('avatarFile', avatarFile);
      }
      if (aadharFile) {
        formData.append('aadharFile', aadharFile);
      }
      if (hasSecondaryCard && cardFile) {
        formData.append('healthCardFile', cardFile);
      }

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes.');

      updateProfile(data);
      setMessageType('success');
      setMessage('Profile settings and documents updated successfully!');
      
      // Reset temporary file inputs
      setAvatarFile(null);
      setAadharFile(null);
      setCardFile(null);
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="patient-portal" style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Settings</h1>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>Manage your digital identity, medical files, and verification cards</p>
        </div>
        <Link to="/patient" className="pp-link" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: 12,
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          border: '1px solid',
          backgroundColor: messageType === 'success' ? '#ECFDF5' : messageType === 'error' ? '#FEF2F2' : '#EFF6FF',
          borderColor: messageType === 'success' ? '#10B981' : messageType === 'error' ? '#EF4444' : '#3B82F6',
          color: messageType === 'success' ? '#047857' : messageType === 'error' ? '#B91C1C' : '#1D4ED8',
        }}>
          {message}
        </div>
      )}

      {/* AVATAR PHOTO ZONE */}
      <div className="pp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 20 }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Profile Avatar</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatarPreview || 'https://via.placeholder.com/100?text=Patient'}
              alt="Avatar"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              📷
            </button>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Upload profile photo</p>
            <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>PNG, JPG or JPEG. Recommended square aspect ratio.</p>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* COMPULSORY AADHAAR CARD UPLOAD */}
      <div className="pp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 20, borderLeft: '5px solid var(--danger)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>Aadhar Card Verification <span style={{ color: 'var(--danger)', fontSize: '0.8rem', verticalAlign: 'middle', marginLeft: 6 }}>[COMPULSORY]</span></h3>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: 800 }}>REQUIRED</span>
        </div>
        <p className="muted" style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem' }}>Your Aadhar Card serves as the primary unique identifier for automated clinical registration and ABHA synchronization.</p>
        
        <label style={{ display: 'block', marginBottom: '1.25rem', fontWeight: 700 }}>
          12-Digit Aadhaar ID Number
          <input
            value={aadharId}
            onChange={(e) => setAadharId(e.target.value.replace(/\D/g, '').slice(0, 12))}
            style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px' }}
            placeholder="1234 5678 9012"
          />
        </label>

        <div style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Aadhar Card Scan / Photo Upload</span>
          
          <div
            onClick={() => aadharInputRef.current.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 14,
              padding: '1.5rem 1rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
          >
            <input
              type="file"
              accept="image/*"
              ref={aadharInputRef}
              onChange={handleAadharChange}
              style={{ display: 'none' }}
            />
            {aadharPreview ? (
              <div>
                <img
                  src={aadharPreview}
                  alt="Aadhar Scan"
                  style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <p className="muted" style={{ margin: '8px 0 0 0', fontSize: '0.8rem', fontWeight: 600 }}>Click to replace Aadhar scan</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.25rem', marginBottom: 6 }}>🪪</div>
                <p style={{ margin: 0, fontWeight: 700 }}>Upload Aadhar Scan Photo</p>
                <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Compulsory for patient profile validation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPTIONAL SECONDARY HEALTH CARD UPLOAD */}
      <div className="pp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>Secondary Health Benefit Card <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, marginLeft: 6 }}>[OPTIONAL]</span></h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasSecondaryCard}
              onChange={(e) => setHasSecondaryCard(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            Enable
          </label>
        </div>

        {hasSecondaryCard && (
          <div style={{
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <label style={{ display: 'block', marginBottom: '1.25rem', fontWeight: 700 }}>
              Select Card Type
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginTop: 6,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="Ayushman Card (PM-JAY)">Ayushman Card (PM-JAY)</option>
                <option value="CGHS Card">CGHS Health Card</option>
              </select>
            </label>

            <div style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Secondary Card Scan / Photo</span>
              
              <div
                onClick={() => cardInputRef.current.click()}
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 14,
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={cardInputRef}
                  onChange={handleCardChange}
                  style={{ display: 'none' }}
                />
                {cardPreview ? (
                  <div>
                    <img
                      src={cardPreview}
                      alt="Secondary Health Card"
                      style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 10, border: '1px solid #e2e8f0' }}
                    />
                    <p className="muted" style={{ margin: '8px 0 0 0', fontSize: '0.8rem', fontWeight: 600 }}>Click to replace document scan</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.25rem', marginBottom: 6 }}>💳</div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Upload Ayushman / CGHS Card Scan</p>
                    <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Allows automated insurance & benefit validation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PERSONAL PROFILE FIELDS */}
      <div className="pp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 20 }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 800 }}>Profile Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>
            Display Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="E.g. Rahul Sharma"
            />
          </label>
          <label style={{ fontWeight: 700 }}>
            Phone Number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="+91 XXXXX XXXXX"
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>
            Email Address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="name@example.com"
            />
          </label>
          <label style={{ fontWeight: 700 }}>
            Blood Group
            <input
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="O+, A+, B+, etc."
            />
          </label>
        </div>

        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700 }}>
          Home Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            placeholder="Complete street address"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700 }}>
            Allergies
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="Dust, Peanuts, Penicillin"
            />
          </label>
          <label style={{ fontWeight: 700 }}>
            Chronic Diseases
            <input
              value={chronicIllness}
              onChange={(e) => setChronicIllness(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="Asthma, Hypertension, Diabetes"
            />
          </label>
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem 0', fontWeight: 800 }}>Emergency Contact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={{ fontWeight: 700 }}>
            Contact Person Name
            <input
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="Relative or friend's name"
            />
          </label>
          <label style={{ fontWeight: 700 }}>
            Emergency Contact Phone
            <input
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: 6, borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              placeholder="+91 XXXXX XXXXX"
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '3rem' }}>
        <button
          type="button"
          className="pp-btn"
          style={{
            flex: 1,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            padding: '1rem',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            opacity: saving ? 0.7 : 1,
          }}
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving changes…' : 'Save all changes'}
        </button>

        <button
          type="button"
          className="pp-btn danger"
          style={{
            background: '#FEF2F2',
            color: '#EF4444',
            border: '1px solid #FEECEC',
            padding: '1rem 1.5rem',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
          onClick={() => { logout(); navigate('/'); }}
        >
          Logout Securely
        </button>
      </div>
    </div>
  );
}
