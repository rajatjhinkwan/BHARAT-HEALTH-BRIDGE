/**
 * Mirrors back-end staffRegistry login rules for the web login UI.
 */

export const STAFF_DEFAULT_PASSWORD = 'password123';

export type LoginProfileKey =
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_tech'
  | 'pharmacist'
  | 'pharmacy_manager'
  | 'inventory_manager'
  | 'admin'
  | 'unknown';


export interface LoginProfile {
  roleKey: LoginProfileKey;
  label: string;
  idPrefixes: string[];
  needsDepartment: boolean;
  departmentLabel?: string;
  portal: string;
  placeholder: string;
}

export const LOGIN_PROFILES: Record<Exclude<LoginProfileKey, 'unknown'>, LoginProfile> = {
  doctor: {
    roleKey: 'doctor',
    label: 'Doctor',
    idPrefixes: ['DOC'],
    needsDepartment: true,
    departmentLabel: 'Clinical department',
    portal: 'OPD Queue · EMR',
    placeholder: 'DOC-GEN-123',
  },
  nurse: {
    roleKey: 'nurse',
    label: 'Nurse',
    idPrefixes: ['NUR'],
    needsDepartment: true,
    departmentLabel: 'Assigned ward / department',
    portal: 'Nurse Station · Vitals',
    placeholder: 'NUR-ICU-123',
  },
  receptionist: {
    roleKey: 'receptionist',
    label: 'Receptionist',
    idPrefixes: ['REC'],
    needsDepartment: false,
    portal: 'Registration · Queue',
    placeholder: 'REC-123',
  },
  lab_tech: {
    roleKey: 'lab_tech',
    label: 'Lab Technician',
    idPrefixes: ['LAB'],
    needsDepartment: false,
    portal: 'Laboratory OS · Reports',
    placeholder: 'LAB-123',
  },
  pharmacist: {
    roleKey: 'pharmacist',
    label: 'Pharmacist',
    idPrefixes: ['PHA'],
    needsDepartment: false,
    portal: 'Pharmacy · Dispensing',
    placeholder: 'PHA-123',
  },
  pharmacy_manager: {
    roleKey: 'pharmacy_manager',
    label: 'Pharmacy Manager',
    idPrefixes: ['PMG'],
    needsDepartment: false,
    portal: 'Pharmacy OS · Inventory',
    placeholder: 'PMG-123',
  },
  inventory_manager: {
    roleKey: 'inventory_manager',
    label: 'Inventory Manager',
    idPrefixes: ['INV'],
    needsDepartment: false,
    portal: 'Stock Control',
    placeholder: 'INV-123',
  },
  admin: {
    roleKey: 'admin',
    label: 'Administrator',
    idPrefixes: ['ADM', 'SAD'],
    needsDepartment: false,
    portal: 'Hospital Administration',
    placeholder: 'ADM-123',
  },
};

export function detectLoginProfile(employeeId: string): LoginProfile | null {
  const id = employeeId.trim().toUpperCase();
  if (!id) return null;
  for (const profile of Object.values(LOGIN_PROFILES)) {
    if (profile.idPrefixes.some((p) => id.startsWith(p))) {
      return profile;
    }
  }
  return null;
}

/** Departments shown for clinical staff */
export const DOCTOR_DEPARTMENTS = [
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
  'ICU',
  'Ventilator Ward',
  'Trauma Ward',
  'Surgery Ward',
];

/** Wards/departments for nurses (fully aligned with doctors for simplicity) */
export const NURSE_DEPARTMENTS = DOCTOR_DEPARTMENTS;
