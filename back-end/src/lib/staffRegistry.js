/**
 * Single source of truth for demo hospital staff credentials.
 * Used by seed scripts, bootstrap, and staff reference export.
 *
 * Default password for all accounts: password123
 * 2FA step on web login: any 6 digits (demo)
 */

export const STAFF_DEFAULT_PASSWORD = 'password123';

/** Who must pick department/ward on login */
export const ROLES_REQUIRING_DEPARTMENT = ['doctor', 'nurse'];

/** Role → login UI group (drives single-field vs department field on web) */
export const LOGIN_PROFILES = {
  doctor: {
    label: 'Doctor',
    idPrefixes: ['DOC'],
    needsDepartment: true,
    departmentLabel: 'Clinical department',
    redirect: '/doctor',
    portal: 'OPD Queue · EMR · Lab orders',
  },
  nurse: {
    label: 'Nurse',
    idPrefixes: ['NUR'],
    needsDepartment: true,
    departmentLabel: 'Assigned ward / department',
    redirect: '/nurse-station',
    portal: 'Nurse Station · Vitals · ICU',
  },
  receptionist: {
    label: 'Receptionist',
    idPrefixes: ['REC'],
    needsDepartment: false,
    redirect: '/reception',
    portal: 'Registration · Queue · Appointments',
  },
  lab_tech: {
    label: 'Lab Technician',
    idPrefixes: ['LAB'],
    needsDepartment: false,
    redirect: '/lab',
    portal: 'Laboratory OS · Sample · Reports',
  },
  pharmacist: {
    label: 'Pharmacist',
    idPrefixes: ['PHA'],
    needsDepartment: false,
    redirect: '/pharmacy',
    portal: 'Pharmacy · Dispensing · Inventory',
  },
  pharmacy_manager: {
    label: 'Pharmacy Manager',
    idPrefixes: ['PMG'],
    needsDepartment: false,
    redirect: '/pharmacy',
    portal: 'Pharmacy OS · Inventory · PO · Reports',
  },
  inventory_manager: {
    label: 'Inventory Manager',
    idPrefixes: ['INV'],
    needsDepartment: false,
    redirect: '/pharmacy',
    portal: 'Stock control · Suppliers · Purchase orders',
  },
  admin: {
    label: 'Administrator',
    idPrefixes: ['ADM', 'SAD'],
    needsDepartment: false,
    redirect: '/admin',
    portal: 'Hospital Admin · HR · Beds',
  },
};

export function detectLoginProfile(employeeId = '') {
  const id = String(employeeId).trim().toUpperCase();
  for (const [key, profile] of Object.entries(LOGIN_PROFILES)) {
    if (profile.idPrefixes.some((p) => id.startsWith(p))) {
      return { roleKey: key, ...profile };
    }
  }
  return null;
}

