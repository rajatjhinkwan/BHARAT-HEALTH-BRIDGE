/** Patient is on a ward / bed — discharge and ward movement apply */
export function isPatientAdmitted(patient) {
  if (!patient) return false;
  const status = String(patient.currentStatus || '').toUpperCase();
  if (status === 'DISCHARGED') return false;

  const hasPlacement = Boolean(patient.currentWard || patient.currentBed);
  const admittedStatuses = [
    'ADMITTED',
    'IN ICU',
    'ON VENTILATOR',
    'UNDER OBSERVATION',
    'RECOVERING',
    'STABLE',
  ];
  return hasPlacement || admittedStatuses.some((s) => status.includes(s));
}

export function canDischargePatient(patient) {
  return isPatientAdmitted(patient);
}
