import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import PrescriptionPDF from '../../../../components/clinical/PrescriptionPDF';
import './emr-prescription-preview.css';

export default function EmrPrescriptionPreviewModal({
  open,
  onClose,
  onPrint,
  onDownload,
  isBusy = false,
  pdfData,
}) {
  if (!open) return null;

  return (
    <div className="emr-rx-preview-overlay" onClick={onClose} role="presentation">
      <div
        className="emr-rx-preview-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Prescription preview"
      >
        <header className="emr-rx-preview-header">
          <div>
            <h3>Prescription Preview</h3>
            <p>Review your prescription, then print or download a PDF to your computer.</p>
          </div>
          <div className="emr-rx-preview-actions">
            <button
              type="button"
              className="emr-rx-preview-btn emr-rx-preview-btn-secondary"
              onClick={onDownload}
              disabled={isBusy}
            >
              <Download size={16} />
              {isBusy ? 'Preparing…' : 'Download PDF'}
            </button>
            <button
              type="button"
              className="emr-rx-preview-btn"
              onClick={onPrint}
              disabled={isBusy}
            >
              <Printer size={16} />
              {isBusy ? 'Preparing…' : 'Print'}
            </button>
            <button type="button" className="emr-rx-preview-close" onClick={onClose} aria-label="Close preview">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="emr-rx-preview-body">
          <div className="emr-rx-preview-paper">
            <PrescriptionPDF {...pdfData} />
          </div>
        </div>

        <footer className="emr-rx-preview-footer">
          <strong>Print:</strong> opens the system print dialog — choose your printer or <em>Save as PDF</em>.
          {' '}
          <strong>Download PDF:</strong> saves an A4 PDF file directly to your Downloads folder.
        </footer>
      </div>
    </div>
  );
}
