import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import './PatientPortal.css';

export default function PatientLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        phone: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`,
        password,
      };
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login({ ...data.user, patientProfileId: data.user.patientProfileId }, data.token);
      navigate('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-portal" style={{ maxWidth: 420 }}>
      <h1>Patient login</h1>
      <p className="muted">Use your Health Bridge mobile number and password.</p>
      <p className="muted" style={{ fontSize: '0.8rem' }}>Demo: 9876543210 / patient123</p>
      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Mobile (+91)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            style={{ width: '100%', padding: '0.75rem', marginTop: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', marginTop: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        </label>
        {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
        <button type="submit" className="pp-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/login">Hospital staff login</Link> · <Link to="/">Home</Link>
      </p>
    </div>
  );
}
