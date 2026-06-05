import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getDoctorHeaders } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { normalizeDepartment } from '../../../utils/departments';
import { useLiveQueue } from '../../../hooks/useLiveQueue';
import EmrVitalsModal from '../../../components/clinical/EmrVitalsModal';
import EmrReferralModal from '../../../components/clinical/EmrReferralModal';
import { ServiceOrderModal, EmrToast } from '../../../components/clinical/EmrModals';
import EmrFollowUpModal from './components/EmrFollowUpModal';
import '../ElectronicMedicalRecord.css';
import './styles/emr-palette.css';

import { useEmrToast } from './hooks/useEmrToast';
import { useEmrPatient } from './hooks/useEmrPatient';
import { useEmrClinicalActions } from './hooks/useEmrClinicalActions';
import { useEmrWorkspace } from './hooks/useEmrWorkspace';
import { useEmrVoice } from './hooks/useEmrVoice';
import { EmrNoPatient, EmrLoading } from './components/EmrEmptyState';
import EmrLeftPanel from './components/EmrLeftPanel';
import EmrCenterPanel from './components/EmrCenterPanel';
import EmrRightPanel from './components/EmrRightPanel';
import EmrClinicalMovement from './components/EmrClinicalMovement';
import EmrDischargeModal from './components/EmrDischargeModal';
import EmrWorkspaceModal from './workspace/EmrWorkspaceModal';
import EmrPrescriptionPreviewModal from './workspace/EmrPrescriptionPreviewModal';

