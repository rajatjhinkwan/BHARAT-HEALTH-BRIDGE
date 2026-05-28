import React from 'react';
import { Pill, FileText, TestTube, Edit3, Share2, Maximize2, UserPlus, Mic } from 'lucide-react';
import MedicineWriterPad from '../../../../components/clinical/MedicineWriterPad';
import VoiceMessageBubble from '../../../../components/clinical/VoiceMessageBubble';

const ACTION_ITEMS = [
  { tab: 'Medicine', label: 'Medicine', desc: 'Rx prescribe', icon: Pill },
  { tab: 'Diagnosis', label: 'Diagnosis', desc: 'ICD-10 code', icon: FileText },
  { tab: 'Blood Test', label: 'Laboratory', desc: 'Text/select order', icon: TestTube },
  { tab: 'Notes', label: 'Notes +', desc: 'Free text', icon: Edit3 },
  { tab: 'Referral', label: 'Referral', desc: 'Change dept', icon: Share2, isReferral: true },
];

export default function EmrRightPanel({
  user,
  isDoctorRole,
  waitingCount,
  hasClinicalPatient,
  onOpenWorkspace,
  onOpenReferral,
  onSeeNext,
  medicineWriter,
  voiceNotes,
}) {
  return (
    <>
      <div className="action-pad-card doctor-action-pad">
        <div className="pad-title-row">
          <div>
            <h3 className="pad-title">Doctor&apos;s Action Pad</h3>
            <p className="pad-subtitle">Session — {user?.name || 'Attending physician'}</p>
          </div>
          <button type="button" className="emr-icon-btn" aria-label="Open fullscreen workspace" onClick={() => onOpenWorkspace('Medicine')}>
            <Maximize2 size={18} />
          </button>
        </div>
        {isDoctorRole && (
          <button type="button" className="emr-see-next-inline" onClick={onSeeNext} disabled={waitingCount === 0}>
            <UserPlus size={16} />
            See next ({waitingCount})
          </button>
        )}
        <div className="pad-grid pad-grid-actions">
          {ACTION_ITEMS.map(({ tab, label, desc, icon: Icon, isReferral }) => (
            <button
              key={tab}
              type="button"
              className={`pad-btn${isReferral ? ' pad-btn-referral' : ''}`}
              onClick={() => (isReferral ? onOpenReferral() : onOpenWorkspace(tab))}
              disabled={isReferral && !hasClinicalPatient}
            >
              <div className="pad-btn-icon"><Icon size={18} /></div>
              <span className="pad-btn-label">{label}</span>
              <span className="pad-btn-desc">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <MedicineWriterPad {...medicineWriter} />

      {voiceNotes?.length > 0 && (
        <div className="voice-records-compact bg-white rounded-xl p-3 border border-slate-200 mt-4 shadow-sm">
          <h4 className="voice-records-title text-[10px] font-black text-[#128C7E] flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <Mic size={12} className="text-[#25D366]" />
            Voice Prescriptions
          </h4>
          <div className="flex flex-col gap-1">
            {voiceNotes.slice(0, 3).map((note) => (
              <VoiceMessageBubble
                key={note.id || note.url}
                noteUrl={note.url}
                timestamp={note.timestamp}
                senderName={user?.name || 'Dr. Attending'}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
