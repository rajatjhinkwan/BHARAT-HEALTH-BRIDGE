import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Pill, Building2, Settings, RefreshCw, LogOut, ListOrdered } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { usePatientRealtime } from '../../hooks/usePatientRealtime';
import PatientJourneyFlow from '../../components/patient/PatientJourneyFlow';
import FullscreenPrescriptionModal from '../../components/patient/FullscreenPrescriptionModal';
import VoiceNotesPanel from '../../components/patient/VoiceNotesPanel';
import './PatientPortal.css';

export default function PatientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const token = localStorage.getItem('hospflow_auth_token');
  const patientId = user?.patientProfileId || dashboard?.patient?.id;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const dashRes = await fetch(`${API_BASE_URL}/patient/dashboard`, { headers });
      const dash = await dashRes.json();
      if (!dashRes.ok) throw new Error(dash.error || 'Failed to load');
      setDashboard(dash);

      const pid = dash.patient?.id || dash.user?.patientProfileId;
      if (pid) {
        const histRes = await fetch(`${API_BASE_URL}/history/patient/${pid}`, { headers });
        if (histRes.ok) setHistory(await histRes.json());
      }
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      navigate('/patient-login');
      return;
    }
    load();
  }, [user, load, navigate]);

  usePatientRealtime(patientId, {
    onPrescription: () => {
      setToast('New prescription from your doctor — synced live.');
      load();
    },
    onAppointment: () => {
      setToast('Appointment updated.');
      load();
    },
    onPatientRecord: () => {
      setToast('Your doctor updated your record.');
      load();
    },
    onQueueUpdate: () => {
      load();
    },
  });

  const appointments = useMemo(() => {
    const upcoming = dashboard?.upcomingAppointments || [];
    const all = dashboard?.appointments || [];
    const byKey = new Map();
    [...upcoming, ...all].forEach((a) => {
      const key = a._id || a.appointmentId || `${a.appointmentDate}-${a.appointmentTime}-${a.doctorId}`;
      if (!byKey.has(key)) byKey.set(key, a);
    });
    return Array.from(byKey.values()).sort((a, b) => {
      const da = `${a.appointmentDate || ''} ${a.appointmentTime || ''}`;
      const db = `${b.appointmentDate || ''} ${b.appointmentTime || ''}`;
      return db.localeCompare(da);
    });
  }, [dashboard]);

  if (!user) return null;

  const prescriptions = history.filter((r) => r.type === 'prescription');
  const queue = dashboard?.queueStatus;
  const journey = dashboard?.patientJourney;

  return (
    <div className="patient-portal">
      <header className="pp-header">
        <div>
          <h1>My Health Bridge</h1>
          <p>Welcome, {dashboard?.patient?.patientName || user.name}</p>
        </div>
        <div className="pp-header-actions">
          <button type="button" className="pp-btn ghost" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/patient-settings" className="pp-btn ghost">
            <Settings size={16} /> Settings
          </Link>
          <button type="button" className="pp-btn danger" onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {toast && <div className="pp-toast">{toast}</div>}

      <div className="pp-grid">
        <section className="pp-card">
          <h2><ListOrdered size={18} /> Active Queue</h2>
          {!queue ? (
            <p className="muted">No active queue token right now.</p>
          ) : (
            <div className="pp-queue">
              <div className="pp-queue-row">
                <strong>{queue.tokenNumber}</strong>
                <span className={`pp-status ${queue.status?.toLowerCase()}`}>{queue.status}</span>
              </div>
              <p className="pp-detail">{queue.department}</p>
              {queue.status === 'WAITING' && (
                <p className="pp-detail">
                  Position #{queue.position || '—'} · Approx wait {queue.estimatedWaitMins || 0} mins
                </p>
              )}
              <Link
                to={`/hospital-navigation?department=${encodeURIComponent(queue.department || '')}`}
                className="pp-queue-nav-link"
              >
                Open hospital wayfinder for this department
              </Link>
            </div>
          )}
        </section>

        <section className="pp-card">
          <h2><Building2 size={18} /> Care Flow Map</h2>
          <PatientJourneyFlow journey={journey} />
        </section>

        <section className="pp-card">
          <h2><Calendar size={18} /> Appointments</h2>
          {loading ? <p className="muted">Loading…</p> : appointments.length === 0 ? (
            <p className="muted">No appointments yet. <Link to="/hospitals">Find a hospital</Link> to book.</p>
          ) : (
            <ul className="pp-list">
              {appointments.slice(0, 8).map((a) => (
                <li key={a._id || a.appointmentId}>
                  <strong>{a.appointmentDate} {a.appointmentTime}</strong>
                  <span>{a.doctorName} · {a.department}</span>
                  <span className={`pp-status ${a.status?.toLowerCase()}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <VoiceNotesPanel records={history} />

        <section className="pp-card">
          <h2><Pill size={18} /> Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <p className="muted">Prescriptions from your doctor appear here in real time after consultation.</p>
          ) : (
            <ul className="pp-list">
              {prescriptions.slice(0, 8).map((r) => (
                <li key={r._id}>
                  <strong>{r.title}</strong>
                  <span>{r.doctor} · {r.hospital}</span>
                  {r.prescriptionDetails?.diagnosis && (
                    <p className="pp-detail">{r.prescriptionDetails.diagnosis}</p>
                  )}
                  {r.prescriptionDetails?.medicines?.length > 0 && (
                    <ul className="pp-meds">
                      {r.prescriptionDetails.medicines.map((m, i) => (
                        <li key={i}>{m.name} — {m.dosage} ({m.duration})</li>
                      ))}
                    </ul>
                  )}
                  {r.fileUrl && (r.fileUrl.startsWith('data:image/') || r.fileUrl.startsWith('http')) && (
                    <div className="pp-canvas-wrap" style={{ marginTop: '0.75rem' }}>
                      <span className="pp-canvas-label" style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Visual Doctor Pad</span>
                      <div className="pp-canvas-frame" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', background: '#fff', display: 'inline-block' }}>
                        <img src={r.fileUrl} alt="Visual Prescription Drawing" style={{ maxWidth: '100%', maxHeight: '180px', display: 'block', borderRadius: '6px' }} />
                      </div>
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
        </section>

        <section className="pp-card pp-card-wide">
          <h2><Building2 size={18} /> Quick links</h2>
          <div className="pp-links">
            <Link to="/hospitals" className="pp-link-card">Find hospitals near you</Link>
            <Link to="/patient-history" className="pp-link-card">Full medical history</Link>
            <Link to="/hospital-navigation" className="pp-link-card">Hospital indoor navigation</Link>
            <Link to="/schedule" className="pp-link-card">Staff: book at reception</Link>
          </div>
        </section>
      </div>

      {selectedPrescription && (
        <FullscreenPrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
}
