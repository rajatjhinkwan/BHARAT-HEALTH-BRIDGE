import React from 'react';
import { Edit3 } from 'lucide-react';
import PrescriptionPanel from '../../../../components/clinical/PrescriptionPanel';

const DIAGNOSIS_TEMPLATES = [
  'Hypertension',
  'Type 2 Diabetes Mellitus',
  'Viral Fever',
  'Acute Gastritis',
  'Upper Respiratory Tract Infection',
  'Migraine',
  'Lumbar Strain',
];

const LAB_TEMPLATES = [
  'CBC',
  'LFT',
  'KFT',
  'HbA1c',
  'Lipid Profile',
  'Thyroid Profile',
  'Urine Routine',
  'CRP',
];

export default function EmrWorkspaceEditor({
  activeTab,
  currentPageIdx,
  pages,
  onUpdateTyped,
  structuredMeds,
  setStructuredMeds,
}) {
  const page = pages[activeTab]?.[currentPageIdx];

  return (
    <section className="emr-ws-editor non-printable">
      <div className="emr-ws-editor-inner">
        {activeTab === 'Medicine' && (
          <PrescriptionPanel structuredMeds={structuredMeds} setStructuredMeds={setStructuredMeds} />
        )}
        {activeTab === 'Diagnosis' && (
          <div className="emr-clinical-notes">
            <h5 className="emr-notes-title">Diagnosis (Text Only)</h5>
            <select
              className="emr-input"
              value=""
              onChange={(e) =>
                onUpdateTyped(page?.typed ? `${page.typed}\n${e.target.value}` : e.target.value)
              }
            >
              <option value="">Add from quick diagnosis list…</option>
              {DIAGNOSIS_TEMPLATES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <textarea
              className="emr-textarea emr-ws-textarea"
              placeholder="Enter diagnosis details and clinical impression..."
              value={page?.typed || ''}
              onChange={(e) => onUpdateTyped(e.target.value)}
              rows={8}
            />
            <p className="emr-notes-hint">
              <Edit3 size={14} />
              Diagnosis must be typed text (no handwriting).
            </p>
          </div>
        )}
        {activeTab === 'Blood Test' && (
          <div className="emr-clinical-notes">
            <h5 className="emr-notes-title">Laboratory Orders (Text + Selection)</h5>
            <select
              className="emr-input"
              value=""
              onChange={(e) => {
                const next = page?.typed ? `${page.typed}\n${e.target.value}` : e.target.value;
                onUpdateTyped(next);
              }}
            >
              <option value="">Add test from list…</option>
              {LAB_TEMPLATES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <textarea
              className="emr-textarea emr-ws-textarea"
              placeholder="Type laboratory notes/tests (one per line)..."
              value={page?.typed || ''}
              onChange={(e) => onUpdateTyped(e.target.value)}
              rows={8}
            />
            <p className="emr-notes-hint">
              <Edit3 size={14} />
              Laboratory input is structured text/select only.
            </p>
          </div>
        )}
        {activeTab === 'Notes' && (
          <div className="emr-clinical-notes">
            <h5 className="emr-notes-title">{activeTab}</h5>
            <textarea
              className="emr-textarea emr-ws-textarea"
              placeholder={`Enter ${activeTab.toLowerCase()} details…`}
              value={page?.typed || ''}
              onChange={(e) => onUpdateTyped(e.target.value)}
              rows={8}
            />
            <p className="emr-notes-hint">
              <Edit3 size={14} />
              Type additional consultation notes.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
