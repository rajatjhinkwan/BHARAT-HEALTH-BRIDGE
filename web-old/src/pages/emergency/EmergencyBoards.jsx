import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, FlaskConical, Wind, User, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EmergencyBoards.css';

const API_BASE_URL = 'http://localhost:4000/api';

export default function EmergencyBoards() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [activeBoard, setActiveBoard] = useState('IN ICU');
    const [loading, setLoading] = useState(true);

    const boards = [
        { id: 'IN ICU', label: 'ICU Monitor', icon: <Activity size={18} />, color: '#ef4444' },
        { id: 'ON VENTILATOR', label: 'Ventilator Support', icon: <Wind size={18} />, color: '#8b5cf6' },
        { id: 'LAB PENDING', label: 'Lab Pending', icon: <FlaskConical size={18} />, color: '#f59e0b' },
        { id: 'ADMITTED', label: 'Admitted Ward', icon: <User size={18} />, color: '#10b981' },
    ];

    useEffect(() => {
        fetchCases();
        const interval = setInterval(fetchCases, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchCases = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/emergency`);
            const data = await res.json();
            setCases(data);
        } catch (err) {
            console.error('Failed to fetch emergency cases', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCases = cases.filter(c => c.currentStatus === activeBoard);

    return (
        <div className="emergency-boards-container animate-fade-in">
            <header className="boards-header">
                <div className="header-title">
                    <h1>Departmental Workflow Boards</h1>
                    <p>Live tracking of emergency patients across critical departments</p>
                </div>
                <div className="active-board-indicator" style={{ borderColor: boards.find(b => b.id === activeBoard).color }}>
                    <span className="pulse-dot" style={{ backgroundColor: boards.find(b => b.id === activeBoard).color }}></span>
                    Live Data Feed
                </div>
            </header>

            <nav className="boards-nav">
                {boards.map(board => (
                    <button 
                        key={board.id} 
                        className={`board-tab ${activeBoard === board.id ? 'active' : ''}`}
                        onClick={() => setActiveBoard(board.id)}
                        style={{ '--active-color': board.color }}
                    >
                        {board.icon}
                        <span>{board.label}</span>
                        <span className="case-count">{cases.filter(c => c.currentStatus === board.id).length}</span>
                    </button>
                ))}
            </nav>

            <main className="boards-grid">
                {filteredCases.length > 0 ? (
                    filteredCases.map(c => (
                        <div key={c._id} className="patient-board-card animate-fade-in-up">
                            <div className="card-top">
                                <div className="p-info">
                                    <span className="case-id">{c.caseId}</span>
                                    <h3>{c.patientName}</h3>
                                    <span className="p-sub">{c.age}Y • {c.gender} • {c.emergencyType}</span>
                                </div>
                                <div className={`priority-indicator ${c.priority.toLowerCase()}`}>
                                    {c.priority}
                                </div>
                            </div>

                            <div className="vitals-row">
                                <div className="vital-mini">
                                    <Activity size={14} /> <span>{c.vitals?.hr || '--'}</span>
                                </div>
                                <div className="vital-mini">
                                    <Thermometer size={14} /> <span>{c.vitals?.temp || '--'}</span>
                                </div>
                                <div className="vital-mini">
                                    <Droplets size={14} /> <span>{c.vitals?.spO2 || '--'}</span>
                                </div>
                            </div>

                            <div className="assigned-info">
                                <span className="label">Assigned Specialist:</span>
                                <span className="value">{c.assignedDoctor}</span>
                            </div>

                            <div className="card-actions">
                                <button className="board-open-emr" onClick={() => navigate('/emr', { state: { emergencyCase: c } })}>
                                    Update Vitals & EMR <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-board">
                        <AlertTriangle size={48} />
                        <h2>No Patients Currently in {boards.find(b => b.id === activeBoard).label}</h2>
                        <p>All emergency cases are currently cleared or in other departments.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