export default function ElectronicMedicalRecord() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast } = useEmrToast();
  const department = normalizeDepartment(user?.department || 'General Medicine');
  const { queueData } = useLiveQueue(department);
  const waitingCount = queueData.waiting?.length || 0;
  const isDoctorRole = ['DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'MEDICAL_DIRECTOR'].includes(
    (user?.role || '').toUpperCase()
  );

  const [activeTab, setActiveTab] = useState('Lab');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  const handleSeeNextPatient = async () => {
    const doctorId = user?._id || user?.id;
    if (!doctorId) {
      showToast('Session expired. Please log in again.', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/workflow/queue/call-next/${doctorId}`, {
        method: 'PATCH',
        headers: getDoctorHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        navigate('/emr', {
          state: {
            selectedPatient: {
              _id: data.patientId,
              patientName: data.patientName,
              queueId: data.queueId,
              tokenNumber: data.tokenNumber,
            },
          },
        });
        showToast(`Now seeing: ${data.patientName}`, 'success');
      } else {
        showToast(data.message || 'No patients waiting.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error', 'error');
    }
  };

  const patientApi = useEmrPatient({
    showToast,
    isDoctorRole,
    onSeeNextFromQueue: handleSeeNextPatient,
  });

  const workspace = useEmrWorkspace({
    patient: patientApi.patient,
    hasClinicalPatient: patientApi.hasClinicalPatient,
    user,
    department,
    showToast,
    fetchMedicalHistory: patientApi.fetchMedicalHistory,
    dischargeForm: { followUp: '' },
  });

  const clinical = useEmrClinicalActions({
    patient: patientApi.patient,
    hasClinicalPatient: patientApi.hasClinicalPatient,
    user,
    department,
    showToast,
    refreshPatient: patientApi.refreshPatient,
    fetchMedicalHistory: patientApi.fetchMedicalHistory,
    onReferralSuccess: () => workspace.closeWorkspace(),
    structuredMeds: workspace.structuredMeds,
  });

  const voice = useEmrVoice({
    patientId: patientApi.patient?._id,
    userName: user?.name,
    onHistoryRefresh: () => patientApi.fetchMedicalHistory(patientApi.patient?._id),
    showToast,
  });

  const voiceNotes = useMemo(
    () =>
      (patientApi.medicalHistory || [])
        .filter((r) => r.type === 'voice_note' && r.voiceNoteDetails?.audioUrl)
        .map((r) => ({
          id: r._id,
          url: r.voiceNoteDetails.audioUrl.startsWith('http')
            ? r.voiceNoteDetails.audioUrl
            : `${API_BASE_URL.replace('/api', '')}${r.voiceNoteDetails.audioUrl}`,
          timestamp: new Date(r.createdAt).toLocaleString(),
        })),
    [patientApi.medicalHistory]
  );

  const queuePatients = [...(queueData.inConsultation || []), ...(queueData.waiting || [])];
  const currentQueueIndex = queuePatients.findIndex(
    (q) => q.patientId === patientApi.patient?._id || q._id === patientApi.patient?._id
  );

  const canRecordVitals =
    patientApi.hasClinicalPatient &&
    ['NURSE', 'DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'MEDICAL_DIRECTOR'].includes(
      (user?.role || '').toUpperCase()
    );

  const vitalsTimestamp =
    patientApi.vitalsUpdatedAt ||
    (patientApi.patient?.vitalsRecordedAt ? new Date(patientApi.patient.vitalsRecordedAt).getTime() : null);
  const [vitalsMinutesAgo, setVitalsMinutesAgo] = useState(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (vitalsTimestamp) {
        setVitalsMinutesAgo(Math.max(1, Math.floor((Date.now() - vitalsTimestamp) / 60000)));
      } else {
        setVitalsMinutesAgo(null);
      }
    });
    return () => cancelAnimationFrame(handle);
  }, [vitalsTimestamp]);

  const medicineNotes =
    workspace.pages.Medicine?.[0]?.typed || workspace.pages.Notes?.[0]?.typed || '';

  if (!patientApi.patient && !patientApi.emergencyCase) {
    return <EmrNoPatient />;
  }

  if (patientApi.patientLoading && !patientApi.patient?.name) {
    return <EmrLoading />;
  }

  const { patient, emergencyCase } = patientApi;

  const { getPDFData } = workspace;

  return (
    <div className={`emr-container ${workspace.isZoomed ? 'zoom-active' : ''}`}>
      <main className="emr-main">
        <EmrLeftPanel
          patient={patient}
          user={user}
          canRecordVitals={canRecordVitals}
          vitalsMinutesAgo={vitalsMinutesAgo}
          onRecordVitals={() => setShowVitalsModal(true)}
          onImageUpload={patientApi.handleImageUpload}
          onPrevPatient={() => patientApi.navigateQueuePatient('prev', queuePatients)}
          onNextPatient={() => patientApi.navigateQueuePatient('next', queuePatients)}
          prevDisabled={currentQueueIndex <= 0 && queuePatients.length <= 1}
        />

        <EmrCenterPanel
          patient={patient}
          medicalHistory={patientApi.medicalHistory}
          historyLoading={patientApi.historyLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReportUpload={clinical.handleReportUpload}
        />

        <aside className="emr-col emr-col-right">
        <EmrClinicalMovement
          patient={patient}
          emergencyCase={emergencyCase}
          actionLoading={clinical.actionLoading}
          selectedWard={clinical.selectedWard}
          setSelectedWard={clinical.setSelectedWard}
          wardsList={clinical.wardsList}
          hasClinicalPatient={patientApi.hasClinicalPatient}
          onEmergencyStatus={(status) =>
            clinical.handleUpdateEmergencyStatus(status, emergencyCase, patientApi.setEmergencyCase)
          }
          onAdmit={() => clinical.handleAdmitToWard()}
          onQuickIcu={() => clinical.handleMovePatient('icu')}
          onQuickVent={() => clinical.handleMovePatient('ventilator')}
          onRefer={() => clinical.setShowReferralModal(true)}
          onFollowUp={() => clinical.setShowFollowUpModal(true)}
          onDischarge={() => clinical.handleMovePatient('discharge')}
          onServiceOrder={(type) => clinical.setServiceModal(type)}
        />

        <EmrRightPanel
          user={user}
          isDoctorRole={isDoctorRole}
          waitingCount={waitingCount}
          hasClinicalPatient={patientApi.hasClinicalPatient}
          onOpenWorkspace={workspace.openWorkspace}
          onOpenReferral={() => clinical.setShowReferralModal(true)}
          onSeeNext={handleSeeNextPatient}
          voiceNotes={voiceNotes}
          medicineWriter={{
            canvasData: workspace.pages.Medicine?.[0]?.content,
            onCanvasSave: (data, cropped, strokesJson) => {
              workspace.setPages((prev) => {
                const next = { ...prev };
                const cur = next.Medicine?.[0] || { content: null, contentCropped: null, strokes: null, typed: '' };
                next.Medicine = [{
                  ...cur,
                  content: data,
                  contentCropped: cropped || data,
                  strokes: strokesJson || null
                }];
                return next;
              });
            },
            notes: medicineNotes,
            onNotesChange: (text) => {
              workspace.setPages((prev) => {
                const next = { ...prev };
                const cur = next.Medicine?.[0] || { content: null, typed: '' };
                next.Medicine = [{ ...cur, typed: text }];
                return next;
              });
            },
            onVoiceToggle: voice.toggleRecording,
            isRecording: voice.isRecording,
            onFinalize: workspace.handleSaveSession,
            finalizeLoading: clinical.actionLoading,
            sessionDoctor: user?.name || 'Attending physician',
            showVoice: patient?.tokenNumber?.startsWith('APT-'),
          }}
        />
        </aside>
      </main>

      {showVitalsModal && (
        <EmrVitalsModal
          patient={patient}
          recordedBy={user?.name || user?.role}
          onClose={() => setShowVitalsModal(false)}
          onSaved={patientApi.handleVitalsSaved}
        />
      )}

      <EmrReferralModal
        open={clinical.showReferralModal}
        onClose={() => clinical.setShowReferralModal(false)}
        handleReferral={clinical.handleReferral}
        submitting={clinical.actionLoading}
      />

      <EmrDischargeModal
        open={clinical.showDischargeModal}
        onClose={() => clinical.setShowDischargeModal(false)}
        patient={patient}
        dischargeForm={clinical.dischargeForm}
        setDischargeForm={clinical.setDischargeForm}
        structuredMeds={workspace.structuredMeds}
        onConfirm={clinical.confirmDischarge}
        loading={clinical.actionLoading}
      />

      <AnimatePresence>
        {workspace.isZoomed && (
          <EmrWorkspaceModal
            open={workspace.isZoomed}
            modalRef={workspace.workspaceModalRef}
            contentRef={workspace.workspaceContentRef}
            patient={patient}
            workspace={workspace}
            referral={clinical}
            voice={voice}
            voiceNotes={voiceNotes}
            user={user}
            isDoctorRole={isDoctorRole}
            waitingCount={waitingCount}
            onSeeNextPatient={handleSeeNextPatient}
          />
        )}
      </AnimatePresence>

      <EmrPrescriptionPreviewModal
        open={workspace.showPrintPreview}
        onClose={workspace.closePrintPreview}
        onPrint={workspace.confirmPrint}
        onDownload={workspace.downloadPrescription}
        isBusy={workspace.isPrintBusy}
        pdfData={getPDFData()}
      />

      <ServiceOrderModal
        open={!!clinical.serviceModal}
        orderType={clinical.serviceModal}
        onClose={() => clinical.setServiceModal(null)}
        onConfirm={(data) => clinical.handleServiceOrder(clinical.serviceModal, data)}
        loading={clinical.actionLoading}
      />
    <EmrFollowUpModal
      open={clinical.showFollowUpModal}
      onClose={() => clinical.setShowFollowUpModal(false)}
      onConfirm={clinical.handleScheduleFollowUp}
      defaultDoctorId={clinical.doctorEmployeeId || user?.employeeId}
      department={department}
      loading={clinical.actionLoading}
    />
      <EmrToast message={toast.message} type={toast.type} />
    </div>
  );
}
