import React from 'react';
import { X, Printer } from 'lucide-react';
import PrescriptionPDF from '../../../../components/clinical/PrescriptionPDF';
import './emr-prescription-preview.css';

export default function EmrPrescriptionPreviewModal({
  open,
  onClose,
  onPrint,
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
            <p>Review before printing — this is what will appear on the printed page.</p>
          </div>
          <div className="emr-rx-preview-actions">
            <button type="button" className="emr-rx-preview-btn" onClick={onPrint}>
              <Printer size={16} />
              Print prescription
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
      </div>
    </div>
  );
}
