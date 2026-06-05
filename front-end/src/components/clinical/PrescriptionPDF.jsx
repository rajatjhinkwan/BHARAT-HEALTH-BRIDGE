import React, { forwardRef } from 'react';
import { Shield, CheckCircle, Activity, Heart, Thermometer, Droplets } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PrescriptionPDF = forwardRef(({ patient, doctor, clinicalData, medications, investigations, followUp, generalAdvice, blockchainHash }, ref) => {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div ref={ref} className="prescription-pdf-container">
      {/* HEADER SECTION */}
      <header className="pdf-header">
        <div className="hospital-branding">
          <div className="logo-placeholder">
             <Activity size={40} color="#3b82f6" />
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

      {/* MEDICAL CONTENT SECTION */}
      <main className="pdf-medical-content">
        
        {/* 1. CLINICAL HISTORY & DIAGNOSIS */}
        <section className="pdf-section">
          <div className="section-header">
            <div className="section-symbol">Rx</div>
            <h3>Clinical History & Diagnosis</h3>
          </div>
          <div className="section-body">
            {clinicalData?.diagnosisText && (
              <div className="typed-content mb-4">{clinicalData.diagnosisText}</div>
            )}
            {clinicalData?.diagnosisCanvas && (
              <div className="canvas-content">
                <img src={clinicalData.diagnosisCanvas} alt="Handwritten Diagnosis" className="handwriting-img" />
              </div>
            )}
            {!clinicalData?.diagnosisText && !clinicalData?.diagnosisCanvas && (
               <p className="empty-val">No specific history recorded.</p>
            )}
          </div>
        </section>

        {/* 2. MEDICATION ORDER */}
        <section className="pdf-section">
          <div className="section-header">
            <div className="section-symbol">💊</div>
            <h3>Medication Order</h3>
          </div>
          <div className="section-body">
            {medications && medications.length > 0 ? (
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
            ) : !clinicalData?.medicineCanvas ? (
              <p className="empty-val">No medications prescribed.</p>
            ) : null}
            {clinicalData?.medicineCanvas && (
               <div className="canvas-content mt-4">
                 <img src={clinicalData.medicineCanvas} alt="Handwritten Medications" className="handwriting-img" />
               </div>
            )}
          </div>
        </section>

        {/* 3. INVESTIGATION ADVICE */}
        <section className="pdf-section">
          <div className="section-header">
            <div className="section-symbol">🔬</div>
            <h3>Investigation Advice</h3>
          </div>
          <div className="section-body">
            {investigations && investigations.length > 0 ? (
               <ul className="investigation-list">
                 {investigations.map((inv, i) => <li key={i}>{inv}</li>)}
               </ul>
            ) : (
               <p className="empty-val">No clinical investigations advised.</p>
            )}
            {clinicalData?.investigationCanvas && (
               <div className="canvas-content mt-4">
                 <img src={clinicalData.investigationCanvas} alt="Handwritten Investigations" className="handwriting-img" />
               </div>
            )}
          </div>
        </section>

        {/* 4. GENERAL ADVICE */}
        {(generalAdvice || clinicalData?.notesText) && (
          <section className="pdf-section">
            <div className="section-header">
              <div className="section-symbol">📝</div>
              <h3>General Advice</h3>
            </div>
            <div className="section-body">
              <div className="advice-box">
                <p style={{ whiteSpace: 'pre-line' }}>{generalAdvice || clinicalData?.notesText}</p>
              </div>
            </div>
          </section>
        )}

        {/* 5. FOLLOW-UP ADVICE */}
        <section className="pdf-section">
          <div className="section-header">
            <div className="section-symbol">📅</div>
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
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          background: white;
          color: #1e293b;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          margin: 0 auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5mm;
        }

        .hospital-branding {
          display: flex;
          gap: 5mm;
          align-items: center;
        }

        .hospital-names h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: #2563eb;
          letter-spacing: -0.5px;
        }

        .sub-branding {
          margin: 0;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .hospital-address {
          margin: 2px 0 0 0;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
        }

        .doctor-info-box {
          text-align: right;
        }

        .doctor-name {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
        }

        .doctor-dept {
          margin: 2px 0;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
        }

        .doctor-reg {
          margin: 0;
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
        }

        .divider-line {
          height: 3px;
          width: 100%;
          margin: 5mm 0;
        }

        .divider-line.primary { background: #2563eb; }
        .divider-line.thin { height: 1px; background: #e2e8f0; }

        .patient-info-panel {
          background: #f8fafc;
          padding: 5mm;
          border-radius: 4mm;
          margin-bottom: 5mm;
          border: 1px solid #f1f5f9;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10mm;
          margin-bottom: 4mm;
        }

        .info-col p {
          margin: 1.5mm 0;
          font-size: 11px;
          line-height: 1.4;
        }

        .label {
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          font-size: 9px;
          margin-right: 2mm;
        }

        .val {
          font-weight: 700;
          color: #1e293b;
        }

        .pdf-vitals-strip {
          display: flex;
          justify-content: space-between;
          background: white;
          padding: 3mm;
          border-radius: 2mm;
          border: 1px solid #e2e8f0;
        }

        .vital-item {
          display: flex;
          align-items: center;
          gap: 2mm;
          font-size: 10px;
          font-weight: 800;
        }

        .icon-red { color: #ef4444; }
        .icon-blue { color: #3b82f6; }
        .icon-teal { color: #14b8a6; }
        .icon-orange { color: #f59e0b; }

        .pdf-medical-content {
          flex: 1;
        }

        .pdf-section {
          margin-bottom: 8mm;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 3mm;
          margin-bottom: 4mm;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 2mm;
        }

        .section-symbol {
          width: 8mm;
          height: 8mm;
          background: #3b82f6;
          color: white;
          border-radius: 2mm;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
        }

        .section-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1e293b;
        }

        .section-body {
          padding-left: 11mm;
          font-size: 11px;
          color: #334155;
          line-height: 1.6;
        }

        .handwriting-img {
          max-width: 100%;
          height: auto;
          border: 1px solid #f1f5f9;
          border-radius: 2mm;
        }

        .med-table {
          width: 100%;
          border-collapse: collapse;
        }

        .med-table th {
          text-align: left;
          background: #f1f5f9;
          padding: 2.5mm;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
        }

        .med-table td {
          padding: 2.5mm;
          border-bottom: 1px solid #f1f5f9;
        }

        .investigation-list {
          padding-left: 5mm;
          margin: 0;
        }

        .investigation-list li {
          margin-bottom: 1mm;
          font-weight: 700;
        }

        .advice-box {
          font-style: italic;
          background: #f8fafc;
          padding: 3mm;
          border-left: 3px solid #3b82f6;
        }

        .pdf-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 10mm;
          border-top: 1px solid #e2e8f0;
        }

        .footer-disclaimer {
          font-size: 10px;
          color: #64748b;
          margin: 0 0 2px 0;
          font-weight: 500;
          max-width: 120mm;
        }

        .footer-date {
          font-size: 10px;
          color: #94a3b8;
          margin: 0;
          font-weight: 600;
        }

        .signature-area {
          text-align: center;
          min-width: 50mm;
        }

        .signature-line {
          height: 1px;
          background: #1e293b;
          margin-bottom: 2mm;
        }

        .sig-label {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          margin: 0;
        }

        .sig-name {
          font-size: 12px;
          font-weight: 900;
          margin: 1mm 0 0 0;
        }

        .empty-val {
          color: #cbd5e1;
          font-style: italic;
        }

        @media print {
          .prescription-pdf-container {
            margin: 0;
            padding: 15mm;
          }
        }
      `}} />
    </div>
  );
});

export default PrescriptionPDF;
