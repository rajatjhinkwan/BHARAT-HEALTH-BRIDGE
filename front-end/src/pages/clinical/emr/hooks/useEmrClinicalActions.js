import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, apiJson, getDoctorHeaders } from '../../../../utils/api';
import { normalizeDepartment } from '../../../../utils/departments';
import { isValidMongoId } from '../../../../utils/emrPatient';

const WARDS_LIST = [
  'ICU',
  'Ventilator Ward',
  'Neuro Ward',
  'Nephro Ward',
  'Cardiac Ward',
  'Emergency Observation Ward',
  'Trauma Ward',
  'Surgical Ward',
  'Pediatric Ward',
];

export function useEmrClinicalActions({
  patient,
  hasClinicalPatient,
  user,
  department,
  showToast,
  refreshPatient,
  fetchMedicalHistory,
  onReferralSuccess,
  structuredMeds,
}) {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWard, setSelectedWard] = useState('ICU');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({ diagnosis: '', notes: '', followUp: '' });

  const doctorEmployeeId = user?.employeeId || user?.registrationId || user?.employee_id;

  const resolveQueueId = useCallback(async () => {
    if (patient?.queueId) return patient.queueId;
    if (!hasClinicalPatient) return null;
    try {
      const live = await apiJson(
        `/workflow/queue/live?department=${encodeURIComponent(patient.currentDepartment || department)}`
      );
      const all = [...(live.inConsultation || []), ...(live.waiting || [])];
      const match = all.find((q) => String(q.patientId) === String(patient._id));
      return match?.queueId || null;
    } catch {
      return null;
    }
  }, [patient, hasClinicalPatient, department]);

  const handleUpdateQueueStatus = useCallback(async () => {
    const queueId = patient?.queueId || (await resolveQueueId());
    if (!queueId) return;
    try {
      await fetch(`${API_BASE_URL}/workflow/queue/complete/${queueId}`, {
        method: 'PATCH',
        headers: getDoctorHeaders(),
      });
    } catch (err) {
      console.warn('Queue complete failed', err);
    }
  }, [patient?.queueId, resolveQueueId]);

  const handleReferral = useCallback(
    async (targetDept, reason, priority) => {
      if (!hasClinicalPatient) {
        showToast('Select a patient before referral.', 'error');
        throw new Error('No patient');
      }
      setActionLoading(true);
      try {
        const oldQueueId = patient.queueId || (await resolveQueueId());
        const result = await apiJson('/workflow/refer', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient._id,
            targetDepartment: targetDept,
            referringDoctor: user?.name || 'Doctor',
            reason: reason?.trim() || 'Clinical evaluation',
            priority: priority || 'Routine',
            oldQueueId,
          }),
        });
        showToast(
          result.message || `Referred to ${targetDept}${result.token ? ` · Token ${result.token}` : ''}`,
          'success'
        );
        setShowReferralModal(false);
        onReferralSuccess?.();
        navigate('/doctor');
        return result;
      } catch (err) {
        const msg = err.data?.details || err.data?.error || err.message || 'Referral failed';
        showToast(msg, 'error');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [hasClinicalPatient, patient, user, resolveQueueId, showToast, onReferralSuccess, navigate]
  );

  const handleAdmitToWard = useCallback(
    async (wardOverride) => {
      if (!hasClinicalPatient) {
        showToast('Select a registered patient before admission.', 'error');
        return;
      }
      const wardName = wardOverride || selectedWard;
      setActionLoading(true);
      try {
        const data = await apiJson(`/critical/patients/admit/${patient._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ wardName, doctorName: user?.name || 'Doctor' }),
        });
        showToast(`Admitted to ${wardName} · Bed ${data.bed?.bedNumber || 'assigned'}`, 'success');
        await refreshPatient(patient._id);
        await handleUpdateQueueStatus();
      } catch (err) {
        const msg = err.data?.error || err.message || 'Admission failed';
        showToast(
          msg.includes('bed') ? 'No free beds in that ward. Try another ward or seed beds in admin.' : msg,
          'error'
        );
      } finally {
        setActionLoading(false);
      }
    },
    [hasClinicalPatient, selectedWard, patient, user, showToast, refreshPatient, handleUpdateQueueStatus]
  );

  const handleMovePatient = useCallback(
    async (type) => {
      if (type === 'discharge') {
        if (!hasClinicalPatient) {
          showToast('No patient record to discharge.', 'error');
          return;
        }
        setShowDischargeModal(true);
        return;
      }
      const targetWard = type === 'icu' ? 'ICU' : 'Ventilator Ward';
      setSelectedWard(targetWard);
      await handleAdmitToWard(targetWard);
    },
    [hasClinicalPatient, showToast, handleAdmitToWard]
  );

  const handleServiceOrder = useCallback(
    async (type, data) => {
      if (!hasClinicalPatient) {
        showToast('Select a patient before placing orders.', 'error');
        return;
      }
      setActionLoading(true);
      try {
        const endpoint =
          type === 'LAB'
            ? 'order-lab'
            : type === 'RAD'
              ? 'order-radiology'
              : type === 'SURGERY'
                ? 'schedule-surgery'
                : 'start-session';
        await apiJson(`/workflow/${endpoint}`, {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient._id,
            orderedBy: user?.name || 'Doctor',
            performedBy: user?.name || 'Doctor',
            surgeon: user?.name || 'Doctor',
            ...data,
          }),
        });
        showToast(`${type} order placed successfully`, 'success');
        await refreshPatient(patient._id);
        setServiceModal(null);
      } catch (err) {
        showToast(err.message || `${type} order failed`, 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [hasClinicalPatient, patient, user, showToast, refreshPatient]
  );

  const handleScheduleFollowUp = useCallback(
    async ({ appointmentDate, appointmentTime, reason, department: dept, doctorId: apptDoctorId }) => {
      if (!hasClinicalPatient) {
        showToast('Select a patient first.', 'error');
        throw new Error('No patient');
      }
      const docId = apptDoctorId || doctorEmployeeId || user?.employeeId;
      if (!docId) {
        showToast('Select a doctor for the follow-up.', 'error');
        throw new Error('No doctor');
      }
      setActionLoading(true);
      try {
        const appt = await apiJson('/appointments', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient._id,
            doctorId: docId,
            department: dept || department,
            appointmentDate,
            appointmentTime,
            reason: reason || 'Follow-up visit',
          }),
        });
        setDischargeForm((f) => ({ ...f, followUp: appointmentDate }));
        showToast(
          `Follow-up booked ${appointmentDate} at ${appointmentTime}${appt.appointmentId ? ` · ${appt.appointmentId}` : ''}`,
          'success'
        );
        setShowFollowUpModal(false);
        await refreshPatient(patient._id);
        return appt;
      } catch (err) {
        const msg = err.data?.error || err.message || 'Could not book appointment';
        showToast(msg, 'error');
        throw new Error(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [hasClinicalPatient, doctorEmployeeId, user, patient, department, showToast, refreshPatient]
  );

  const confirmDischarge = useCallback(async () => {
    if (!dischargeForm.diagnosis.trim()) {
      showToast('Enter a discharge diagnosis.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await apiJson(`/critical/patients/discharge/${patient._id}/summary`, {
        method: 'POST',
        body: JSON.stringify({
          doctorName: user?.name,
          diagnosis: dischargeForm.diagnosis,
          notes: dischargeForm.notes,
          followUp: dischargeForm.followUp,
          medicines: structuredMeds?.filter((m) => m.name) || [],
        }),
      });
      await apiJson(`/critical/patients/discharge/${patient._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ doctorName: user?.name }),
      });
      await handleUpdateQueueStatus();
      setShowDischargeModal(false);
      showToast('Patient discharged. Summary saved.', 'success');
      navigate('/doctor');
    } catch (err) {
      showToast(err.message || 'Discharge failed', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [dischargeForm, patient, user, structuredMeds, showToast, handleUpdateQueueStatus, navigate]);

  const handleUpdateEmergencyStatus = useCallback(
    async (status, emergencyCase, setEmergencyCase) => {
      if (!emergencyCase) return;
      setActionLoading(true);
      try {
        const updated = await apiJson(`/emergency/${emergencyCase._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        setEmergencyCase(updated);
        if (updated.linkedPatientId && isValidMongoId(updated.linkedPatientId)) {
          await refreshPatient(updated.linkedPatientId);
          await fetchMedicalHistory(updated.linkedPatientId);
          navigate('/emr', {
            state: {
              selectedPatient: {
                _id: updated.linkedPatientId,
                patientName: updated.patientName,
              },
            },
            replace: true,
          });
        }
        showToast(`Status updated: ${status}`, 'success');
      } catch (err) {
        showToast(err.message || 'Failed to update emergency status', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [showToast, refreshPatient, fetchMedicalHistory, navigate]
  );

  const handleReportUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !patient?._id) return;
      const form = new FormData();
      form.append('file', file);
      form.append('patientId', patient._id);
      form.append('title', file.name);
      form.append('type', 'lab_report');
      form.append('doctor', user?.name || 'Doctor');
      try {
        const res = await fetch(`${API_BASE_URL}/history/report/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('hospflow_auth_token') || ''}` },
          body: form,
        });
        if (res.ok) {
          await fetchMedicalHistory(patient._id);
          showToast('Report uploaded successfully.', 'success');
        } else {
          showToast('Report upload failed', 'error');
        }
      } catch {
        showToast('Report upload failed', 'error');
      }
      e.target.value = '';
    },
    [patient, user, fetchMedicalHistory, showToast]
  );

  return {
    actionLoading,
    selectedWard,
    setSelectedWard,
    wardsList: WARDS_LIST,
    showDischargeModal,
    setShowDischargeModal,
    showFollowUpModal,
    setShowFollowUpModal,
    showReferralModal,
    setShowReferralModal,
    serviceModal,
    setServiceModal,
    dischargeForm,
    setDischargeForm,
    handleReferral,
    handleAdmitToWard,
    handleMovePatient,
    handleServiceOrder,
    handleScheduleFollowUp,
    confirmDischarge,
    handleUpdateEmergencyStatus,
    handleReportUpload,
    doctorEmployeeId,
  };
}
