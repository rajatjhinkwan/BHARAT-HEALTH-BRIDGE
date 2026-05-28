import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { apiJson, getDoctorHeaders } from '../../../../utils/api';
import { API_BASE_URL } from '../../../../config';
import { normalizeDepartment } from '../../../../utils/departments';

const INITIAL_PAGES = {
  Medicine: [{ content: null, typed: '' }],
  Diagnosis: [{ content: null, typed: '' }],
  'Blood Test': [{ content: null, typed: '' }],
  Notes: [{ content: null, typed: '' }],
};

export function useEmrWorkspace({
  patient,
  hasClinicalPatient,
  user,
  department,
  showToast,
  fetchMedicalHistory,
  onSessionClosed,
  structuredMeds,
  dischargeForm,
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('Medicine');
  const [pages, setPages] = useState(INITIAL_PAGES);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [gridVisible, setGridVisible] = useState(50);
  const [gridSpacing, setGridSpacing] = useState(25);
  const [a4Zoom, setA4Zoom] = useState(1);
  const [structuredMedsState, setStructuredMeds] = useState(structuredMeds || [{ name: '', dose: '', freq: 'TID', days: '' }]);

  const workspaceModalRef = useRef(null);
  const workspaceContentRef = useRef(null);
  const prescriptionRef = useRef();

  const exitWorkspaceFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  };

  const closeWorkspace = useCallback(async () => {
    await exitWorkspaceFullscreen();
    setIsZoomed(false);
  }, []);

  const enterWorkspaceFullscreen = async () => {
    const el = workspaceModalRef.current;
    if (!el?.requestFullscreen) return;
    try {
      await el.requestFullscreen();
    } catch {
      /* ignore */
    }
  };

  const toggleWorkspaceFullscreen = async () => {
    if (document.fullscreenElement) {
      await exitWorkspaceFullscreen();
      return;
    }
    await enterWorkspaceFullscreen();
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsWorkspaceFullscreen(document.fullscreenElement === workspaceModalRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey && isZoomed) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setA4Zoom((prev) => Math.min(Math.max(0.5, prev + delta), 3));
      }
    };
    const workspace = workspaceContentRef.current;
    if (workspace) {
      workspace.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (workspace) workspace.removeEventListener('wheel', handleWheel);
    };
  }, [isZoomed]);

  const getPDFData = useCallback(
    () => ({
      patient,
      doctor: {
        name: user?.name || 'Doctor',
        department: user?.department || 'General Medicine',
        registrationId: user?.registrationId || '',
      },
      clinicalData: {
        diagnosisText: pages.Diagnosis?.[0]?.typed || '',
        medicineCanvas: pages.Medicine?.[0]?.contentCropped || pages.Medicine?.[0]?.content || null,
        investigationText: pages['Blood Test']?.[0]?.typed || '',
        notesText: pages.Notes?.[0]?.typed || '',
      },
      medications: structuredMedsState.filter((m) => m.name),
      investigations: (pages['Blood Test']?.[0]?.typed || '').split('\n').filter((l) => l.trim()),
      followUp: pages.Notes?.[0]?.typed || dischargeForm?.followUp || 'Review as advised.',
      blockchainHash: null,
    }),
    [patient, user, pages, structuredMedsState, dischargeForm]
  );

  const handlePrint = useReactToPrint({
    contentRef: prescriptionRef,
    documentTitle: `EMR_Prescription_${patient?.name || 'Patient'}`,
  });

  const updatePageData = useCallback(
    (canvasData, croppedCanvasData, strokesJson) => {
      setPages((prev) => {
        const next = { ...prev };
        const current = next[activeActionTab][currentPageIdx] || { content: null, contentCropped: null, strokes: null, typed: '' };
        next[activeActionTab][currentPageIdx] = {
          ...current,
          content: canvasData,
          contentCropped: croppedCanvasData || canvasData,
          strokes: strokesJson || null
        };
        return next;
      });
    },
    [activeActionTab, currentPageIdx]
  );

  const updatePageTyped = useCallback(
    (text) => {
      setPages((prev) => {
        const next = { ...prev };
        const current = next[activeActionTab][currentPageIdx] || { content: null, typed: '' };
        next[activeActionTab][currentPageIdx] = { ...current, typed: text };
        return next;
      });
    },
    [activeActionTab, currentPageIdx]
  );

  const addPage = useCallback(() => {
    setPages((prev) => {
      const next = { ...prev };
      next[activeActionTab] = [...next[activeActionTab], { content: null, typed: '' }];
      return next;
    });
    setCurrentPageIdx(pages[activeActionTab].length);
  }, [activeActionTab, pages]);

  const openWorkspace = useCallback((tab = 'Medicine') => {
    setActiveActionTab(tab);
    setCurrentPageIdx(0);
    setIsZoomed(true);
  }, []);

  const handleSaveSession = useCallback(async () => {
    if (!hasClinicalPatient) {
      showToast('Select a patient before saving.', 'error');
      return;
    }
    try {
      const meds = structuredMedsState.filter((m) => m.name).map((m) => ({
        name: m.name,
        dosage: m.dose,
        duration: m.days,
      }));
      const diagnosisText =
        pages.Diagnosis?.[0]?.typed || '';
      const notesText =
        pages.Notes?.[0]?.typed || 'Consultation completed.';

      // Extract the handwritten canvas drawing from the Medicine Pad
      const medicineCanvas = pages.Medicine?.[0]?.contentCropped || pages.Medicine?.[0]?.content || null;
      const medicineStrokes = pages.Medicine?.[0]?.strokes || null;
      const prescriptionData = medicineStrokes || medicineCanvas;

      const pushPayload = {
        timeline: {
          action: 'CONSULTATION',
          department: normalizeDepartment(user?.department || department),
          performedBy: user?.name || 'Doctor',
          details: diagnosisText || 'Clinical session saved from EMR workspace.',
        },
        encounters: {
          notes: notesText,
          diagnosis: diagnosisText || 'General consultation',
          prescribedBy: user?.name || 'Doctor',
          doctorId: user?._id || user?.id,
          prescriptionCanvas: prescriptionData,
        },
      };
      if (meds.length) {
        pushPayload.prescriptions = {
          medications: meds,
          prescribedBy: user?.name || 'Doctor',
          diagnosis: diagnosisText,
          prescriptionCanvas: prescriptionData,
        };
      }

      await apiJson(`/clinical/patients/${patient._id}`, {
        method: 'PUT',
        body: JSON.stringify({ $push: pushPayload, currentStatus: 'RECOVERING' }),
      });

      if (patient.queueId) {
        try {
          await fetch(`${API_BASE_URL}/workflow/queue/complete/${patient.queueId}`, {
            method: 'PATCH',
            headers: getDoctorHeaders(),
          });
        } catch {
          /* optional */
        }
      }

      showToast('Clinical session saved to EMR.', 'success');
      await fetchMedicalHistory(patient._id);
      await closeWorkspace();
      onSessionClosed?.();
    } catch (err) {
      showToast(err.message || 'Failed to save session', 'error');
    }
  }, [
    hasClinicalPatient,
    structuredMedsState,
    pages,
    user,
    department,
    patient,
    showToast,
    fetchMedicalHistory,
    closeWorkspace,
    onSessionClosed,
  ]);

  return {
    isZoomed,
    setIsZoomed,
    isWorkspaceFullscreen,
    workspaceModalRef,
    workspaceContentRef,
    prescriptionRef,
    activeActionTab,
    setActiveActionTab,
    pages,
    setPages,
    currentPageIdx,
    setCurrentPageIdx,
    gridVisible,
    setGridVisible,
    gridSpacing,
    setGridSpacing,
    a4Zoom,
    setA4Zoom,
    structuredMeds: structuredMedsState,
    setStructuredMeds,
    closeWorkspace,
    toggleWorkspaceFullscreen,
    openWorkspace,
    handleSaveSession,
    handlePrint,
    getPDFData,
    updatePageData,
    updatePageTyped,
    addPage,
  };
}
