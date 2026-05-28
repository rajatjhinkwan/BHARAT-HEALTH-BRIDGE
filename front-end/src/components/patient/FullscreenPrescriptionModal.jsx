import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Printer, FileText } from 'lucide-react';

export default function FullscreenPrescriptionModal({ prescription, onClose }) {
  const [scale, setScale] = useState(1);

  if (!prescription) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.5));
  const handleReset = () => setScale(1);

  const handlePrint = () => {
    window.print();
  };

  const hasMedicines = prescription.prescriptionDetails?.medicines?.length > 0;

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="pp-modal-header">
          <div className="pp-modal-title-area">
            <FileText size={20} className="pp-modal-icon" />
            <div>
              <h3>Prescription Vault</h3>
              <p>{prescription.title} · {new Date(prescription.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="pp-modal-actions">
            <button type="button" className="pp-zoom-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="pp-zoom-level">{Math.round(scale * 100)}%</span>
            <button type="button" className="pp-zoom-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button type="button" className="pp-zoom-btn" onClick={handleReset} title="Reset Zoom">
              <RotateCcw size={16} />
            </button>
            <button type="button" className="pp-zoom-btn print-btn" onClick={handlePrint} title="Print / Save PDF">
              <Printer size={16} /> Print
            </button>
            <button type="button" className="pp-modal-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="pp-modal-body">
          <div className="pp-scale-wrapper">
            <div className="pp-print-area" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}>
              <div className="pp-prescription-paper">
                {/* Flag Accent */}
                <div className="pp-tricolor-bar">
                  <span className="orange"></span>
                  <span className="white"></span>
                  <span className="green"></span>
                </div>

                {/* Header */}
                <div className="pp-presc-header">
                  <div className="hospital-brand">
                    <h2>BHARAT HEALTH BRIDGE</h2>
                    <p className="subtitle">Unified EMR Gateway · Government of India</p>
                  </div>
                  <div className="hospital-details">
                    <h3>{prescription.hospital || 'Bharat Health Bridge'}</h3>
                    <p>Clinical OPD Services</p>
                    <p>New Delhi, India</p>
                  </div>
                </div>

                <div className="pp-divider"></div>

                {/* Metadata */}
                <div className="pp-presc-meta-grid">
                  <div>
                    <label>Doctor</label>
                    <strong>{prescription.doctor}</strong>
                  </div>
                  <div>
                    <label>Date</label>
                    <strong>{new Date(prescription.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <label>Prescription Title</label>
                    <strong>{prescription.title}</strong>
                  </div>
                  {prescription.prescriptionDetails?.diagnosis && (
                    <div className="full-width">
                      <label>Clinical Diagnosis</label>
                      <p className="diagnosis-text">{prescription.prescriptionDetails.diagnosis}</p>
                    </div>
                  )}
                </div>

                <div className="pp-divider"></div>

                {/* Core Content */}
                {hasMedicines && (
                  <div className="pp-presc-section">
                    <h4 className="section-title">Rx (Structured Medicines)</h4>
                    <table className="pp-meds-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescription.prescriptionDetails.medicines.map((m, idx) => (
                          <tr key={idx}>
                            <td className="med-name">{m.name}</td>
                            <td>{m.dosage}</td>
                            <td>{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {prescription.prescriptionDetails?.notes && (
                  <div className="pp-presc-section">
                    <h4 className="section-title">Doctor's Advice / Notes</h4>
                    <p className="advice-notes">{prescription.prescriptionDetails.notes}</p>
                  </div>
                )}

                {prescription.fileUrl && (prescription.fileUrl.startsWith('data:image/') || prescription.fileUrl.startsWith('http')) && (
                  <div className="pp-presc-section visual-pad-section">
                    <h4 className="section-title">Visual Doctor Pad</h4>
                    <div className="visual-pad-frame">
                      <img src={prescription.fileUrl} alt="Visual Doctor Pad Drawing" className="visual-pad-image" />
                    </div>
                  </div>
                )}

                <footer className="pp-presc-footer">
                  <p>Digitally signed & secured via Bharat Health Bridge Gateway.</p>
                  <p className="disclaimer">Compliant with the National Digital Health Mission (NDHM) DPDP regulations.</p>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
