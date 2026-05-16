import React from 'react';
import { BedDouble, Info, HeartPulse, Wind, Thermometer, Activity } from 'lucide-react';
import './VisualWardMap.css';

export default function VisualWardMap({ 
    title = "Visual Ward Map", 
    subtitle = "Ward Floor Plan", 
    beds = [], 
    onBedClick 
}) {
    return (
        <div className="visual-ward-map-container">
            <header className="ward-map-header">
                <div className="header-text">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
                <div className="ward-legend">
                    <div className="legend-item">
                        <span className="dot available"></span>
                        AVAILABLE
                    </div>
                    <div className="legend-item">
                        <span className="dot occupied"></span>
                        OCCUPIED
                    </div>
                    <div className="legend-item">
                        <span className="dot critical"></span>
                        CRITICAL
                    </div>
                    <div className="legend-item">
                        <span className="dot cleaning"></span>
                        MAINTENANCE
                    </div>
                </div>
            </header>

            <div className="ward-grid">
                {beds.map((bed) => (
                    <div 
                        key={bed.id} 
                        className={`bed-card ${bed.status.toLowerCase().replace(' ', '_')}`}
                        onClick={() => onBedClick && onBedClick(bed)}
                    >
                        <div className="bed-icon-wrapper">
                            <BedDouble size={20} />
                        </div>
                        <div className="bed-info">
                            <span className="bed-id">{bed.bedNumber}</span>
                            <span className="bed-status-text">
                                {bed.status.toUpperCase() === 'AVAILABLE' ? 'VACANT' : bed.status.replace('_', ' ')}
                            </span>
                        </div>
                        
                        {(bed.status === 'OCCUPIED' || bed.status === 'CRITICAL' || bed.status === 'UNDER OBSERVATION') && bed.patientName && (
                            <div className="bed-details animate-fade-in">
                                <div className="patient-name-row">
                                    <Info size={12} />
                                    <span>{bed.patientName}</span>
                                </div>
                                <div className="patient-sub-details">
                                    <span className="patient-uhid">{bed.patientMRN || 'No UHID'}</span>
                                    <div className="bed-vitals-grid">
                                        <div className="mini-vital"><HeartPulse size={10}/> {bed.vitals?.pulse || '--'}</div>
                                        <div className="mini-vital"><Wind size={10}/> {bed.vitals?.spo2 || '--'}%</div>
                                        <div className="mini-vital"><Activity size={10}/> {bed.vitals?.bp || '--'}</div>
                                        <div className="mini-vital"><Thermometer size={10}/> {bed.vitals?.temp || '--'}</div>
                                    </div>
                                    <button className="btn-update-vitals" onClick={(e) => { e.stopPropagation(); onBedClick(bed); }}>
                                        UPDATE
                                    </button>
                                </div>
                            </div>
                        )}

                        {bed.status === 'CRITICAL' && (
                            <div className="critical-badge">CRITICAL</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
