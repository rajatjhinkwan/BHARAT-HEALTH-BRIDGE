import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { usePatientRealtime } from '../../hooks/usePatientRealtime';
import FullscreenPrescriptionModal from '../../components/patient/FullscreenPrescriptionModal';
import VoiceNotesPanel from '../../components/patient/VoiceNotesPanel';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './PatientPortal.css';

export default function PatientHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [verifications, setVerifications] = useState({});
  const patientId = user?.patientProfileId;

  const verifyRecord = async (recordId) => {
    setVerifications(prev => ({
      ...prev,
      [recordId]: { loading: true }
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/blockchain/verify/${recordId}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(prev => ({
          ...prev,
          [recordId]: {
            loading: false,
            verified: data.verified,
            blockIndex: data.blockIndex,
            blockHash: data.blockHash,
            reason: data.reason
          }
        }));
        if (data.verified) {
          toast.success(`Ledger Verification: Record is authentic! (Block #${data.blockIndex})`, {
            icon: '🛡️',
            duration: 4000
          });
        } else {
          toast.error(`Security Alert: Record has been altered! (${data.reason})`, {
            duration: 6000
          });
        }
      } else {
        setVerifications(prev => ({
          ...prev,
          [recordId]: { loading: false, error: true }
        }));
        toast.error('Failed to contact security ledger.');
      }
    } catch (e) {
      console.error(e);
      setVerifications(prev => ({
        ...prev,
        [recordId]: { loading: false, error: true }
      }));
      toast.error('Cryptographic check failed.');
    }
  };

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

  usePatientRealtime(patientId, {
    onPrescription: (p) => {
      toast.success(`Security Ledger: New medical history received and secured on-chain!`, {
        icon: '🔗',
        duration: 5000
      });
      load();
    },
    onAppointment: load,
    onConsultation: () => {
      toast.success('Consultation status updated live from clinic.');
      load();
    },
    onVoiceNote: () => {
      toast.success('New doctor voice note synced to your vault.');
      load();
    },
    onPatientRecord: load,
  });

  return (
    <div className="patient-portal">
      <h1>Medical history</h1>
      <Link to="/patient" className="pp-history-back">← Back to My Health</Link>
      {!loading && records.some((r) => r.type === 'voice_note') && (
        <div style={{ marginTop: '1rem' }}>
          <VoiceNotesPanel records={records} />
        </div>
      )}
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

              {/* Blockchain Seal Verification */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                {verifications[r._id] ? (
                  verifications[r._id].loading ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={12} className="animate-spin" /> Verifying seal...
                    </span>
                  ) : verifications[r._id].verified ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--success-light)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <ShieldCheck size={12} /> Verified Authentic · Block #{verifications[r._id].blockIndex}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--danger-light)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <ShieldAlert size={12} /> Integrity issue ({verifications[r._id].reason || 'Hash mismatch'})
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    className="pp-btn ghost"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-hover)', cursor: 'pointer' }}
                    onClick={() => verifyRecord(r._id)}
                  >
                    <ShieldCheck size={12} color="var(--primary)" /> Verify ledger seal
                  </button>
                )}
              </div>
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
