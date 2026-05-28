/** Canonical lab test templates — drives dynamic form generation on client & server */
export const LAB_TEST_TEMPLATES = {
  CBC: {
    id: 'CBC',
    name: 'Complete Blood Count',
    aliases: ['cbc', 'complete blood count', 'blood count'],
    category: 'Hematology',
    turnaroundMinutes: 45,
    sampleType: 'EDTA Whole Blood',
    fields: [
      { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', type: 'number', min: 0, max: 25, refLow: 13, refHigh: 17, criticalLow: 7, criticalHigh: 20, normalPreset: 14.2 },
      { key: 'rbc', label: 'RBC Count', unit: 'million/µL', type: 'number', min: 0, max: 10, refLow: 4.5, refHigh: 5.5, criticalLow: 2.5, criticalHigh: 7, normalPreset: 4.8 },
      { key: 'wbc', label: 'WBC Count', unit: '/µL', type: 'number', min: 0, max: 50000, refLow: 4000, refHigh: 11000, criticalLow: 1000, criticalHigh: 30000, normalPreset: 7500 },
      { key: 'platelets', label: 'Platelet Count', unit: '/µL', type: 'number', min: 0, max: 1000000, refLow: 150000, refHigh: 400000, criticalLow: 50000, criticalHigh: 1000000, normalPreset: 250000 },
      { key: 'hematocrit', label: 'Hematocrit', unit: '%', type: 'number', min: 0, max: 70, refLow: 40, refHigh: 50, criticalLow: 20, criticalHigh: 60, normalPreset: 42 },
      { key: 'mcv', label: 'MCV', unit: 'fL', type: 'number', min: 0, max: 150, refLow: 80, refHigh: 100, normalPreset: 90 },
      { key: 'mch', label: 'MCH', unit: 'pg', type: 'number', min: 0, max: 50, refLow: 27, refHigh: 33, normalPreset: 30 },
      { key: 'mchc', label: 'MCHC', unit: 'g/dL', type: 'number', min: 0, max: 50, refLow: 32, refHigh: 36, normalPreset: 34 },
    ],
  },
  LFT: {
    id: 'LFT',
    name: 'Liver Function Test',
    aliases: ['lft', 'liver function', 'liver panel'],
    category: 'Biochemistry',
    turnaroundMinutes: 60,
    sampleType: 'Serum',
    fields: [
      { key: 'bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', type: 'number', min: 0, max: 30, refLow: 0.1, refHigh: 1.2, criticalHigh: 5, normalPreset: 0.8 },
      { key: 'sgot', label: 'SGOT (AST)', unit: 'U/L', type: 'number', min: 0, max: 500, refLow: 5, refHigh: 40, criticalHigh: 200, normalPreset: 22 },
      { key: 'sgpt', label: 'SGPT (ALT)', unit: 'U/L', type: 'number', min: 0, max: 500, refLow: 7, refHigh: 56, criticalHigh: 200, normalPreset: 24 },
      { key: 'albumin', label: 'Albumin', unit: 'g/dL', type: 'number', min: 0, max: 10, refLow: 3.5, refHigh: 5.5, criticalLow: 2, normalPreset: 4.2 },
      { key: 'totalProtein', label: 'Total Protein', unit: 'g/dL', type: 'number', min: 0, max: 15, refLow: 6, refHigh: 8.3, normalPreset: 7.1 },
    ],
  },
  KFT: {
    id: 'KFT',
    name: 'Kidney Function Test',
    aliases: ['kft', 'kidney function', 'renal panel', 'rft'],
    category: 'Biochemistry',
    turnaroundMinutes: 60,
    sampleType: 'Serum',
    fields: [
      { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', type: 'number', min: 0, max: 20, refLow: 0.6, refHigh: 1.2, criticalHigh: 5, normalPreset: 0.9 },
      { key: 'urea', label: 'Blood Urea', unit: 'mg/dL', type: 'number', min: 0, max: 200, refLow: 15, refHigh: 45, criticalHigh: 100, normalPreset: 28 },
      { key: 'sodium', label: 'Sodium', unit: 'mEq/L', type: 'number', min: 0, max: 200, refLow: 136, refHigh: 145, criticalLow: 120, criticalHigh: 160, normalPreset: 140 },
      { key: 'potassium', label: 'Potassium', unit: 'mEq/L', type: 'number', min: 0, max: 10, refLow: 3.5, refHigh: 5.1, criticalLow: 2.5, criticalHigh: 6.5, normalPreset: 4.2 },
    ],
  },
  THYROID: {
    id: 'THYROID',
    name: 'Thyroid Profile',
    aliases: ['thyroid', 't3 t4 tsh', 'thyroid profile'],
    category: 'Endocrinology',
    turnaroundMinutes: 90,
    sampleType: 'Serum',
    fields: [
      { key: 't3', label: 'T3', unit: 'ng/dL', type: 'number', min: 0, max: 500, refLow: 80, refHigh: 200, normalPreset: 120 },
      { key: 't4', label: 'T4', unit: 'µg/dL', type: 'number', min: 0, max: 30, refLow: 4.5, refHigh: 12, normalPreset: 8 },
      { key: 'tsh', label: 'TSH', unit: 'mIU/L', type: 'number', min: 0, max: 50, refLow: 0.4, refHigh: 4, criticalHigh: 10, normalPreset: 2.1 },
    ],
  },
  LIPID: {
    id: 'LIPID',
    name: 'Lipid Profile',
    aliases: ['lipid', 'lipid profile', 'cholesterol panel'],
    category: 'Biochemistry',
    turnaroundMinutes: 60,
    sampleType: 'Serum (Fasting)',
    fields: [
      { key: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', type: 'number', min: 0, max: 150, refLow: 40, refHigh: 60, criticalLow: 25, normalPreset: 52 },
      { key: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', type: 'number', min: 0, max: 300, refLow: 0, refHigh: 100, criticalHigh: 190, normalPreset: 95 },
      { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', type: 'number', min: 0, max: 1000, refLow: 0, refHigh: 150, criticalHigh: 500, normalPreset: 110 },
      { key: 'totalCholesterol', label: 'Total Cholesterol', unit: 'mg/dL', type: 'number', min: 0, max: 400, refLow: 0, refHigh: 200, criticalHigh: 300, normalPreset: 175 },
    ],
  },
  GLUCOSE: {
    id: 'GLUCOSE',
    name: 'Blood Glucose',
    aliases: ['glucose', 'blood sugar', 'fbs', 'rbs', 'hba1c'],
    category: 'Biochemistry',
    turnaroundMinutes: 30,
    sampleType: 'Fluoride Plasma / Serum',
    fields: [
      { key: 'fastingGlucose', label: 'Fasting Glucose', unit: 'mg/dL', type: 'number', min: 0, max: 600, refLow: 70, refHigh: 100, criticalLow: 40, criticalHigh: 300, normalPreset: 92 },
      { key: 'randomGlucose', label: 'Random Glucose', unit: 'mg/dL', type: 'number', min: 0, max: 600, refLow: 70, refHigh: 140, criticalHigh: 300, normalPreset: 110 },
      { key: 'hba1c', label: 'HbA1c', unit: '%', type: 'number', min: 0, max: 20, refLow: 4, refHigh: 5.7, criticalHigh: 10, normalPreset: 5.4 },
    ],
  },
  DENGUE: {
    id: 'DENGUE',
    name: 'Dengue NS1 / IgM',
    aliases: ['dengue', 'ns1', 'dengue test'],
    category: 'Serology',
    turnaroundMinutes: 120,
    sampleType: 'Serum',
    fields: [
      { key: 'ns1', label: 'NS1 Antigen', unit: '', type: 'select', options: ['Negative', 'Positive'], refText: 'Negative', criticalValues: ['Positive'] },
      { key: 'igm', label: 'IgM', unit: '', type: 'select', options: ['Negative', 'Positive'], refText: 'Negative', criticalValues: ['Positive'] },
    ],
  },
};

export function resolveTestTemplates(testNames = []) {
  const matched = new Map();
  for (const raw of testNames) {
    const t = String(raw).toLowerCase();
    for (const tpl of Object.values(LAB_TEST_TEMPLATES)) {
      if (
        tpl.aliases.some((a) => t.includes(a)) ||
        t.includes(tpl.id.toLowerCase()) ||
        t.includes(tpl.name.toLowerCase())
      ) {
        matched.set(tpl.id, tpl);
      }
    }
  }
  return [...matched.values()];
}

export function evaluateField(field, value) {
  if (value === '' || value == null) return { status: 'empty', interpretation: null };
  if (field.type === 'select') {
    const critical = field.criticalValues?.includes(value);
    return {
      status: critical ? 'critical' : value === 'Positive' ? 'abnormal' : 'normal',
      interpretation: critical ? `${field.label}: Positive — requires clinical correlation.` : null,
    };
  }
  const num = Number(value);
  if (Number.isNaN(num)) return { status: 'invalid', interpretation: null };
  if (field.criticalLow != null && num < field.criticalLow) return { status: 'critical', interpretation: `Critically low ${field.label}.` };
  if (field.criticalHigh != null && num > field.criticalHigh) return { status: 'critical', interpretation: `Critically high ${field.label}.` };
  if (field.refLow != null && num < field.refLow) return { status: 'low', interpretation: `Below reference: ${field.label}.` };
  if (field.refHigh != null && num > field.refHigh) return { status: 'high', interpretation: `Above reference: ${field.label}.` };
  return { status: 'normal', interpretation: null };
}

export function buildInterpretationSummary(resultsByTest) {
  const remarks = [];
  const flags = { anemia: false, liver: false, renal: false, infection: false, lipid: false, glucose: false, dengue: false };

  const cbc = resultsByTest.CBC;
  if (cbc) {
    const hb = Number(cbc.hemoglobin);
    const plt = Number(cbc.platelets);
    const wbc = Number(cbc.wbc);
    if (!Number.isNaN(hb) && hb < 12) { remarks.push('Mild anemia detected.'); flags.anemia = true; }
    if (!Number.isNaN(plt) && plt < 50000) { remarks.push('Thrombocytopenia — platelets critically low.'); flags.anemia = true; }
    if (!Number.isNaN(wbc) && wbc > 15000) { remarks.push('Elevated WBC — possible infection markers observed.'); flags.infection = true; }
  }

  const lft = resultsByTest.LFT;
  if (lft) {
    const ast = Number(lft.sgot);
    const alt = Number(lft.sgpt);
    if ((!Number.isNaN(ast) && ast > 40) || (!Number.isNaN(alt) && alt > 56)) {
      remarks.push('Elevated liver enzymes noted.');
      flags.liver = true;
    }
  }

  const kft = resultsByTest.KFT;
  if (kft) {
    const cr = Number(kft.creatinine);
    const k = Number(kft.potassium);
    if (!Number.isNaN(cr) && cr > 1.5) { remarks.push('Renal function parameters elevated.'); flags.renal = true; }
    if (!Number.isNaN(k) && k > 5.5) { remarks.push('Hyperkalemia — urgent clinical review suggested.'); flags.renal = true; }
  }

  const glu = resultsByTest.GLUCOSE;
  if (glu) {
    const fg = Number(glu.fastingGlucose);
    const rg = Number(glu.randomGlucose);
    if ((!Number.isNaN(fg) && fg > 126) || (!Number.isNaN(rg) && rg > 200)) {
      remarks.push('Hyperglycemia pattern observed.');
      flags.glucose = true;
    }
  }

  const lipid = resultsByTest.LIPID;
  if (lipid) {
    const ldl = Number(lipid.ldl);
    if (!Number.isNaN(ldl) && ldl > 130) { remarks.push('Dyslipidemia — elevated LDL.'); flags.lipid = true; }
  }

  const dengue = resultsByTest.DENGUE;
  if (dengue && (dengue.ns1 === 'Positive' || dengue.igm === 'Positive')) {
    remarks.push('Dengue serology positive — notify treating physician.');
    flags.dengue = true;
  }

  if (remarks.length === 0) remarks.push('All reported values within expected clinical ranges.');
  return { remarks, flags, isCritical: flags.dengue || flags.renal || flags.glucose };
}
