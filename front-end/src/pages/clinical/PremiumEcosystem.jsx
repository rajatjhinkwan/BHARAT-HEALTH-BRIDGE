import React, { useState, useEffect } from 'react';
import './PremiumEcosystem.css';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const PremiumEcosystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [doctors, setDoctors] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [emergencyCard, setEmergencyCard] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchPremiumData();
  }, []);

  const fetchPremiumData = async () => {
    try {
      const [docRes, scoreRes, cardRes, aiRes] = await Promise.all([
        fetch(`${API_BASE_URL}/premium/doctors`),
        fetch(`${API_BASE_URL}/premium/health-score/${user?.id || 'demo123'}`),
        fetch(`${API_BASE_URL}/premium/emergency-card/${user?.id || 'demo123'}`),
        fetch(`${API_BASE_URL}/premium/ai-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: [{ note: 'patient has high bp' }] })
        })
      ]);

      setDoctors(await docRes.json());
      setHealthScore(await scoreRes.json());
      setEmergencyCard(await cardRes.json());
      setAiInsights(await aiRes.json());
    } catch (err) {
      console.error('Error fetching premium ecosystem data', err);
    }
  };

  return (
    <div className="premium-ecosystem-container">
      <div className="premium-ecosystem-header">
        <div className="pe-header-left">
          <div className="pe-badge">★ GOLD ECOSYSTEM MEMBER</div>
          <h1 className="pe-title">Premium Health Wallet</h1>
          <p className="pe-subtitle">Welcome back, {user?.name || 'Rahul Sharma'}</p>
        </div>
        {healthScore && (
          <div className="pe-health-score-widget">
            <div className="pe-score-circle">
              <span className="pe-score-value">{healthScore.score}</span>
              <span className="pe-score-label">Health</span>
            </div>
            <div className="pe-score-status">{healthScore.status}</div>
          </div>
        )}
      </div>

      <div className="pe-tabs">
        <button className={`pe-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <i className="fa-solid fa-heart-pulse"></i> Ecosystem Summary
        </button>
        <button className={`pe-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          <i className="fa-solid fa-timeline"></i> Patient Timeline
        </button>
        <button className={`pe-tab ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>
          <i className="fa-solid fa-user-doctor"></i> Premium Doctors
        </button>
      </div>

      <div className="pe-content">
        {activeTab === 'summary' && (
          <div className="pe-summary-grid">
            {emergencyCard && (
              <div className="pe-card emergency-card-section">
                <div className="pe-card-header text-danger">
                  <i className="fa-solid fa-notes-medical"></i> Digital Emergency Medical Card
                </div>
                <div className="emergency-card-body">
                  <div className="ec-row"><strong>Name:</strong> {emergencyCard.name}</div>
                  <div className="ec-row"><strong>DOB:</strong> {emergencyCard.dob} ({emergencyCard.age} Years)</div>
                  <div className="ec-row"><strong>Blood Group:</strong> <span className="blood-badge">{emergencyCard.bloodGroup}</span></div>
                  <div className="ec-row"><strong>Allergies:</strong> {emergencyCard.allergies.join(', ')}</div>
                  <div className="ec-row"><strong>Chronic:</strong> {emergencyCard.chronicDiseases.join(', ')}</div>
                  <div className="ec-actions">
                    <button className="pe-btn pe-btn-primary" onClick={() => setShowQR(!showQR)}>
                      <i className="fa-solid fa-qrcode"></i> {showQR ? 'Hide QR' : 'Show Patient QR'}
                    </button>
                  </div>
                  {showQR && (
                    <div className="qr-container">
                      <div className="qr-mock">
                        <i className="fa-solid fa-qrcode"></i>
                      </div>
                      <p className="qr-text">Scan for immediate access to medical history</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {aiInsights && (
              <div className="pe-card ai-insights-section">
                <div className="pe-card-header text-ai">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> AI Health Insights Engine
                </div>
                <div className="ai-body">
                  <p className="ai-summary">{aiInsights.summary}</p>
                  
                  {aiInsights.anomalies.length > 0 && (
                    <div className="ai-list">
                      <strong>Anomalies Detected:</strong>
                      <ul>
                        {aiInsights.anomalies.map((a, i) => <li key={i}><i className="fa-solid fa-triangle-exclamation text-warning"></i> {a}</li>)}
                      </ul>
                    </div>
                  )}

                  {aiInsights.suggestions.length > 0 && (
                    <div className="ai-list mt-3">
                      <strong>Recommendations:</strong>
                      <ul>
                        {aiInsights.suggestions.map((s, i) => <li key={i}><i className="fa-solid fa-check text-success"></i> {s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="pe-card live-queue-section">
              <div className="pe-card-header text-warning">
                <i className="fa-solid fa-hourglass-half"></i> Live Queue Status
              </div>
              <div className="queue-body">
                <div className="queue-highlight">Room #4 (Cardiology)</div>
                <p><strong>Dr. R. Sharma</strong></p>
                <div className="queue-stats">
                  <div className="stat"><span>Current Token:</span> <strong>#14</strong></div>
                  <div className="stat"><span>Your Token:</span> <strong>#18</strong></div>
                  <div className="stat"><span>Wait Time:</span> <strong>~20 mins</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="pe-doctors-grid">
            {doctors.map(doc => (
              <div key={doc.id} className="pe-doc-card">
                <div className="pe-doc-header">
                  <img src={doc.avatar} alt={doc.name} className="pe-doc-avatar" />
                  <div className="pe-doc-info">
                    <h4>{doc.name} <i className="fa-solid fa-circle-check text-primary"></i></h4>
                    <p className="doc-spec">{doc.specialization} • {doc.experience}</p>
                    <p className="doc-qual">{doc.qualification}</p>
                  </div>
                </div>
                <p className="doc-bio">{doc.bio}</p>
                <div className="doc-badges">
                  {doc.badges?.map((badge, idx) => (
                    <span key={idx} className="doc-badge">{badge}</span>
                  ))}
                </div>
                <div className="doc-stats">
                  <div><span>⭐ {doc.rating}</span><label>Rating</label></div>
                  <div><span>{doc.patients}</span><label>Patients</label></div>
                  <div><span>{doc.fees}</span><label>Consult Fee</label></div>
                </div>
                <button className="pe-btn pe-btn-primary w-100 mt-3">Book Premium Consultation</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="pe-timeline">
            <div className="timeline-item">
              <div className="tl-icon bg-primary"><i className="fa-solid fa-file-prescription"></i></div>
              <div className="tl-content">
                <div className="tl-header">
                  <span className="tl-date">18 March 2026</span>
                  <span className="tl-badge bg-primary-light text-primary">PRESCRIPTION</span>
                </div>
                <h5>Consultation & Prescription</h5>
                <p>Augmentin 625 Duo, Metformin 500mg</p>
                <small>Dr. R. Sharma • AIIMS Rishikesh</small>
                
                <div className="tl-voice-note">
                  <i className="fa-solid fa-circle-play text-primary"></i> Voice Note Available (0:45)
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="tl-icon bg-purple"><i className="fa-solid fa-x-ray"></i></div>
              <div className="tl-content">
                <div className="tl-header">
                  <span className="tl-date">10 March 2026</span>
                  <span className="tl-badge bg-purple-light text-purple">MRI SCAN</span>
                </div>
                <h5>Brain MRI Scan</h5>
                <p>Report reveals normal cerebral cortex with no acute infarction.</p>
                <small>Dr. V. Gupta • Himalayan Hospital</small>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="pe-floating-sos">
        <button className="sos-btn" onClick={() => alert('SOS Emergency Triggered!')}>
          <i className="fa-solid fa-triangle-exclamation"></i> ACTIVATE SOS EMERGENCY
        </button>
      </div>
    </div>
  );
};

export default PremiumEcosystem;
