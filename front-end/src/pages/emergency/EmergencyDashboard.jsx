import React, { useState, useEffect } from 'react';
import { Plus, Activity, AlertCircle, ChevronRight, Shield, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { io } from 'socket.io-client';

const socket = io(API_BASE_URL.replace('/api', ''));

function priorityClass(priority) {
  const p = (priority || '').toLowerCase();
  if (p === 'critical') return 'critical';
  if (p === 'serious') return 'serious';
  return 'stable';
}

export default function EmergencyDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    emergencyType: 'General Emergency',
    condition: '',
    priority: 'Stable',
    phone: '',
    relativeName: '',
  });

  useEffect(() => {
    fetchCases();
    socket.on('emergencyUpdated', fetchCases);
    return () => socket.off('emergencyUpdated');
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency`);
      const data = await res.json();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch emergency cases', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowForm(false);
        setFormData({
          patientName: '', age: '', gender: '',
          emergencyType: 'General Emergency', condition: '',
          priority: 'Stable', phone: '', relativeName: '',
        });
        fetchCases();
        alert(`Emergency case registered: ${data.caseId}${data.erToken ? ` · Queue token ${data.erToken}` : ''}`);
      } else {
        alert(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Failed to create emergency case', err);
      alert('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) =>
    c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalCount = cases.filter((c) => c.priority === 'Critical').length;
  const seriousCount = cases.filter((c) => c.priority === 'Serious').length;
  const activeCount = cases.filter((c) => !['DISCHARGED', 'REFERRED'].includes(c.currentStatus)).length;

  return (
    <div className="hb-page">
      <div className="hb-page-inner">
        <header className="hb-page-header">
          <div className="hb-page-header-row">
            <div className="hb-page-header-icon er">ER</div>
            <div className="hb-page-header-text">
              <p className="hb-eyebrow">Emergency department</p>
              <h1>Emergency response center</h1>
              <p>Real-time triage, case tracking, and EMR handoff</p>
            </div>
          </div>
          <div className="hb-header-actions">
            <div className="hb-emergency-search">
              <Search size={18} color="#64748b" />
              <input
                placeholder="Search by ID or name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search emergency cases"
              />
            </div>
            <button type="button" className="hb-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={20} />
              New emergency case
            </button>
          </div>
        </header>

        <div className="hb-metrics-row">
          <div className="hb-metric-card">
            <div className="hb-metric-icon red">
              <AlertCircle size={20} />
            </div>
            <p className="hb-metric-label">Critical</p>
            <p className="hb-metric-value">{criticalCount}</p>
            <p className="hb-metric-sub">Immediate attention</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon warn">
              <Activity size={20} />
            </div>
            <p className="hb-metric-label">Serious</p>
            <p className="hb-metric-value">{seriousCount}</p>
            <p className="hb-metric-sub">Elevated priority</p>
          </div>
          <div className="hb-metric-card">
            <div className="hb-metric-icon blue">
              <Shield size={20} />
            </div>
            <p className="hb-metric-label">Active cases</p>
            <p className="hb-metric-value">{activeCount}</p>
            <p className="hb-metric-sub">In the ER workflow</p>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="hb-hero-idle">
            <AlertCircle size={48} />
            <h4>No emergency cases</h4>
            <p>Register a new case to begin triage and queue tracking.</p>
            <button type="button" className="hb-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} />
              Register case
            </button>
          </div>
        ) : (
          <div className="hb-card-grid hb-card-grid--emergency">
            {filteredCases.map((c) => (
              <article
                key={c._id}
                className={`hb-emergency-case-card priority-${priorityClass(c.priority)}`}
                onClick={() => navigate('/emr', { state: { emergencyCase: c } })}
              >
                <div className="hb-emergency-card-grid">
                  <div className="hb-emergency-card-left">
                    <div className="hb-case-row" style={{ marginBottom: '0.5rem' }}>
                      <span className="hb-case-id">{c.caseId}</span>
                      <span className={`hb-priority-pill ${priorityClass(c.priority)}`}>
                        {c.priority}
                      </span>
                    </div>
                    <h3 className="hb-patient-card-name" title={c.patientName}>{c.patientName}</h3>
                    <div className="hb-patient-card-meta" style={{ marginBottom: '0.5rem' }}>
                      <span className="hb-meta-pill age">{c.age}y</span>
                      <span className="hb-meta-pill gender">{c.gender}</span>
                    </div>
                    <p className="hb-case-doctor-row">
                      <Shield size={14} />
                      <span>{c.assignedDoctor || 'Unassigned'}</span>
                    </p>
                  </div>

                  <div className="hb-emergency-card-right">
                    <div className="hb-case-right-top">
                      <span className={`hb-status-pill status-${(c.currentStatus || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.currentStatus}
                      </span>
                    </div>
                    <div className="hb-case-right-middle">
                      <span className="hb-meta-pill type">{c.emergencyType}</span>
                    </div>
                    <div className="hb-case-right-bottom">
                      <button
                        type="button"
                        className="hb-btn-primary hb-btn-emr-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/emr', { state: { emergencyCase: c } });
                        }}
                      >
                        Open EMR
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="hb-modal-overlay" role="dialog" aria-modal="true">
          <div className="hb-modal">
            <div className="hb-modal-header">
              <h2>Register emergency case</h2>
              <button type="button" className="hb-modal-close" onClick={() => setShowForm(false)} aria-label="Close">
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="hb-form-grid">
                <div className="hb-form-group full">
                  <label>Patient full name</label>
                  <input name="patientName" required value={formData.patientName} onChange={handleInputChange} placeholder="e.g. Rahul Verma" />
                </div>
                <div className="hb-form-group">
                  <label>Age</label>
                  <input name="age" type="number" required value={formData.age} onChange={handleInputChange} />
                </div>
                <div className="hb-form-group">
                  <label>Gender</label>
                  <select name="gender" required value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="hb-form-group">
                  <label>Emergency type</label>
                  <select name="emergencyType" value={formData.emergencyType} onChange={handleInputChange}>
                    <option value="General Emergency">General Emergency</option>
                    <option value="Cardiac">Cardiac</option>
                    <option value="Trauma">Trauma</option>
                    <option value="ENT">ENT</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedic">Orthopedic</option>
                  </select>
                </div>
                <div className="hb-form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange}>
                    <option value="Stable">Stable (green)</option>
                    <option value="Serious">Serious (orange)</option>
                    <option value="Critical">Critical (red)</option>
                  </select>
                </div>
                <div className="hb-form-group full">
                  <label>Initial condition</label>
                  <textarea name="condition" value={formData.condition} onChange={handleInputChange} placeholder="Brief clinical summary…" />
                </div>
                <div className="hb-form-group">
                  <label>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="hb-form-group">
                  <label>Relative / informant</label>
                  <input name="relativeName" value={formData.relativeName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="hb-modal-footer">
                <button type="button" className="hb-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="hb-btn-primary" disabled={loading}>
                  {loading ? 'Registering…' : 'Initiate protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
