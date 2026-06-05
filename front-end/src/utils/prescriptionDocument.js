const PRESCRIPTION_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #1e293b;
    font-family: 'Segoe UI', Inter, system-ui, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .prescription-pdf-container {
    width: 210mm;
    min-height: 277mm;
    padding: 16mm;
    background: white;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }
  .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
  .hospital-branding { display: flex; gap: 5mm; align-items: center; }
  .logo-placeholder {
    width: 44px; height: 44px; border-radius: 10px; background: #eff6ff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; color: #2563eb; font-size: 18px;
  }
  .hospital-names h1 { margin: 0; font-size: 22px; font-weight: 900; color: #2563eb; }
  .sub-branding { margin: 0; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
  .hospital-address { margin: 2px 0 0; font-size: 10px; color: #94a3b8; font-weight: 600; }
  .doctor-info-box { text-align: right; }
  .doctor-name { margin: 0; font-size: 15px; font-weight: 800; }
  .doctor-dept { margin: 2px 0; font-size: 11px; font-weight: 700; color: #3b82f6; }
  .doctor-reg { margin: 0; font-size: 10px; color: #64748b; font-weight: 600; }
  .divider-line { height: 3px; width: 100%; margin: 4mm 0; }
  .divider-line.primary { background: #2563eb; }
  .divider-line.thin { height: 1px; background: #e2e8f0; }
  .patient-info-panel { background: #f8fafc; padding: 5mm; border-radius: 4mm; margin-bottom: 5mm; border: 1px solid #f1f5f9; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-bottom: 4mm; }
  .info-col p { margin: 1.5mm 0; font-size: 11px; line-height: 1.4; }
  .label { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 9px; margin-right: 2mm; }
  .val { font-weight: 700; color: #1e293b; }
  .pdf-vitals-strip {
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 3mm;
    background: #fff; padding: 3mm; border-radius: 2mm; border: 1px solid #e2e8f0;
  }
  .vital-item { font-size: 10px; font-weight: 800; }
  .pdf-section { margin-bottom: 7mm; page-break-inside: avoid; }
  .section-header {
    display: flex; align-items: center; gap: 3mm; margin-bottom: 3mm;
    border-bottom: 1px solid #f1f5f9; padding-bottom: 2mm;
  }
  .section-symbol {
    width: 8mm; height: 8mm; background: #3b82f6; color: #fff; border-radius: 2mm;
    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
  }
  .section-header h3 {
    margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4px;
  }
  .section-body { padding-left: 11mm; font-size: 11px; color: #334155; line-height: 1.6; }
  .handwriting-img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 2mm; display: block; }
  .med-table { width: 100%; border-collapse: collapse; }
  .med-table th {
    text-align: left; background: #f1f5f9; padding: 2.5mm; font-size: 9px;
    font-weight: 800; text-transform: uppercase; color: #64748b;
  }
  .med-table td { padding: 2.5mm; border-bottom: 1px solid #f1f5f9; }
  .font-bold { font-weight: 800; }
  .investigation-list { padding-left: 5mm; margin: 0; }
  .investigation-list li { margin-bottom: 1mm; font-weight: 700; }
  .advice-box { font-style: italic; background: #f8fafc; padding: 3mm; border-left: 3px solid #3b82f6; }
  .pdf-footer {
    margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end;
    padding-top: 8mm; border-top: 1px solid #e2e8f0;
  }
  .footer-disclaimer { font-size: 10px; color: #64748b; margin: 0 0 2px; max-width: 120mm; }
  .footer-date { font-size: 10px; color: #94a3b8; margin: 0; font-weight: 600; }
  .signature-area { text-align: center; min-width: 50mm; }
  .signature-line { height: 1px; background: #1e293b; margin-bottom: 2mm; }
  .sig-label { font-size: 9px; font-weight: 800; color: #64748b; margin: 0; }
  .sig-name { font-size: 12px; font-weight: 900; margin: 1mm 0 0; }
  .empty-val { color: #cbd5e1; font-style: italic; }
  .typed-content { white-space: pre-line; }
  @media print {
    .prescription-pdf-container { margin: 0; padding: 12mm; width: auto; min-height: auto; }
  }
`;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFilename(name) {
  return String(name || 'Prescription')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildMedicationRows(medications) {
  if (!medications?.length) return '';
  return medications
    .map(
      (med) => `
      <tr>
        <td class="font-bold">${escapeHtml(med.name)}</td>
        <td>${escapeHtml(med.dosage || med.dose || '—')}</td>
        <td>${escapeHtml(med.freq || '1-0-1')}</td>
        <td>${med.days || med.duration ? `${escapeHtml(med.days || med.duration)} Days` : '—'}</td>
      </tr>`
    )
    .join('');
}

function buildInvestigationList(investigations) {
  if (!investigations?.length) {
    return '<p class="empty-val">No clinical investigations advised.</p>';
  }
  return `<ul class="investigation-list">${investigations
    .map((inv) => `<li>${escapeHtml(inv)}</li>`)
    .join('')}</ul>`;
}

function imgTag(src, alt) {
  if (!src) return '';
  return `<div class="canvas-content"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="handwriting-img" /></div>`;
}

export function buildPrescriptionDocumentHtml(pdfData, documentTitle = 'Prescription') {
  const {
    patient = {},
    doctor = {},
    clinicalData = {},
    medications = [],
    investigations = [],
    followUp,
    generalAdvice,
  } = pdfData || {};

  const today = formatToday();
  const title = escapeHtml(documentTitle);

  const diagnosisBlock = clinicalData.diagnosisText
    ? `<div class="typed-content">${escapeHtml(clinicalData.diagnosisText)}</div>`
    : clinicalData.diagnosisCanvas
      ? imgTag(clinicalData.diagnosisCanvas, 'Handwritten Diagnosis')
      : '<p class="empty-val">No specific history recorded.</p>';

  const medsBlock =
    medications.length > 0
      ? `<table class="med-table">
          <thead><tr><th>Medication Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
          <tbody>${buildMedicationRows(medications)}</tbody>
        </table>`
      : !clinicalData.medicineCanvas
        ? '<p class="empty-val">No medications prescribed.</p>'
        : '';

  const adviceBlock =
    generalAdvice || clinicalData.notesText
      ? `<section class="pdf-section">
          <div class="section-header"><div class="section-symbol">📝</div><h3>General Advice</h3></div>
          <div class="section-body"><div class="advice-box"><p style="white-space:pre-line">${escapeHtml(generalAdvice || clinicalData.notesText)}</p></div></div>
        </section>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${PRESCRIPTION_STYLES}</style>
</head>
<body>
  <div class="prescription-pdf-container" id="prescription-print-root">
    <header class="pdf-header">
      <div class="hospital-branding">
        <div class="logo-placeholder">+</div>
        <div class="hospital-names">
          <h1>BHARAT HEALTH BRIDGE</h1>
          <p class="sub-branding">National Digital Health Mission Compliant</p>
          <p class="hospital-address">Smart Healthcare Hub, Sector 44, Gurugram, Haryana</p>
        </div>
      </div>
      <div class="doctor-info-box">
        <h2 class="doctor-name">Dr. ${escapeHtml(doctor.name || 'Attending Physician')}</h2>
        <p class="doctor-dept">${escapeHtml(doctor.department || 'Department of General Medicine')}</p>
        <p class="doctor-reg">MCI Reg No: ${escapeHtml(doctor.registrationId || 'MCI/DEL/9942/2026')}</p>
      </div>
    </header>
    <div class="divider-line primary"></div>
    <section class="patient-info-panel">
      <div class="info-grid">
        <div class="info-col">
          <p><span class="label">Patient Name:</span> <span class="val">${escapeHtml(patient.name || '—')}</span></p>
          <p><span class="label">UHID / MRN:</span> <span class="val">${escapeHtml(patient.mrn || patient.uhid || '—')}</span></p>
          <p><span class="label">Address:</span> <span class="val">${escapeHtml(patient.address || 'N/A')}</span></p>
        </div>
        <div class="info-col">
          <p><span class="label">Date:</span> <span class="val">${today}</span></p>
          <p><span class="label">Age / Sex:</span> <span class="val">${escapeHtml(patient.age ?? '—')}Y / ${escapeHtml(patient.gender || '—')}</span></p>
        </div>
      </div>
      <div class="pdf-vitals-strip">
        <div class="vital-item">BP: ${escapeHtml(patient.vitals?.bp || '120/80')} mmHg</div>
        <div class="vital-item">Pulse: ${escapeHtml(patient.vitals?.hr || patient.vitals?.heartRate || '72')} bpm</div>
        <div class="vital-item">SpO2: ${escapeHtml(patient.vitals?.spo2 || '98')} %</div>
        <div class="vital-item">Temp: ${escapeHtml(patient.vitals?.temp || '98.6')} °F</div>
      </div>
    </section>
    <div class="divider-line thin"></div>
    <main class="pdf-medical-content">
      <section class="pdf-section">
        <div class="section-header"><div class="section-symbol">Rx</div><h3>Clinical History &amp; Diagnosis</h3></div>
        <div class="section-body">${diagnosisBlock}</div>
      </section>
      <section class="pdf-section">
        <div class="section-header"><div class="section-symbol">Rx</div><h3>Medication Order</h3></div>
        <div class="section-body">${medsBlock}${imgTag(clinicalData.medicineCanvas, 'Handwritten Medications')}</div>
      </section>
      <section class="pdf-section">
        <div class="section-header"><div class="section-symbol">Lab</div><h3>Investigation Advice</h3></div>
        <div class="section-body">${buildInvestigationList(investigations)}${imgTag(clinicalData.investigationCanvas, 'Handwritten Investigations')}</div>
      </section>
      ${adviceBlock}
      <section class="pdf-section">
        <div class="section-header"><div class="section-symbol">FU</div><h3>Follow-up Advice</h3></div>
        <div class="section-body"><div class="advice-box"><p>${escapeHtml(followUp || 'Review as advised.')}</p></div></div>
      </section>
    </main>
    <footer class="pdf-footer">
      <div class="footer-left">
        <p class="footer-disclaimer">This is a digitally generated prescription under the National Digital Health Mission.</p>
        <p class="footer-date">Generated on: ${today}</p>
      </div>
      <div class="footer-right">
        <div class="signature-area">
          <div class="signature-line"></div>
          <p class="sig-label">Authorized Signature</p>
          <p class="sig-name">Dr. ${escapeHtml(doctor.name || 'Attending Physician')}</p>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function waitForDocumentImages(doc, timeoutMs = 12000) {
  const images = Array.from(doc.images || []);
  if (!images.length) return Promise.resolve();

  return new Promise((resolve) => {
    let pending = images.length;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);

    images.forEach((img) => {
      if (img.complete) {
        pending -= 1;
        if (pending <= 0) {
          clearTimeout(timer);
          finish();
        }
        return;
      }
      const done = () => {
        pending -= 1;
        if (pending <= 0) {
          clearTimeout(timer);
          finish();
        }
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  });
}

function openPrintableWindow(html) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
  if (!printWindow) return null;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return printWindow;
}

export async function printPrescriptionDocument(pdfData, documentTitle = 'Prescription') {
  const html = buildPrescriptionDocumentHtml(pdfData, documentTitle);
  const printWindow = openPrintableWindow(html);

  if (!printWindow) {
    return printPrescriptionViaIframe(html);
  }

  await waitForDocumentImages(printWindow.document);
  printWindow.focus();
  printWindow.print();
  return { mode: 'window' };
}

function printPrescriptionViaIframe(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Prescription print');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      reject(new Error('Unable to prepare print frame.'));
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    waitForDocumentImages(doc)
      .then(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1500);
        resolve({ mode: 'iframe' });
      })
      .catch((err) => {
        iframe.remove();
        reject(err);
      });
  });
}

export async function downloadPrescriptionPdf(pdfData, documentTitle = 'Prescription') {
  const filename = `${sanitizeFilename(documentTitle)}.pdf`;
  const html = buildPrescriptionDocumentHtml(pdfData, documentTitle);

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1;overflow:hidden';
  host.innerHTML = `<style>${PRESCRIPTION_STYLES}</style>${html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html}`;
  document.body.appendChild(host);

  const root = host.querySelector('.prescription-pdf-container') || host;
  await waitForDocumentImages(document);

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(root)
      .save();
  } finally {
    host.remove();
  }

  return { filename };
}

export function getPrescriptionDocumentTitle(patientName) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `Prescription_${sanitizeFilename(patientName || 'Patient')}_${stamp}`;
}
