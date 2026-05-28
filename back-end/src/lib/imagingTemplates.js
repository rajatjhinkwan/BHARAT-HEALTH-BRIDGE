/** Imaging modality templates — body parts, turnaround, and report fields */

export const IMAGING_MODALITIES = [
  {
    id: 'x-ray',
    type: 'X-RAY',
    name: 'Digital X-Ray',
    aliases: ['X-RAY', 'XRAY', 'X Ray'],
    turnaroundMinutes: 30,
    bodyParts: ['Chest', 'Abdomen', 'Spine', 'Pelvis', 'Skull', 'Extremity', 'Knee', 'Hand'],
    machines: ['XR-001', 'XR-002'],
  },
  {
    id: 'ct',
    type: 'CT',
    name: 'CT Scan',
    aliases: ['CT', 'CT_SCAN', 'CT Scan'],
    turnaroundMinutes: 60,
    bodyParts: ['Brain', 'Chest', 'Abdomen', 'Pelvis', 'Spine', 'Neck', 'Sinuses'],
    machines: ['CT-001', 'CT-002'],
    contrastOption: true,
  },
  {
    id: 'mri',
    type: 'MRI',
    name: 'MRI',
    aliases: ['MRI', 'MR'],
    turnaroundMinutes: 90,
    bodyParts: ['Brain', 'Spine', 'Knee', 'Shoulder', 'Abdomen', 'Pelvis', 'Cardiac'],
    machines: ['MRI-001'],
    contrastOption: true,
  },
  {
    id: 'ultrasound',
    type: 'ULTRASOUND',
    name: 'Ultrasound',
    aliases: ['ULTRASOUND', 'USG', 'SONOGRAPHY'],
    turnaroundMinutes: 45,
    bodyParts: ['Abdomen', 'Pelvis', 'Thyroid', 'Obstetric', 'Breast', 'Doppler Lower Limb'],
    machines: ['US-001', 'US-002'],
  },
];

export const IMAGING_REPORT_FIELDS = {
  'X-RAY': [
    { key: 'technique', label: 'Technique', type: 'text' },
    { key: 'findings', label: 'Findings', type: 'textarea' },
    { key: 'impression', label: 'Impression', type: 'textarea' },
    { key: 'recommendation', label: 'Recommendation', type: 'textarea' },
  ],
  CT: [
    { key: 'technique', label: 'Technique / Protocol', type: 'text' },
    { key: 'findings', label: 'Findings', type: 'textarea' },
    { key: 'impression', label: 'Impression', type: 'textarea' },
    { key: 'recommendation', label: 'Recommendation', type: 'textarea' },
  ],
  MRI: [
    { key: 'technique', label: 'Sequences / Protocol', type: 'text' },
    { key: 'findings', label: 'Findings', type: 'textarea' },
    { key: 'impression', label: 'Impression', type: 'textarea' },
    { key: 'recommendation', label: 'Recommendation', type: 'textarea' },
  ],
  ULTRASOUND: [
    { key: 'technique', label: 'Technique', type: 'text' },
    { key: 'findings', label: 'Findings', type: 'textarea' },
    { key: 'impression', label: 'Impression', type: 'textarea' },
    { key: 'recommendation', label: 'Recommendation', type: 'textarea' },
  ],
};

export function normalizeModalityType(input) {
  if (!input) return 'X-RAY';
  const upper = String(input).toUpperCase().replace(/\s+/g, '');
  if (upper === 'CT_SCAN' || upper === 'CT') return 'CT';
  if (upper === 'X-RAY' || upper === 'XRAY') return 'X-RAY';
  if (upper === 'MRI' || upper === 'MR') return 'MRI';
  if (upper === 'ULTRASOUND' || upper === 'USG') return 'ULTRASOUND';
  return 'X-RAY';
}

export function resolveModality(type) {
  const normalized = normalizeModalityType(type);
  return IMAGING_MODALITIES.find((m) => m.type === normalized) || IMAGING_MODALITIES[0];
}

export function medicalHistoryTypeForModality(type) {
  const t = normalizeModalityType(type);
  if (t === 'MRI') return 'mri';
  if (t === 'CT') return 'ct_scan';
  if (t === 'X-RAY') return 'x_ray';
  return 'ultrasound';
}

export function pendingStatusForModality(type) {
  const t = normalizeModalityType(type);
  if (t === 'X-RAY') return 'XRAY PENDING';
  return `${t} PENDING`;
}
