import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import ReferralPanel from '../../../../components/clinical/ReferralPanel';
import EmrWorkspaceHeader from './EmrWorkspaceHeader';
import EmrWorkspacePages from './EmrWorkspacePages';
import EmrWorkspaceEditor from './EmrWorkspaceEditor';
import EmrWorkspaceCanvas from './EmrWorkspaceCanvas';
import VoiceMessageBubble from '../../../../components/clinical/VoiceMessageBubble';
import VoiceMessageRecorder from '../../../../components/clinical/VoiceMessageRecorder';
import './emr-workspace.css';

export default function EmrWorkspaceModal({
  open,
  modalRef,
  patient,
  workspace,
  referral,
  voice,
  voiceNotes = [],
  user,
  isDoctorRole,
  waitingCount,
  onSeeNextPatient,
}) {
  if (!open) return null;

  const {
    activeActionTab,
    setActiveActionTab,
    setCurrentPageIdx,
    pages,
    currentPageIdx,
    addPage,
    gridVisible,
    setGridVisible,
    gridSpacing,
    setGridSpacing,
    a4Zoom,
    setA4Zoom,
    structuredMeds,
    setStructuredMeds,
    updatePageData,
    updatePageTyped,
    isWorkspaceFullscreen,
    toggleWorkspaceFullscreen,
    closeWorkspace,
    handleSaveSession,
    handlePrint,
  } = workspace;

  const isReferral = activeActionTab === 'Referral';
  const showCanvas = activeActionTab === 'Medicine';
  const currentPage = pages[activeActionTab]?.[currentPageIdx];

  return (
    <motion.div
      className="action-pad-modal emr-ws-root"
      ref={modalRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="emr-ws-shell">
        <EmrWorkspaceHeader
          patient={patient}
          activeTab={activeActionTab}
          onTabChange={(id) => {
            setActiveActionTab(id);
            setCurrentPageIdx(0);
          }}
          onSave={handleSaveSession}
          onPrint={handlePrint}
          onClose={closeWorkspace}
          onToggleFullscreen={toggleWorkspaceFullscreen}
          isFullscreen={isWorkspaceFullscreen}
          onSeeNext={isDoctorRole ? onSeeNextPatient : undefined}
          waitingCount={waitingCount}
        />

        {/* WhatsApp Voice Notes dashboard strip */}
        {patient?.tokenNumber?.startsWith('APT-') && (
          <div className="emr-ws-voice-strip non-printable flex flex-wrap gap-4 items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[10px] font-black text-[#128C7E] flex items-center gap-1.5 uppercase tracking-wider">
                <Mic size={12} className="text-[#25D366] animate-pulse" />
                WhatsApp Voice Instructions
              </h4>
              <p className="text-[9px] text-slate-500 font-bold">
                Record spoken prescriptions. The patient will see active audio waveforms!
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Live WhatsApp visual waveform recorder */}
              <VoiceMessageRecorder
                isRecording={voice.isRecording}
                onToggle={voice.toggleRecording}
              />

              {/* Scrollable list of recent voice notes in this consultation */}
              {voiceNotes.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-[450px] py-0.5 border-l border-slate-350 pl-3">
                  {voiceNotes.slice(0, 3).map((note) => (
                    <VoiceMessageBubble
                      key={note.id || note.url}
                      noteUrl={note.url}
                      timestamp={note.timestamp}
                      senderName={user?.name || 'Dr. Attending'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`emr-ws-body${isReferral ? ' is-referral' : ''}${!isReferral && !showCanvas ? ' no-canvas' : ''}`}>
          {isReferral ? (
            <div className="emr-ws-referral-wrap">
              <ReferralPanel
                handleReferral={referral.handleReferral}
                submitting={referral.actionLoading}
              />
            </div>
          ) : (
            <>
              <EmrWorkspacePages
                pages={pages}
                activeTab={activeActionTab}
                currentPageIdx={currentPageIdx}
                onSelectPage={setCurrentPageIdx}
                onAddPage={addPage}
              />
              <EmrWorkspaceEditor
                activeTab={activeActionTab}
                currentPageIdx={currentPageIdx}
                pages={pages}
                onUpdateTyped={updatePageTyped}
                structuredMeds={structuredMeds}
                setStructuredMeds={setStructuredMeds}
              />
              {showCanvas && (
                <EmrWorkspaceCanvas
                  activeTab={activeActionTab}
                  currentPageIdx={currentPageIdx}
                  pageContent={currentPage?.content}
                  onSave={updatePageData}
                  gridVisible={gridVisible}
                  setGridVisible={setGridVisible}
                  gridSpacing={gridSpacing}
                  setGridSpacing={setGridSpacing}
                  a4Zoom={a4Zoom}
                  setA4Zoom={setA4Zoom}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
