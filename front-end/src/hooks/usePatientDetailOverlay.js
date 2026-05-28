import { useState, useCallback } from 'react';

export function usePatientDetailOverlay() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openPatientDetail = useCallback((patient) => {
    setSelectedPatient(patient);
    setIsFullscreen(false);
  }, []);

  const closePatientDetail = useCallback(() => {
    setSelectedPatient(null);
    setIsFullscreen(false);
  }, []);

  const togglePatientDetailFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return {
    selectedPatient,
    isFullscreen,
    isPatientDetailOpen: Boolean(selectedPatient),
    openPatientDetail,
    closePatientDetail,
    togglePatientDetailFullscreen,
  };
}
