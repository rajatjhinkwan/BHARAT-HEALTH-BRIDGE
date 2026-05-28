/** Map API patient document to EMR UI shape */
export function mapPatientFromApi(data, extras = {}) {
  if (!data) return null;
  const vitalsArr = Array.isArray(data.vitals) ? data.vitals : [];
  const lastVitals = vitalsArr[vitalsArr.length - 1] || {};
  const normalizedVitals = lastVitals.bp || lastVitals.heartRate || lastVitals.hr
    ? {
        bp: lastVitals.bp || '--',
        hr: lastVitals.hr || lastVitals.heartRate || '--',
        heartRate: lastVitals.heartRate || lastVitals.hr || '--',
        temp: lastVitals.temp || '--',
        spo2: lastVitals.spo2 || '--',
        respiratoryRate: lastVitals.respiratoryRate,
        recordedBy: lastVitals.recordedBy,
      }
    : { bp: '--', hr: '--', heartRate: '--', temp: '--', spo2: '--' };

  return {
    _id: data._id,
    name: data.patientName || data.name,
    patientName: data.patientName,
    mrn: data.mrn,
    age: data.age,
    gender: typeof data.gender === 'string' ? data.gender.charAt(0) : data.gender,
    bloodGroup: data.bloodGroup || 'N/A',
    phone: data.phone,
    email: data.email || 'N/A',
    address: data.address,
    location: data.address || data.city || null,
    allergies: data.allergies || '',
    chronicIllness: data.chronicIllness || '',
    profileImage: data.profileImage,
    vitals: normalizedVitals,
    vitalsRecordedAt: lastVitals.timestamp || lastVitals.recordedAt || null,
    timeline: data.timeline || [],
    currentStatus: data.currentStatus,
    currentDepartment: data.currentDepartment,
    currentWard: data.currentWard,
    currentBed: data.currentBed,
    assignedDoctor: data.assignedDoctor,
    prescriptions: data.prescriptions || [],
    labOrders: data.labOrders || [],
    queueId: extras.queueId ?? data.queueId ?? null,
    tokenNumber: extras.tokenNumber ?? data.tokenNumber ?? null,
    priority: data.priority,
  };
}

export function resolvePatientIdFromLocation(state) {
  const sp = state?.selectedPatient;
  return (
    state?.patientId ||
    sp?.patientId ||
    sp?._id ||
    null
  );
}

export function isValidMongoId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}
