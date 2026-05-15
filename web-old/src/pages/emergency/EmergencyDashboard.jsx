import React, { useState, useEffect } from 'react';
import { Plus, Activity, User, Phone, AlertCircle, ChevronRight, Clock, Shield, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EmergencyDashboard.css';

const API_BASE_URL = 'http://localhost:4000/api';

import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

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
        relativeName: ''
    });

    useEffect(() => {
        fetchCases();
        
        socket.on('emergencyUpdated', () => {
            console.log('Emergency case updated via socket');
            fetchCases();
        });

        return () => {
            socket.off('emergencyUpdated');
        };
    }, []);


    const fetchCases = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/emergency`);
            const data = await res.json();
            setCases(data);
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
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({
                    patientName: '', age: '', gender: '',
                    emergencyType: 'General Emergency', condition: '',
                    priority: 'Stable', phone: '', relativeName: ''
                });
                fetchCases();
            }
        } catch (err) {
            console.error('Failed to create emergency case', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Critical': return 'var(--danger)';
            case 'Serious': return 'var(--warning)';
            default: return 'var(--success)';
        }
    };

    const filteredCases = cases.filter(c => 
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="emergency-dashboard-container animate-fade-in">
            <header className="emergency-header">
                <div className="header-left">
                    <div className="er-badge">ER</div>
                    <div>
                        <h1>Emergency Response Dashboard</h1>
                        <p>Real-time emergency case management & status tracking</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input 
                            placeholder="Search by ID or Name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary add-case-btn" onClick={() => setShowForm(true)}>
                        <Plus size={20} /> New Emergency Case
                    </button>
                </div>
            </header>

            <div className="stats-row">
                <div className="stat-card critical">
                    <AlertCircle size={24} />
                    <div className="stat-info">
                        <h3>{cases.filter(c => c.priority === 'Critical').length}</h3>
                        <p>Critical Cases</p>
                    </div>
                </div>
                <div className="stat-card serious">
                    <Activity size={24} />
                    <div className="stat-info">
                        <h3>{cases.filter(c => c.priority === 'Serious').length}</h3>
                        <p>Serious Cases</p>
                    </div>
                </div>
                <div className="stat-card active">
                    <Shield size={24} />
                    <div className="stat-info">
                        <h3>{cases.filter(c => !['DISCHARGED', 'REFERRED'].includes(c.currentStatus)).length}</h3>
                        <p>Active Cases</p>
                    </div>
                </div>
            </div>

            <main className="emergency-main">
                <div className="cases-table-wrapper">
                    <table className="emergency-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Patient Name</th>
                                <th>Priority</th>
                                <th>Emergency Type</th>
                                <th>Assigned Specialist</th>
                                <th>Current Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((c) => (
                                <tr key={c._id} className={`priority-${c.priority.toLowerCase()}`}>
                                    <td className="case-id">{c.caseId}</td>
                                    <td>
                                        <div className="patient-cell">
                                            <span className="p-name">{c.patientName}</span>
                                            <span className="p-meta">{c.age}Y • {c.gender}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="priority-pill" style={{ backgroundColor: `${getPriorityColor(c.priority)}20`, color: getPriorityColor(c.priority) }}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td>{c.emergencyType}</td>
                                    <td className="doc-cell">
                                        <Shield size={14} /> {c.assignedDoctor}
                                    </td>
                                    <td>
                                        <span className={`status-pill ${c.currentStatus.toLowerCase().replace(' ', '-')}`}>
                                            {c.currentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="open-emr-btn" onClick={() => navigate('/emr', { state: { emergencyCase: c } })}>
                                            Open EMR <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {showForm && (
                <div className="modal-overlay">
                    <div className="emergency-form-modal animate-fade-in-up">
                        <div className="modal-header">
                            <h2>Register Emergency Case</h2>
                            <button className="close-modal" onClick={() => setShowForm(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="emergency-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Patient Full Name</label>
                                    <input name="patientName" required value={formData.patientName} onChange={handleInputChange} placeholder="e.g. Rahul Verma" />
                                </div>
                                <div className="form-row-half">
                                    <div className="form-group">
                                        <label>Age</label>
                                        <input name="age" type="number" required value={formData.age} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select name="gender" required value={formData.gender} onChange={handleInputChange}>
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Emergency Type</label>
                                    <select name="emergencyType" value={formData.emergencyType} onChange={handleInputChange}>
                                        <option value="General Emergency">General Emergency</option>
                                        <option value="Cardiac">Cardiac</option>
                                        <option value="Trauma">Trauma</option>
                                        <option value="ENT">ENT</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Orthopedic">Orthopedic</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority Level</label>
                                    <select name="priority" value={formData.priority} onChange={handleInputChange}>
                                        <option value="Stable">Stable (Green)</option>
                                        <option value="Serious">Serious (Orange)</option>
                                        <option value="Critical">Critical (Red)</option>
                                    </select>
                                </div>
                                <div className="form-group full">
                                    <label>Initial Condition Description</label>
                                    <textarea name="condition" value={formData.condition} onChange={handleInputChange} placeholder="Brief details about patient condition..." />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phone" value={formData.phone} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Relative / Informant Name</label>
                                    <input name="relativeName" value={formData.relativeName} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Registering...' : 'Initiate Emergency Protocol'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
