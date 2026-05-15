import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, ShieldCheck } from 'lucide-react';

export default function PatientQR({ patient, token }) {
  if (!patient) return null;

  const qrData = JSON.stringify({
    uhid: patient.mrn,
    name: patient.patientName,
    token: token || patient.currentToken
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient QR - ${patient.mrn}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 2px solid #000; padding: 2rem; text-align: center; border-radius: 20px; }
            h1 { margin: 0 0 1rem; font-size: 24px; }
            .qr { margin: 2rem 0; }
            .info { font-weight: bold; font-size: 18px; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>BHARAT HEALTH BRIDGE</h1>
            <div class="qr">${document.getElementById('patient-qr-code').innerHTML}</div>
            <div class="info">${patient.patientName}</div>
            <div class="info">UHID: ${patient.mrn}</div>
            <div class="info">TOKEN: ${token || '--'}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="patient-qr-card card p-8 text-center max-w-xs mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
         <ShieldCheck className="text-primary" size={20} />
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Clinical ID</span>
      </div>

      <div id="patient-qr-code" className="flex justify-center mb-6 p-4 bg-white rounded-2xl shadow-inner">
        <QRCodeSVG 
            value={qrData} 
            size={180} 
            level="H" 
            includeMargin={true}
            imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
            }}
        />
      </div>

      <h3 className="mb-1">{patient.patientName}</h3>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">UHID: {patient.mrn}</div>

      <div className="grid grid-cols-2 gap-4">
         <button onClick={handlePrint} className="btn-secondary text-[10px] py-2">
            <Printer size={14} /> PRINT ID
         </button>
         <button className="btn-primary text-[10px] py-2">
            <Download size={14} /> DOWNLOAD
         </button>
      </div>
    </div>
  );
}
