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
            <h5 className="emr-notes-title">Advice & Notes</h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.5px' }}>
                  General Advice & Recommendations
                </label>
                <textarea
                  className="emr-textarea emr-ws-textarea"
                  placeholder="Enter general medical advice, diet restrictions, rest, lifestyle suggestions..."
                  value={page?.generalAdvice || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const followUpVal = page?.followUpAdvice || '';
                    onUpdateTyped({
                      generalAdvice: val,
                      typed: `General Advice:\n${val}\n\nFollow-up Advice:\n${followUpVal}`
                    });
                  }}
                  rows={4}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.5px' }}>
                  Follow-up Advice
                </label>
                <textarea
                  className="emr-textarea emr-ws-textarea"
                  placeholder="Enter follow-up advice (e.g., 'Review with reports after 5 days' or 'SOS if symptoms persist')..."
                  value={page?.followUpAdvice || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const generalVal = page?.generalAdvice || '';
                    onUpdateTyped({
                      followUpAdvice: val,
                      typed: `General Advice:\n${generalVal}\n\nFollow-up Advice:\n${val}`
                    });
                  }}
                  rows={3}
                />
              </div>
            </div>

            <p className="emr-notes-hint" style={{ marginTop: '12px' }}>
              <Edit3 size={14} />
              Type general clinical advice and follow-up directives separately for clear printing.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
