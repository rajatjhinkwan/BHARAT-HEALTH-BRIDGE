export function getVitalStatus(key, value) {
  const v = String(value || '').replace(/[^\d./]/g, '');
  if (!v || v === '--') return { label: '—', className: '' };
  if (key === 'bp') {
    const [sys] = v.split('/').map(Number);
    if (sys >= 90 && sys <= 140) return { label: 'Normal', className: 'status-normal' };
    return { label: 'Review', className: 'status-warning' };
  }
  if (key === 'hr') {
    const n = Number(v);
    if (n >= 60 && n <= 100) return { label: 'Normal', className: 'status-normal' };
    return { label: 'Review', className: 'status-warning' };
  }
  if (key === 'temp') {
    const n = Number(v);
    if (n >= 97 && n <= 99.5) return { label: 'Stable', className: 'status-normal' };
    return { label: 'Review', className: 'status-warning' };
  }
  if (key === 'spo2') {
    const n = Number(v);
    if (n >= 95) return { label: 'Optimal', className: 'status-normal' };
    return { label: 'Low', className: 'status-warning' };
  }
  return { label: 'Normal', className: 'status-normal' };
}

export function buildCriticalAlerts(patient) {
  const items = [];
  const allergyList = (patient?.allergies || '')
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a && a.toLowerCase() !== 'none');
  allergyList.forEach((a) => items.push({ label: `${a} Allergy`, type: 'allergy' }));
  if (patient?.chronicIllness) {
    patient.chronicIllness
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => items.push({ label: c, type: 'condition' }));
  }
  return items;
}
