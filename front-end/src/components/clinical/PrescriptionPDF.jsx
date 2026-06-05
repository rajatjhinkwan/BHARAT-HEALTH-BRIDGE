import React, { forwardRef } from 'react';
import { Activity, Heart, Thermometer, Droplets } from 'lucide-react';

const PrescriptionPDF = forwardRef(({ patient, doctor, clinicalData, medications, investigations, followUp, generalAdvice }, ref) => {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const hasDiagnosis = Boolean(clinicalData?.diagnosisText || clinicalData?.diagnosisCanvas);
  const hasMedications = medications?.length > 0;
  const hasMedicineCanvas = Boolean(clinicalData?.medicineCanvas);
  const hasInvestigations = investigations?.length > 0;
  const hasInvestigationCanvas = Boolean(clinicalData?.investigationCanvas);
  const hasAdvice = Boolean(generalAdvice || clinicalData?.notesText);

  return (
    <div ref={ref} className="prescription-pdf-container">
      <header className="pdf-header">
        <div className="hospital-branding">
          <div className="logo-placeholder">
             <Activity size={28} color="#3b82f6" />
          </div>
          <div className="hospital-names">
            <h1>BHARAT HEALTH BRIDGE</h1>
            <p className="sub-branding">NATIONAL DIGITAL HEALTH MISSION COMPLIANT</p>
            <p className="hospital-address">Smart Healthcare Hub, Sector 44, Gurugram, Haryana</p>
          </div>
        </div>
        <div className="doctor-info-box">
          <h2 className="doctor-name">Dr. {doctor?.name || 'A. Sharma'}</h2>
          <p className="doctor-dept">{doctor?.department || 'Department of General Medicine'}</p>
          <p className="doctor-reg">MCI Reg No: {doctor?.registrationId || 'MCI/DEL/9942/2026'}</p>
        </div>
      </header>

      <div className="divider-line primary"></div>

      {/* PATIENT INFO PANEL */}
      <section className="patient-info-panel">
        <div className="info-grid">
          <div className="info-col">
            <p><span className="label">Patient Name:</span> <span className="val">{patient?.name}</span></p>
            <p><span className="label">UHID / MRN:</span> <span className="val">{patient?.mrn}</span></p>
            <p><span className="label">Address:</span> <span className="val">{patient?.address || 'N/A'}</span></p>
          </div>
          <div className="info-col">
            <p><span className="label">Date:</span> <span className="val">{today}</span></p>
            <p><span className="label">Age / Sex:</span> <span className="val">{patient?.age}Y / {patient?.gender}</span></p>
          </div>
        </div>

        {/* VITALS STRIP */}
        <div className="pdf-vitals-strip">
          <div className="vital-item">
            <Heart size={14} className="icon-red" />
            <span>BP: {patient?.vitals?.bp || '120/80'} mmHg</span>
          </div>
          <div className="vital-item">
            <Activity size={14} className="icon-blue" />
            <span>Pulse: {patient?.vitals?.hr || patient?.vitals?.heartRate || '72'} bpm</span>
          </div>
          <div className="vital-item">
            <Droplets size={14} className="icon-teal" />
            <span>SpO2: {patient?.vitals?.spo2 || '98'} %</span>
          </div>
          <div className="vital-item">
            <Thermometer size={14} className="icon-orange" />
            <span>Temp: {patient?.vitals?.temp || '98.6'} °F</span>
          </div>
        </div>
      </section>

      <div className="divider-line thin"></div>

      <main className="pdf-medical-content">
        {hasDiagnosis && (
          <section className="pdf-section">
            <div className="section-header">
              <div className="section-symbol">Rx</div>
              <h3>Clinical History & Diagnosis</h3>
            </div>
            <div className="section-body">
              {clinicalData?.diagnosisText && (
                <div className="typed-content">{clinicalData.diagnosisText}</div>
              )}
              {clinicalData?.diagnosisCanvas && (
                <div className="canvas-content">
                  <img src={clinicalData.diagnosisCanvas} alt="Handwritten Diagnosis" className="handwriting-img" />
                </div>
              )}
            </div>
          </section>
        )}

        {(hasMedications || hasMedicineCanvas) && (
          <section className="pdf-section">
            <div className="section-header">
              <div className="section-symbol">Rx</div>
              <h3>Medication Order</h3>
            </div>
            <div className="section-body">
              {hasMedications && (
                <table className="med-table">
                  <thead>
                    <tr>
                      <th>Medication Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med, i) => (
                      <tr key={i}>
                        <td className="font-bold">{med.name}</td>
                        <td>{med.dosage || med.dose || '—'}</td>
                        <td>{med.freq || '1-0-1'}</td>
                        <td>{med.days || med.duration ? `${med.days || med.duration} Days` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {clinicalData?.medicineCanvas && (
                <div className="canvas-content">
                  <img src={clinicalData.medicineCanvas} alt="Handwritten Medications" className="handwriting-img" />
                </div>
              )}
            </div>
          </section>
        )}

        {(hasInvestigations || hasInvestigationCanvas) && (
          <section className="pdf-section">
            <div className="section-header">
              <div className="section-symbol">Lab</div>
              <h3>Investigation Advice</h3>
            </div>
            <div className="section-body">
              {hasInvestigations && (
                <ul className="investigation-list">
                  {investigations.map((inv, i) => <li key={i}>{inv}</li>)}
                </ul>
              )}
              {clinicalData?.investigationCanvas && (
                <div className="canvas-content">
                  <img src={clinicalData.investigationCanvas} alt="Handwritten Investigations" className="handwriting-img" />
                </div>
              )}
            </div>
          </section>
        )}

        {hasAdvice && (
          <section className="pdf-section">
            <div className="section-header">
              <div className="section-symbol">Adv</div>
              <h3>General Advice</h3>
            </div>
            <div className="section-body">
              <div className="advice-box">
                <p style={{ whiteSpace: 'pre-line' }}>{generalAdvice || clinicalData?.notesText}</p>
              </div>
            </div>
          </section>
        )}

        <section className="pdf-section">
          <div className="section-header">
            <div className="section-symbol">FU</div>
            <h3>Follow-up Advice</h3>
          </div>
          <div className="section-body">
            <div className="advice-box">
              <p>{followUp || 'Review as advised.'}</p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="pdf-footer">
        <div className="footer-left">
          <p className="footer-disclaimer">This is a digitally generated prescription under the National Digital Health Mission.</p>
          <p className="footer-date">Generated on: {today}</p>
        </div>
        <div className="footer-right">
          <div className="signature-area">
             <div className="signature-line"></div>
             <p className="sig-label">Authorized Signature</p>
             <p className="sig-name">Dr. {doctor?.name || 'A. Sharma'}</p>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .prescription-pdf-container {
          width: 100%;
          max-width: 196mm;
          min-height: auto;
          padding: 0;
          background: white;
          color: #1e293b;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          margin: 0 auto;
          box-sizing: border-box;
          display: block;
        }

        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 4mm;
          margin-bottom: 2.5mm;
        }

        .hospital-branding {
          display: flex;
          gap: 3mm;
          align-items: center;
        }

        .logo-placeholder {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hospital-names h1 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
          color: #2563eb;
          line-height: 1.15;
        }

        .sub-branding {
          margin: 0;
          font-size: 7.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hospital-address {
          margin: 1px 0 0;
          font-size: 9px;
          color: #94a3b8;
          font-weight: 600;
        }

        .doctor-info-box {
          text-align: right;
          flex-shrink: 0;
        }

        .doctor-name {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.2;
        }

        .doctor-dept {
          margin: 1px 0;
          font-size: 10px;
          font-weight: 700;
          color: #3b82f6;
        }

        .doctor-reg {
          margin: 0;
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
        }

        .divider-line {
          height: 2px;
          width: 100%;
          margin: 2mm 0;
        }

        .divider-line.primary { background: #2563eb; }
        .divider-line.thin { height: 1px; background: #e2e8f0; margin: 2.5mm 0; }

        .patient-info-panel {
          background: #f8fafc;
          padding: 3mm 3.5mm;
          border-radius: 3mm;
          margin-bottom: 2.5mm;
          border: 1px solid #f1f5f9;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          margin-bottom: 2mm;
        }

        .info-col p {
          margin: 0.8mm 0;
          font-size: 10px;
          line-height: 1.35;
        }

        .label {
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          font-size: 8px;
          margin-right: 1.5mm;
        }

        .val {
          font-weight: 700;
          color: #1e293b;
        }

        .pdf-vitals-strip {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2mm;
          background: white;
          padding: 2mm 2.5mm;
          border-radius: 2mm;
          border: 1px solid #e2e8f0;
        }

        .vital-item {
          display: flex;
          align-items: center;
          gap: 1.5mm;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .icon-red { color: #ef4444; }
        .icon-blue { color: #3b82f6; }
        .icon-teal { color: #14b8a6; }
        .icon-orange { color: #f59e0b; }

        .pdf-section {
          margin-bottom: 3mm;
        }

        .pdf-section:last-child {
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 2mm;
          margin-bottom: 1.5mm;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1mm;
        }

        .section-symbol {
          width: 6mm;
          height: 6mm;
          background: #3b82f6;
          color: white;
          border-radius: 1.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .section-header h3 {
          margin: 0;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #1e293b;
        }

        .section-body {
          padding-left: 0;
          font-size: 10px;
          color: #334155;
          line-height: 1.45;
        }

        .canvas-content {
          margin-top: 1.5mm;
        }

        .handwriting-img {
          max-width: 100%;
          max-height: 42mm;
          width: auto;
          height: auto;
          object-fit: contain;
          border: 1px solid #e2e8f0;
          border-radius: 1.5mm;
          display: block;
        }

        .med-table {
          width: 100%;
          border-collapse: collapse;
        }

        .med-table th {
          text-align: left;
          background: #f1f5f9;
          padding: 1.5mm 2mm;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
        }

        .med-table td {
          padding: 1.5mm 2mm;
          border-bottom: 1px solid #f1f5f9;
          font-size: 10px;
        }

        .investigation-list {
          padding-left: 4mm;
          margin: 0;
        }

        .investigation-list li {
          margin-bottom: 0.5mm;
          font-weight: 700;
        }

        .advice-box {
          font-style: italic;
          background: #f8fafc;
          padding: 2mm 2.5mm;
          border-left: 2px solid #3b82f6;
        }

        .advice-box p {
          margin: 0;
        }

        .pdf-footer {
          margin-top: 4mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 4mm;
          padding-top: 3mm;
          border-top: 1px solid #e2e8f0;
        }

        .footer-disclaimer {
          font-size: 8.5px;
          color: #64748b;
          margin: 0 0 1px;
          font-weight: 500;
          max-width: 115mm;
          line-height: 1.35;
        }

        .footer-date {
          font-size: 8.5px;
          color: #94a3b8;
          margin: 0;
          font-weight: 600;
        }

        .signature-area {
          text-align: center;
          min-width: 42mm;
          flex-shrink: 0;
        }

        .signature-line {
          height: 1px;
          background: #1e293b;
          margin-bottom: 1mm;
        }

        .sig-label {
          font-size: 8px;
          font-weight: 800;
          color: #64748b;
          margin: 0;
        }

        .sig-name {
          font-size: 10px;
          font-weight: 900;
          margin: 0.5mm 0 0;
        }

        .typed-content {
          white-space: pre-line;
          margin: 0;
        }
      `}} />
    </div>
  );
});

export default PrescriptionPDF;
