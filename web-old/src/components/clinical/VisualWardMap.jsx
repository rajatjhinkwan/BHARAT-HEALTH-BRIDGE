import React from 'react';
import { BedDouble, Info } from 'lucide-react';
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
                        <span className="dot cleaning"></span>
                        CLEANING
                    </div>
                </div>
            </header>

            <div className="ward-grid">
                {beds.map((bed) => (
                    <div 
                        key={bed.id} 
                        className={`bed-card ${bed.status.toLowerCase()}`}
                        onClick={() => onBedClick && onBedClick(bed)}
                    >
                        <div className="bed-icon-wrapper">
                            <BedDouble size={20} />
                        </div>
                        <div className="bed-info">
                            <span className="bed-id">{bed.id}</span>
                            <span className="bed-status-text">
                                {bed.status.toUpperCase() === 'AVAILABLE' ? 'VACANT' : bed.status.toUpperCase()}
                            </span>
                        </div>
                        {bed.patientName && (
                            <div className="bed-patient-tag">
                                <Info size={12} />
                                {bed.patientName}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
