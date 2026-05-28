/** Canonical inpatient wards — keep in sync with back-end/src/lib/wards.js */

export const WARD_CATALOG = [
  { key: 'ICU', label: 'Intensive Care (ICU)', opdDepartment: 'ICU' },
  { key: 'Ventilator Ward', label: 'Ventilator Unit', opdDepartment: 'Ventilator Ward' },
  { key: 'Neuro Ward', label: 'Neurology', opdDepartment: 'Neurology' },
  { key: 'Nephro Ward', label: 'Nephrology', opdDepartment: 'Nephrology' },
  { key: 'Cardiac Ward', label: 'Cardiology', opdDepartment: 'Cardiology' },
  { key: 'Emergency Observation Ward', label: 'Emergency Observation', opdDepartment: 'Emergency' },
  { key: 'Trauma Ward', label: 'Trauma & Orthopedics', opdDepartment: 'Orthopedics' },
  { key: 'Surgical Ward', label: 'General Surgery', opdDepartment: 'General Medicine' },
  { key: 'Pediatric Ward', label: 'Pediatrics', opdDepartment: 'Pediatrics' },
];

export const CLINICAL_WARDS = WARD_CATALOG.map((w) => w.key);

const STORAGE_KEY = 'bhb_selected_ward';

export function getWardOptions() {
  return WARD_CATALOG.map(({ key, label }) => ({ key, label, value: key }));
}

export function toWardKey(input) {
  if (!input) return 'ICU';
  const trimmed = String(input).trim();
  const byKey = WARD_CATALOG.find((w) => w.key.toLowerCase() === trimmed.toLowerCase());
  if (byKey) return byKey.key;
  const byLabel = WARD_CATALOG.find((w) => w.label.toLowerCase() === trimmed.toLowerCase());
  if (byLabel) return byLabel.key;
  const partial = WARD_CATALOG.find(
    (w) => w.key.toLowerCase().includes(trimmed.toLowerCase()) || w.label.toLowerCase().includes(trimmed.toLowerCase())
  );
  return partial?.key || trimmed;
}

export function toDisplayLabel(wardKey) {
  const entry = WARD_CATALOG.find((w) => w.key.toLowerCase() === String(wardKey || '').toLowerCase());
  return entry?.label || wardKey || 'Unknown Ward';
}

export function wardToOpdDepartment(wardKey) {
  const entry = WARD_CATALOG.find((w) => w.key.toLowerCase() === String(wardKey || '').toLowerCase());
  return entry?.opdDepartment || wardKey;
}

export function isCleaningStatus(status) {
  const s = (status || '').toUpperCase();
  return s === 'UNDER_MAINTENANCE' || s === 'CLEANING';
}

export function computeBedStats(beds = []) {
  return {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE' && !b.occupied).length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED' || b.occupied).length,
    cleaning: beds.filter((b) => isCleaningStatus(b.status)).length,
    critical: beds.filter((b) => b.status === 'CRITICAL').length,
  };
}

export function getStoredWard(fallback = 'ICU') {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return toWardKey(stored);
  } catch {
    /* ignore */
  }
  return toWardKey(fallback);
}

export function setStoredWard(wardKey) {
  try {
    sessionStorage.setItem(STORAGE_KEY, toWardKey(wardKey));
  } catch {
    /* ignore */
  }
}

export function resolveInitialWard(user, urlWard) {
  if (urlWard) return toWardKey(urlWard);
  const fromUser = user?.assignedWard || user?.department;
  if (fromUser && CLINICAL_WARDS.some((w) => w.toLowerCase() === fromUser.toLowerCase())) {
    return toWardKey(fromUser);
  }
  return getStoredWard('ICU');
}

export const ALL_ROOMS = '__ALL__';

export function normalizeRoom(room) {
  return String(room || '').trim().toLowerCase();
}

export function roomMatches(bedRoom, selectedRoom) {
  if (!selectedRoom || selectedRoom === ALL_ROOMS) return true;
  return normalizeRoom(bedRoom) === normalizeRoom(selectedRoom);
}
