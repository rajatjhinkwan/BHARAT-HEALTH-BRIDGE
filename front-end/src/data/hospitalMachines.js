// Hospital Equipment & Machine Tracking Database
// Real-world machines used in Indian hospitals

export const DEPARTMENTS = [
  { id: 'all', name: 'All Departments', icon: '🏥', color: '#0ea5e9' },
  { id: 'radiology', name: 'Radiology & Imaging', icon: '📡', color: '#8b5cf6' },
  { id: 'ot', name: 'Operation Theatre', icon: '🔬', color: '#ef4444' },
  { id: 'icu', name: 'ICU / Critical Care', icon: '❤️', color: '#f43f5e' },
  { id: 'emergency', name: 'Emergency Dept', icon: '🚑', color: '#f59e0b' },
  { id: 'laboratory', name: 'Laboratory / Pathology', icon: '🧪', color: '#10b981' },
  { id: 'pharmacy', name: 'Pharmacy & Cold Chain', icon: '💊', color: '#06b6d4' },
  { id: 'cardiology', name: 'Cardiology / Cath Lab', icon: '🫀', color: '#ec4899' },
  { id: 'physio', name: 'Physiotherapy & Rehab', icon: '🦴', color: '#84cc16' },
];

export const STATUS_MAP = {
  operational: { label: 'Operational', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  maintenance: { label: 'Under Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  offline: { label: 'Offline', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  calibration: { label: 'Calibration', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  standby: { label: 'Standby', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

let _id = 0;
const m = (name, manufacturer, model, dept, status, location, uptime, lastMaint, nextMaint, purchaseDate, warranty, serial) => ({
  id: ++_id,
  name, manufacturer, model, department: dept, status, location, uptime,
  lastMaintenance: lastMaint, nextMaintenance: nextMaint,
  purchaseDate, warrantyStatus: warranty, serialNumber: serial,
});

export const MACHINES = [
  // ── Radiology & Imaging ──
  m('CT Scanner', 'GE Healthcare', 'Revolution CT', 'radiology', 'operational', 'Ground Floor, Room R-101', 97.2, '2026-03-15', '2026-06-15', '2022-08-10', 'Active', 'GE-CT-REV-44821'),
  m('MRI Scanner 3T', 'Siemens Healthineers', 'MAGNETOM Lumina', 'radiology', 'operational', 'Basement B1, Room R-001', 98.5, '2026-04-01', '2026-07-01', '2023-01-20', 'Active', 'SIE-MRI-LUM-77234'),
  m('Digital X-Ray', 'Fujifilm', 'FDR D-EVO III', 'radiology', 'operational', 'Ground Floor, Room R-105', 99.1, '2026-03-20', '2026-06-20', '2021-06-15', 'Expired', 'FUJ-XR-DEVO-19283'),
  m('Ultrasound System', 'Philips', 'EPIQ Elite', 'radiology', 'maintenance', 'Ground Floor, Room R-110', 94.6, '2026-04-10', '2026-04-30', '2022-11-05', 'Active', 'PHI-US-EPIQ-56712'),
  m('Mammography Unit', 'Hologic', '3Dimensions', 'radiology', 'operational', '1st Floor, Room R-201', 96.8, '2026-02-28', '2026-05-28', '2023-03-12', 'Active', 'HOL-MAM-3D-33019'),
  m('Mobile C-Arm', 'Siemens', 'Cios Fit', 'radiology', 'operational', 'OT Complex, Room OT-Corridor', 95.3, '2026-03-25', '2026-06-25', '2022-05-08', 'Active', 'SIE-CA-CIOS-41567'),
  m('Fluoroscopy System', 'Philips', 'ProxiDiagnost N90', 'radiology', 'calibration', 'Ground Floor, Room R-115', 92.1, '2026-04-15', '2026-05-15', '2021-09-22', 'Expired', 'PHI-FL-PROX-28345'),
  m('PET-CT Scanner', 'GE Healthcare', 'Discovery MI', 'radiology', 'operational', 'Basement B1, Room R-005', 96.4, '2026-03-10', '2026-06-10', '2024-01-15', 'Active', 'GE-PET-DISC-88901'),

  // ── Operation Theatre ──
  m('Anesthesia Workstation', 'Dräger', 'Perseus A500', 'ot', 'operational', 'OT Complex, Room OT-1', 99.0, '2026-04-05', '2026-07-05', '2022-04-18', 'Active', 'DRA-AN-PER-55210'),
  m('Anesthesia Workstation #2', 'Dräger', 'Perseus A500', 'ot', 'operational', 'OT Complex, Room OT-2', 98.7, '2026-04-05', '2026-07-05', '2022-04-18', 'Active', 'DRA-AN-PER-55211'),
  m('Surgical Table', 'Maquet (Getinge)', 'Magnus', 'ot', 'operational', 'OT Complex, Room OT-1', 99.5, '2026-03-01', '2026-09-01', '2021-11-30', 'Expired', 'MAQ-ST-MAG-20134'),
  m('Electrosurgical Unit', 'Covidien (Medtronic)', 'Force FX', 'ot', 'operational', 'OT Complex, Room OT-1', 97.8, '2026-03-18', '2026-06-18', '2022-07-25', 'Active', 'COV-ESU-FFX-67823'),
  m('Patient Monitor', 'Mindray', 'BeneVision N22', 'ot', 'operational', 'OT Complex, Room OT-1', 98.9, '2026-04-02', '2026-07-02', '2023-02-14', 'Active', 'MIN-PM-BV22-34521'),
  m('Defibrillator', 'Zoll', 'R Series', 'ot', 'standby', 'OT Complex, Crash Station', 99.9, '2026-04-20', '2026-07-20', '2023-06-01', 'Active', 'ZOL-DF-RS-11923'),
  m('Surgical LED Lights', 'Dr. Mach', 'LED 5 / LED 3', 'ot', 'operational', 'OT Complex, Room OT-1', 99.8, '2026-01-15', '2026-07-15', '2022-01-10', 'Active', 'DRM-SL-LED5-44501'),
  m('Laparoscopy Tower', 'Karl Storz', 'IMAGE1 S', 'ot', 'maintenance', 'OT Complex, Room OT-3', 93.2, '2026-04-22', '2026-05-10', '2022-09-08', 'Active', 'KS-LAP-IM1S-78234'),
  m('Harmonic Scalpel', 'Ethicon (J&J)', 'Gen11', 'ot', 'operational', 'OT Complex, Room OT-2', 97.5, '2026-03-30', '2026-06-30', '2023-05-20', 'Active', 'ETH-HS-G11-90156'),

  // ── ICU / Critical Care ──
  m('ICU Ventilator', 'Hamilton Medical', 'C6', 'icu', 'operational', 'ICU, Bed Bay 1-4', 98.2, '2026-04-08', '2026-07-08', '2023-01-10', 'Active', 'HAM-VT-C6-22341'),
  m('ICU Ventilator #2', 'Hamilton Medical', 'C6', 'icu', 'operational', 'ICU, Bed Bay 5-8', 97.9, '2026-04-08', '2026-07-08', '2023-01-10', 'Active', 'HAM-VT-C6-22342'),
  m('ECMO Machine', 'Getinge', 'Cardiohelp', 'icu', 'standby', 'ICU, Room ICU-Isolation', 99.5, '2026-04-12', '2026-07-12', '2024-03-05', 'Active', 'GET-ECMO-CH-10023'),
  m('Dialysis Machine', 'Fresenius', '5008S CorDiax', 'icu', 'operational', 'Dialysis Unit, Room D-101', 96.7, '2026-03-28', '2026-06-28', '2022-06-15', 'Active', 'FRE-DL-5008-45678'),
  m('IABP', 'Maquet (Getinge)', 'Sensation Plus', 'icu', 'standby', 'ICU, Nurse Station', 99.8, '2026-04-15', '2026-07-15', '2023-08-20', 'Active', 'MAQ-IABP-SP-33201'),
  m('Multi-Para Monitor', 'Philips', 'IntelliVue MX800', 'icu', 'operational', 'ICU, Central Station', 98.8, '2026-04-01', '2026-07-01', '2022-12-01', 'Active', 'PHI-MP-MX800-67890'),
  m('Syringe Pump Bank', 'B. Braun', 'Perfusor Space', 'icu', 'operational', 'ICU, All Bed Bays', 99.2, '2026-03-15', '2026-06-15', '2023-04-10', 'Active', 'BBR-SP-PERF-12345'),
  m('Infusion Pump', 'Baxter', 'Sigma Spectrum', 'icu', 'operational', 'ICU, All Bed Bays', 98.5, '2026-03-20', '2026-06-20', '2023-02-28', 'Active', 'BAX-IP-SIG-78901'),
  m('Hypothermia System', 'BD (Bard)', 'Arctic Sun 5000', 'icu', 'calibration', 'ICU, Room ICU-Isolation', 95.1, '2026-04-18', '2026-05-18', '2024-01-22', 'Active', 'BD-HYP-AS5K-56234'),

  // ── Emergency ──
  m('Transport Ventilator', 'Dräger', 'Oxylog 3000+', 'emergency', 'operational', 'ED, Resus Bay', 97.6, '2026-04-05', '2026-07-05', '2022-10-15', 'Active', 'DRA-TV-OX3K-33456'),
  m('Emergency Monitor', 'GE Healthcare', 'CARESCAPE B650', 'emergency', 'operational', 'ED, Trauma Bay 1', 98.3, '2026-03-25', '2026-06-25', '2023-03-08', 'Active', 'GE-EM-B650-44567'),
  m('Portable Ultrasound', 'Butterfly Network', 'iQ+', 'emergency', 'operational', 'ED, POCUS Station', 96.9, '2026-04-10', '2026-07-10', '2024-02-14', 'Active', 'BUT-US-IQP-11234'),
  m('Crash Cart Defibrillator', 'Philips', 'HeartStart MRx', 'emergency', 'operational', 'ED, Crash Cart Alpha', 99.7, '2026-04-15', '2026-07-15', '2022-08-30', 'Active', 'PHI-DF-MRX-55678'),
  m('Automated CPR Device', 'Stryker (Physio-Control)', 'LUCAS 3', 'emergency', 'standby', 'ED, Resus Bay', 99.9, '2026-03-30', '2026-06-30', '2023-09-12', 'Active', 'STR-CPR-LU3-22345'),
  m('Portable X-Ray', 'Shimadzu', 'MobileDaRt Evolution', 'emergency', 'offline', 'ED, Corridor Storage', 88.5, '2026-02-15', '2026-04-28', '2021-04-20', 'Expired', 'SHI-PXR-MDE-67890'),
  m('Trauma Stretcher', 'Stryker', 'Power-PRO XT', 'emergency', 'operational', 'ED, Bay 1-4', 98.0, '2026-03-10', '2026-09-10', '2023-01-05', 'Active', 'STR-TS-PPXT-89012'),

  // ── Laboratory / Pathology ──
  m('Hematology Analyzer', 'Sysmex', 'XN-1000', 'laboratory', 'operational', '2nd Floor, Lab Room L-201', 98.6, '2026-04-05', '2026-07-05', '2022-07-12', 'Active', 'SYS-HA-XN1K-34567'),
  m('Chemistry Analyzer', 'Beckman Coulter', 'AU5800', 'laboratory', 'operational', '2nd Floor, Lab Room L-202', 97.8, '2026-03-28', '2026-06-28', '2022-03-18', 'Active', 'BEC-CA-AU58-45678'),
  m('Blood Gas Analyzer', 'Radiometer', 'ABL90 FLEX Plus', 'laboratory', 'operational', '2nd Floor, Lab Room L-203', 99.0, '2026-04-10', '2026-07-10', '2023-06-25', 'Active', 'RAD-BGA-ABL9-56789'),
  m('Immunoassay System', 'Abbott', 'ARCHITECT i2000SR', 'laboratory', 'maintenance', '2nd Floor, Lab Room L-204', 94.3, '2026-04-20', '2026-05-05', '2022-09-30', 'Active', 'ABB-IA-i2K-67890'),
  m('Coagulation Analyzer', 'Stago', 'STA Compact Max', 'laboratory', 'operational', '2nd Floor, Lab Room L-205', 97.5, '2026-03-15', '2026-06-15', '2023-02-14', 'Active', 'STA-COA-SCM-78901'),
  m('Centrifuge', 'Eppendorf', '5804 R', 'laboratory', 'operational', '2nd Floor, Lab Room L-201', 98.9, '2026-02-20', '2026-08-20', '2021-12-10', 'Expired', 'EPP-CF-5804-89012'),
  m('PCR Thermal Cycler', 'Bio-Rad', 'CFX96 Touch', 'laboratory', 'operational', '2nd Floor, Molecular Lab L-210', 97.2, '2026-04-01', '2026-07-01', '2023-11-08', 'Active', 'BIO-PCR-CFX-90123'),

  // ── Pharmacy & Cold Chain ──
  m('Automated Dispensing Cabinet', 'BD', 'Pyxis MedStation ES', 'pharmacy', 'operational', '1st Floor, Pharmacy P-101', 99.3, '2026-04-12', '2026-07-12', '2023-05-15', 'Active', 'BD-ADC-PYX-12345'),
  m('Cold Storage Unit (-20°C)', 'Thermo Scientific', 'TSX Series', 'pharmacy', 'operational', '1st Floor, Pharmacy P-102', 99.8, '2026-03-20', '2026-06-20', '2022-08-22', 'Active', 'THE-CS-TSX-23456'),
  m('Blood Bank Refrigerator', 'Helmer Scientific', 'iB125', 'pharmacy', 'operational', 'Blood Bank, Room BB-01', 99.9, '2026-04-05', '2026-07-05', '2023-01-30', 'Active', 'HEL-BBR-iB1-34567'),
  m('Laminar Air Flow Hood', 'Esco', 'Airstream Gen 3', 'pharmacy', 'operational', '1st Floor, Pharmacy P-103', 98.5, '2026-03-10', '2026-06-10', '2022-11-18', 'Active', 'ESC-LAF-AG3-45678'),
  m('Drug Compounding System', 'BD', 'IV.STATION ONCO', 'pharmacy', 'maintenance', '1st Floor, Pharmacy P-104', 93.7, '2026-04-18', '2026-05-02', '2024-02-10', 'Active', 'BD-DCS-IVS-56789'),

  // ── Cardiology / Cath Lab ──
  m('12-Lead ECG Machine', 'GE Healthcare', 'MAC 2000', 'cardiology', 'operational', '1st Floor, Cardio C-101', 98.7, '2026-03-25', '2026-06-25', '2022-05-20', 'Active', 'GE-ECG-MAC2-67890'),
  m('Echocardiography System', 'Philips', 'EPIQ CVx', 'cardiology', 'operational', '1st Floor, Echo Lab C-105', 97.9, '2026-04-08', '2026-07-08', '2023-04-12', 'Active', 'PHI-ECHO-CVX-78901'),
  m('Cath Lab System', 'Siemens', 'Artis Pheno', 'cardiology', 'operational', '1st Floor, Cath Lab C-110', 96.5, '2026-04-01', '2026-07-01', '2023-09-25', 'Active', 'SIE-CL-ARTP-89012'),
  m('Treadmill TMT', 'Schiller', 'AT-104 PC', 'cardiology', 'operational', '1st Floor, Cardio C-102', 97.3, '2026-03-15', '2026-06-15', '2022-02-08', 'Active', 'SCH-TMT-AT1-90123'),
  m('Holter Monitor System', 'Mortara (Baxter)', 'H12+', 'cardiology', 'operational', '1st Floor, Cardio C-103', 98.1, '2026-04-10', '2026-07-10', '2023-07-18', 'Active', 'MOR-HM-H12-01234'),
  m('Pacemaker Programmer', 'Abbott', 'Merlin PCS', 'cardiology', 'standby', '1st Floor, Cath Lab C-110', 99.6, '2026-03-30', '2026-06-30', '2024-01-05', 'Active', 'ABB-PP-MER-12345'),
  m('Cardiac Output Monitor', 'Edwards Lifesciences', 'Vigileo / FloTrac', 'cardiology', 'operational', 'ICU / Cath Lab', 98.4, '2026-04-15', '2026-07-15', '2023-03-22', 'Active', 'EDW-COM-VIG-23456'),

  // ── Physiotherapy & Rehab ──
  m('Shortwave Diathermy', 'Enraf-Nonius', 'Curapuls 970', 'physio', 'operational', '3rd Floor, Physio PT-301', 96.5, '2026-03-20', '2026-06-20', '2021-10-15', 'Expired', 'ENR-SWD-C97-34567'),
  m('Therapeutic Ultrasound', 'Chattanooga (DJO)', 'Intelect Legend XT', 'physio', 'operational', '3rd Floor, Physio PT-302', 97.8, '2026-04-05', '2026-07-05', '2022-04-28', 'Active', 'CHA-TUS-ILX-45678'),
  m('TENS Unit', 'Omron', 'HV-F128', 'physio', 'operational', '3rd Floor, Physio PT-301', 98.2, '2026-03-10', '2026-09-10', '2023-01-15', 'Active', 'OMR-TENS-HV1-56789'),
  m('Spinal Traction Unit', 'Chattanooga (DJO)', 'Triton DTS', 'physio', 'offline', '3rd Floor, Physio PT-303', 89.5, '2026-02-25', '2026-04-29', '2021-07-20', 'Expired', 'CHA-TRC-TDT-67890'),
  m('CPM Machine (Knee)', 'Kinetec', 'Spectra Essential', 'physio', 'operational', '3rd Floor, Physio PT-304', 97.0, '2026-04-12', '2026-07-12', '2022-12-05', 'Active', 'KIN-CPM-SPE-78901'),
];

export const getStatusCounts = () => {
  const counts = { operational: 0, maintenance: 0, offline: 0, calibration: 0, standby: 0, total: MACHINES.length };
  MACHINES.forEach(m => counts[m.status]++);
  counts.avgUptime = (MACHINES.reduce((s, m) => s + m.uptime, 0) / MACHINES.length).toFixed(1);
  return counts;
};

export const getDeptCounts = () => {
  const counts = {};
  MACHINES.forEach(m => { counts[m.department] = (counts[m.department] || 0) + 1; });
  return counts;
};