/** Full staff list for MongoDB seed */
export const STAFF_REGISTRY = [
  // —— Administration ——
  { name: 'Super Admin', employeeId: 'SAD-123', role: 'super_admin', department: 'Administration', group: 'Administration' },
  { name: 'Hospital Admin', employeeId: 'ADM-123', role: 'hospital_admin', department: 'Administration', group: 'Administration' },

  // —— Reception ——
  { name: 'Main Receptionist', employeeId: 'REC-123', role: 'receptionist', department: 'Reception', group: 'Reception' },

  // —— Laboratory ——
  { name: 'Chief Lab Technician', employeeId: 'LAB-123', role: 'lab_tech', department: 'Laboratory', group: 'Laboratory' },

  // —— Pharmacy ——
  { name: 'Chief Pharmacist', employeeId: 'PHA-123', role: 'pharmacist', department: 'Pharmacy', group: 'Pharmacy' },

  // —— Doctors & Nurses (Exactly 1 doctor and 1 nurse per department) ——
  
  // General Medicine
  { name: 'Dr. Rahul Negi', employeeId: 'DOC-GEN-123', role: 'doctor', department: 'General Medicine', specialization: 'General Medicine', group: 'Doctors' },
  { name: 'Nurse General Care', employeeId: 'NUR-GEN-123', role: 'nurse', department: 'General Medicine', assignedWard: 'General Medicine', group: 'Nurses' },

  // Cardiology
  { name: 'Dr. Anoop Chauhan', employeeId: 'DOC-CARD-123', role: 'doctor', department: 'Cardiology', specialization: 'Cardiology', group: 'Doctors' },
  { name: 'Nurse Cardiac Care', employeeId: 'NUR-CARD-123', role: 'nurse', department: 'Cardiology', assignedWard: 'Cardiology', group: 'Nurses' },

  // Neurology
  { name: 'Dr. Rajat Jhinkwan', employeeId: 'DOC-NEUR-123', role: 'doctor', department: 'Neurology', specialization: 'Neurology Specialist', group: 'Doctors' },
  { name: 'Nurse Neuro Care', employeeId: 'NUR-NEUR-123', role: 'nurse', department: 'Neurology', assignedWard: 'Neurology', group: 'Nurses' },

  // Nephrology
  { name: 'Dr. Deepak Bhandari', employeeId: 'DOC-NEPH-123', role: 'doctor', department: 'Nephrology', specialization: 'Nephrology Specialist', group: 'Doctors' },
  { name: 'Nurse Nephro Care', employeeId: 'NUR-NEPH-123', role: 'nurse', department: 'Nephrology', assignedWard: 'Nephrology', group: 'Nurses' },

  // Orthopedics
  { name: 'Dr. Kartikay Jhinkwan', employeeId: 'DOC-ORTH-123', role: 'doctor', department: 'Orthopedics', specialization: 'Trauma Specialist', group: 'Doctors' },
  { name: 'Nurse Ortho Care', employeeId: 'NUR-ORTH-123', role: 'nurse', department: 'Orthopedics', assignedWard: 'Orthopedics', group: 'Nurses' },

  // ENT
  { name: 'Dr. Ramesh Chaudhary', employeeId: 'DOC-ENT-123', role: 'doctor', department: 'ENT', specialization: 'ENT Consultant', group: 'Doctors' },
  { name: 'Nurse ENT Care', employeeId: 'NUR-ENT-123', role: 'nurse', department: 'ENT', assignedWard: 'ENT', group: 'Nurses' },

  // Dermatology
  { name: 'Dr. Vinod Bisht', employeeId: 'DOC-DERM-123', role: 'doctor', department: 'Dermatology', specialization: 'Clinical Dermatologist', group: 'Doctors' },
  { name: 'Nurse Dermat Care', employeeId: 'NUR-DERM-123', role: 'nurse', department: 'Dermatology', assignedWard: 'Dermatology', group: 'Nurses' },

  // Pediatrics
  { name: 'Dr. Renu Pant', employeeId: 'DOC-PED-123', role: 'doctor', department: 'Pediatrics', specialization: 'Neonatology', group: 'Doctors' },
  { name: 'Nurse Pediatric Care', employeeId: 'NUR-PED-123', role: 'nurse', department: 'Pediatrics', assignedWard: 'Pediatrics', group: 'Nurses' },

  // Gynecology
  { name: 'Dr. Priya Rawat', employeeId: 'DOC-GYN-123', role: 'doctor', department: 'Gynecology', specialization: 'Obstetrics Specialist', group: 'Doctors' },
  { name: 'Nurse Gynae Care', employeeId: 'NUR-GYN-123', role: 'nurse', department: 'Gynecology', assignedWard: 'Gynecology', group: 'Nurses' },

  // Psychiatry
  { name: 'Dr. Suresh Negi', employeeId: 'DOC-PSY-123', role: 'doctor', department: 'Psychiatry', specialization: 'Clinical Psychiatry', group: 'Doctors' },
  { name: 'Nurse Psych Care', employeeId: 'NUR-PSY-123', role: 'nurse', department: 'Psychiatry', assignedWard: 'Psychiatry', group: 'Nurses' },

  // Radiology
  { name: 'Dr. Surendra Singh Rawat', employeeId: 'DOC-RAD-123', role: 'doctor', department: 'Radiology', specialization: 'Diagnostic Imaging', group: 'Doctors' },
  { name: 'Nurse Radio Care', employeeId: 'NUR-RAD-123', role: 'nurse', department: 'Radiology', assignedWard: 'Radiology', group: 'Nurses' },

  // Oncology
  { name: 'Dr. Mohit Chauhan', employeeId: 'DOC-ONC-123', role: 'doctor', department: 'Oncology', specialization: 'Medical Oncology', group: 'Doctors' },
  { name: 'Nurse Onco Care', employeeId: 'NUR-ONC-123', role: 'nurse', department: 'Oncology', assignedWard: 'Oncology', group: 'Nurses' },

  // Pulmonology
  { name: 'Dr. Susheela Tiwari', employeeId: 'DOC-PULM-123', role: 'doctor', department: 'Pulmonology', specialization: 'Respiratory Medicine', group: 'Doctors' },
  { name: 'Nurse Pulmo Care', employeeId: 'NUR-PULM-123', role: 'nurse', department: 'Pulmonology', assignedWard: 'Pulmonology', group: 'Nurses' },

  // Urology
  { name: 'Dr. Vikram Bhandari', employeeId: 'DOC-UROL-123', role: 'doctor', department: 'Urology', specialization: 'Urology Specialist', group: 'Doctors' },
  { name: 'Nurse Urology Care', employeeId: 'NUR-UROL-123', role: 'nurse', department: 'Urology', assignedWard: 'Urology', group: 'Nurses' },

  // Gastroenterology
  { name: 'Dr. Kumar Bisht', employeeId: 'DOC-GAST-123', role: 'doctor', department: 'Gastroenterology', specialization: 'Gastroenterology Head', group: 'Doctors' },
  { name: 'Nurse Gastro Care', employeeId: 'NUR-GAST-123', role: 'nurse', department: 'Gastroenterology', assignedWard: 'Gastroenterology', group: 'Nurses' },

  // Endocrinology
  { name: 'Dr. Shashank Negi', employeeId: 'DOC-ENDO-123', role: 'doctor', department: 'Endocrinology', specialization: 'Endocrine Specialist', group: 'Doctors' },
  { name: 'Nurse Endo Care', employeeId: 'NUR-ENDO-123', role: 'nurse', department: 'Endocrinology', assignedWard: 'Endocrinology', group: 'Nurses' },

  // Ophthalmology
  { name: 'Dr. Ajay Rawat', employeeId: 'DOC-OPHT-123', role: 'doctor', department: 'Ophthalmology', specialization: 'Ophthalmic Surgeon', group: 'Doctors' },
  { name: 'Nurse Ophthal Care', employeeId: 'NUR-OPHT-123', role: 'nurse', department: 'Ophthalmology', assignedWard: 'Ophthalmology', group: 'Nurses' },

  // Emergency
  { name: 'Dr. Ganesh Singh Parihar', employeeId: 'DOC-EMER-123', role: 'doctor', department: 'Emergency', specialization: 'Emergency Medicine', group: 'Doctors' },
  { name: 'Nurse Emergency Triage', employeeId: 'NUR-EMER-123', role: 'nurse', department: 'Emergency', assignedWard: 'Emergency', group: 'Nurses' },

  // ICU
  { name: 'Dr. Susheela Bhandari', employeeId: 'DOC-ICU-123', role: 'doctor', department: 'ICU', specialization: 'Intensivist', group: 'Doctors' },
  { name: 'Nurse ICU Head', employeeId: 'NUR-ICU-123', role: 'nurse', department: 'ICU', assignedWard: 'ICU', group: 'Nurses' },

  // Ventilator Ward
  { name: 'Dr. Vivek Negi', employeeId: 'DOC-VENT-123', role: 'doctor', department: 'Ventilator Ward', specialization: 'Pulmonology', group: 'Doctors' },
  { name: 'Nurse Ventilator Tech', employeeId: 'NUR-VENT-123', role: 'nurse', department: 'Ventilator Ward', assignedWard: 'Ventilator Ward', group: 'Nurses' },

  // Trauma Ward
  { name: 'Dr. Vikram Rawat', employeeId: 'DOC-TRAU-123', role: 'doctor', department: 'Trauma Ward', specialization: 'Trauma Surgery', group: 'Doctors' },
  { name: 'Nurse Trauma Care', employeeId: 'NUR-TRAU-123', role: 'nurse', department: 'Trauma Ward', assignedWard: 'Trauma Ward', group: 'Nurses' },

  // Surgery Ward
  { name: 'Dr. Aryan Bisht', employeeId: 'DOC-SURG-123', role: 'doctor', department: 'Surgery Ward', specialization: 'General Surgery', group: 'Doctors' },
  { name: 'Nurse Surgery Care', employeeId: 'NUR-SURG-123', role: 'nurse', department: 'Surgery Ward', assignedWard: 'Surgery Ward', group: 'Nurses' }
];

export function staffByGroup() {
  const groups = {};
  for (const s of STAFF_REGISTRY) {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  }
  return groups;
}
