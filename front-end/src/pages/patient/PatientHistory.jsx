import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { usePatientRealtime } from '../../hooks/usePatientRealtime';
import FullscreenPrescriptionModal from '../../components/patient/FullscreenPrescriptionModal';
import './PatientPortal.css';

export default function PatientHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const patientId = user?.patientProfileId;

  const load = async () => {
    if (!patientId) return;
    const token = localStorage.getItem('hospflow_auth_token');
    const res = await fetch(`${API_BASE_URL}/history/patient/${patientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setRecords(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (!user) navigate('/patient-login');
    else load();
  }, [user, patientId]);

  usePatientRealtime(patientId, { onPrescription: load, onAppointment: load });

  return (
    <div className="patient-portal">
      <h1>Medical history</h1>
      <Link to="/patient">← My Health</Link>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : records.length === 0 ? (
        <p className="muted">No records yet.</p>
      ) : (
        <ul className="pp-list" style={{ marginTop: '1rem' }}>
          {records.map((r) => (
            <li key={r._id} className="pp-card" style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong>{r.title}</strong>
              <span>{r.type} · {new Date(r.createdAt).toLocaleDateString()}</span>
              <span>{r.doctor} · {r.hospital}</span>
              {r.fileUrl && (r.fileUrl.startsWith('data:image/') || r.fileUrl.startsWith('http')) && (
                <div style={{ marginTop: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', background: '#fff', width: 'fit-content' }}>
                  <img src={r.fileUrl} alt="Visual Prescription Thumbnail" style={{ maxWidth: '160px', maxHeight: '100px', display: 'block', borderRadius: '4px' }} />
                </div>
              )}
              <button
                type="button"
                className="pp-btn ghost"
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setSelectedPrescription(r)}
              >
                View Fullscreen / PDF
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedPrescription && (
        <FullscreenPrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
}
