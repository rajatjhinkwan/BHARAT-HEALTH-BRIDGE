import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiJson } from '../../../../utils/api';
import { mapPatientFromApi, resolvePatientIdFromLocation, isValidMongoId } from '../../../../utils/emrPatient';

export function useEmrPatient({ showToast, isDoctorRole, onSeeNextFromQueue }) {
  const location = useLocation();
  const navigate = useNavigate();
  const emergencyCaseData = location.state?.emergencyCase || null;
  const [emergencyCase, setEmergencyCase] = useState(emergencyCaseData);
  const [patientLoading, setPatientLoading] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [vitalsUpdatedAt, setVitalsUpdatedAt] = useState(null);

  const selectedPatient = location.state?.selectedPatient || null;
  const initialPatientId = resolvePatientIdFromLocation(location.state);

  const [patient, setPatient] = useState(() => {
    if (selectedPatient || initialPatientId) {
      return (
        mapPatientFromApi(
          {
            _id: initialPatientId,
            patientName: selectedPatient?.patientName,
            mrn: selectedPatient?.mrn,
            age: selectedPatient?.age,
            gender: selectedPatient?.gender,
            phone: selectedPatient?.phone,
            vitals: selectedPatient?.vitals,
          },
          { queueId: selectedPatient?.queueId, tokenNumber: selectedPatient?.tokenNumber }
        ) || {
          _id: initialPatientId,
          name: selectedPatient?.patientName || 'Loading…',
          mrn: selectedPatient?.mrn || '—',
          queueId: selectedPatient?.queueId,
          tokenNumber: selectedPatient?.tokenNumber,
          vitals: { bp: '--', hr: '--', temp: '--', spo2: '--' },
        }
      );
    }
    if (emergencyCase) {
      return {
        _id: null,
        name: emergencyCase.patientName,
        mrn: emergencyCase.caseId,
        age: emergencyCase.age,
        gender: emergencyCase.gender?.charAt(0),
        phone: emergencyCase.phone,
        vitals: emergencyCase.vitals || { bp: '--', hr: '--', temp: '--', spo2: '--' },
        currentStatus: emergencyCase.currentStatus,
      };
    }
    return null;
  });

  const hasClinicalPatient = patient?._id && isValidMongoId(patient._id);

  const fetchMedicalHistory = useCallback(async (patientId) => {
    if (!isValidMongoId(patientId)) return;
    setHistoryLoading(true);
    try {
      const records = await apiJson(`/history/patient/${patientId}`);
      setMedicalHistory(records);
    } catch (err) {
      console.error('Failed to fetch medical history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshPatient = useCallback(
    async (patientId) => {
      if (!isValidMongoId(patientId)) return null;
      const data = await apiJson(`/clinical/patients/${patientId}`);
      const mapped = mapPatientFromApi(data, {
        queueId: patient?.queueId || selectedPatient?.queueId,
        tokenNumber: patient?.tokenNumber || selectedPatient?.tokenNumber,
      });
      setPatient(mapped);
      if (mapped?.vitalsRecordedAt) {
        setVitalsUpdatedAt(new Date(mapped.vitalsRecordedAt).getTime());
      }
      return mapped;
    },
    [patient?.queueId, patient?.tokenNumber, selectedPatient]
  );

  useEffect(() => {
    const patientId = resolvePatientIdFromLocation(location.state);
    if (!isValidMongoId(patientId)) return;

    const patientState = location.state?.selectedPatient;
    (async () => {
      setPatientLoading(true);
      try {
        const data = await apiJson(`/clinical/patients/${patientId}`);
        const mapped = mapPatientFromApi(data, {
          queueId: patientState?.queueId,
          tokenNumber: patientState?.tokenNumber,
        });
        setPatient(mapped);
        if (mapped?.vitalsRecordedAt) {
          setVitalsUpdatedAt(new Date(mapped.vitalsRecordedAt).getTime());
        }
        await fetchMedicalHistory(patientId);
      } catch (err) {
        showToast(err.message || 'Could not load patient', 'error');
      } finally {
        setPatientLoading(false);
      }
    })();
  }, [location.state, fetchMedicalHistory, showToast]);

  const navigateQueuePatient = useCallback(
    (direction, queuePatients) => {
      if (!queuePatients?.length) return;
      const currentQueueIndex = queuePatients.findIndex(
        (q) => q.patientId === patient?._id || q._id === patient?._id
      );
      const nextIdx =
        direction === 'next'
          ? Math.min(queuePatients.length - 1, currentQueueIndex + 1)
          : Math.max(0, currentQueueIndex - 1);
      if (nextIdx === currentQueueIndex || nextIdx < 0) {
        if (direction === 'next' && isDoctorRole) onSeeNextFromQueue?.();
        return;
      }
      const entry = queuePatients[nextIdx];
      navigate('/emr', {
        state: {
          selectedPatient: {
            _id: entry.patientId || entry._id,
            patientName: entry.patientName,
            queueId: entry.queueId || entry._id,
            tokenNumber: entry.tokenNumber,
          },
        },
      });
    },
    [patient?._id, isDoctorRole, onSeeNextFromQueue, navigate]
  );

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !hasClinicalPatient) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const profileImage = reader.result;
        setPatient((prev) => ({ ...prev, profileImage }));
        try {
          await apiJson(`/clinical/patients/${patient._id}`, {
            method: 'PUT',
            body: JSON.stringify({ profileImage }),
          });
          showToast('Profile photo updated', 'success');
        } catch {
          showToast('Photo saved locally only — sync failed', 'error');
        }
      };
      reader.readAsDataURL(file);
    },
    [hasClinicalPatient, patient?._id, showToast]
  );

  const handleVitalsSaved = useCallback(async () => {
    setVitalsUpdatedAt(Date.now());
    if (patient?._id) {
      await refreshPatient(patient._id);
      await fetchMedicalHistory(patient._id);
      showToast('Vitals recorded and synced to patient chart.', 'success');
    }
  }, [patient?._id, refreshPatient, fetchMedicalHistory, showToast]);

  return {
    patient,
    setPatient,
    emergencyCase,
    setEmergencyCase,
    patientLoading,
    hasClinicalPatient,
    medicalHistory,
    historyLoading,
    fetchMedicalHistory,
    refreshPatient,
    navigateQueuePatient,
    handleImageUpload,
    vitalsUpdatedAt,
    handleVitalsSaved,
  };
}
