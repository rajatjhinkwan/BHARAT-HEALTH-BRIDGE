/** Map UI / login department labels to canonical DB values used in queues & doctors. */
const TO_CANONICAL = {
  'General Medicine': 'General Medicine',
  'GENERAL MEDICINE': 'General Medicine',
  Cardiology: 'Cardiology',
  CARDIOLOGY: 'Cardiology',
  Neurology: 'Neurology',
  NEUROLOGY: 'Neurology',
  Nephrology: 'Nephrology',
  NEPHROLOGY: 'Nephrology',
  Orthopedics: 'Orthopedics',
  ORTHOPEDICS: 'Orthopedics',
  ENT: 'ENT',
  Dermatology: 'Dermatology',
  DERMATOLOGY: 'Dermatology',
  Pediatrics: 'Pediatrics',
  PEDIATRICS: 'Pediatrics',
  Gynecology: 'Gynecology',
  GYNECOLOGY: 'Gynecology',
  Psychiatry: 'Psychiatry',
  PSYCHIATRY: 'Psychiatry',
  Radiology: 'Radiology',
  RADIOLOGY: 'Radiology',
  Oncology: 'Oncology',
  ONCOLOGY: 'Oncology',
  Pulmonology: 'Pulmonology',
  PULMONOLOGY: 'Pulmonology',
  Urology: 'Urology',
  UROLOGY: 'Urology',
  Gastroenterology: 'Gastroenterology',
  GASTROENTEROLOGY: 'Gastroenterology',
  Endocrinology: 'Endocrinology',
  ENDOCRINOLOGY: 'Endocrinology',
  Ophthalmology: 'Ophthalmology',
  OPHTHALMOLOGY: 'Ophthalmology',
  Emergency: 'Emergency',
  EMERGENCY: 'Emergency',
  ICU: 'ICU',
  'Ventilator Ward': 'Ventilator Ward',
  'VENTILATOR WARD': 'Ventilator Ward',
  Reception: 'Reception',
  RECEPTION: 'Reception',
  OPD: 'OPD',
  Laboratory: 'Laboratory',
  LABORATORY: 'Laboratory',
  Pharmacy: 'Pharmacy',
  PHARMACY: 'Pharmacy',
};

export function normalizeDepartment(dept) {
  if (!dept || typeof dept !== 'string') return 'OPD';
  const trimmed = dept.trim();
  return TO_CANONICAL[trimmed] || TO_CANONICAL[trimmed.toUpperCase()] || trimmed;
}

export function tokenPrefixForDepartment(dept) {
  const canonical = normalizeDepartment(dept);
  return canonical.substring(0, 5).toUpperCase().replace(/\s/g, '') || 'OPD';
}

/** OPD departments available for appointment booking & referrals */
export const OPD_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Nephrology',
  'Orthopedics',
  'ENT',
  'Dermatology',
  'Pediatrics',
  'Gynecology',
  'Psychiatry',
  'Radiology',
  'Oncology',
  'Pulmonology',
  'Urology',
  'Gastroenterology',
  'Endocrinology',
  'Ophthalmology',
  'Emergency',
];
