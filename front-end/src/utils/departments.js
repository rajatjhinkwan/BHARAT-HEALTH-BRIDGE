/** Keep in sync with back-end/src/lib/departments.js */
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
  Pediatrics: 'Pediatrics',
  Gynecology: 'Gynecology',
  Psychiatry: 'Psychiatry',
  Radiology: 'Radiology',
  Oncology: 'Oncology',
  Pulmonology: 'Pulmonology',
  Urology: 'Urology',
  Gastroenterology: 'Gastroenterology',
  Endocrinology: 'Endocrinology',
  Ophthalmology: 'Ophthalmology',
  Emergency: 'Emergency',
  EMERGENCY: 'Emergency',
  ICU: 'ICU',
  'Ventilator Ward': 'Ventilator Ward',
};

export const OPD_DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Nephrology', 'Orthopedics',
  'ENT', 'Dermatology', 'Pediatrics', 'Gynecology', 'Psychiatry',
  'Radiology', 'Oncology', 'Pulmonology', 'Urology', 'Gastroenterology',
  'Endocrinology', 'Ophthalmology', 'Emergency',
];

export function normalizeDepartment(dept) {
  if (!dept || typeof dept !== 'string') return 'OPD';
  const trimmed = dept.trim();
  return TO_CANONICAL[trimmed] || TO_CANONICAL[trimmed.toUpperCase()] || trimmed;
}

export function departmentsMatch(a, b) {
  return normalizeDepartment(a) === normalizeDepartment(b);
}
