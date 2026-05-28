import { z } from 'zod';
import type { FieldEvaluation, FieldStatus, LabFieldTemplate, LabTestTemplate } from '../types/lab';
import { resolveTestTemplates } from '../data/testTemplates';

export function evaluateField(field: LabFieldTemplate, value: string | number | undefined): FieldEvaluation {
  if (value === '' || value == null) return { status: 'empty', interpretation: null };
  if (field.type === 'select') {
    const critical = field.criticalValues?.includes(String(value));
    return {
      status: critical ? 'critical' : value === 'Positive' ? 'high' : 'normal',
      interpretation: critical ? `${field.label}: Positive — notify physician.` : null,
    };
  }
  const num = Number(value);
  if (Number.isNaN(num)) return { status: 'invalid', interpretation: null };
  if (field.criticalLow != null && num < field.criticalLow)
    return { status: 'critical', interpretation: `Critically low ${field.label}.` };
  if (field.criticalHigh != null && num > field.criticalHigh)
    return { status: 'critical', interpretation: `Critically high ${field.label}.` };
  if (field.refLow != null && num < field.refLow)
    return { status: 'low', interpretation: `Below reference: ${field.label}.` };
  if (field.refHigh != null && num > field.refHigh)
    return { status: 'high', interpretation: `Above reference: ${field.label}.` };
  return { status: 'normal', interpretation: null };
}

export function buildZodSchema(templates: LabTestTemplate[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const tpl of templates) {
    const inner: Record<string, z.ZodTypeAny> = {};
    for (const f of tpl.fields) {
      if (f.type === 'select') {
        inner[f.key] = z.enum((f.options || ['Negative', 'Positive']) as [string, ...string[]]).optional();
      } else {
        inner[f.key] = z.coerce.number().optional();
      }
    }
    shape[tpl.id] = z.object(inner);
  }
  return z.object(shape);
}

export function getReferenceText(field: LabFieldTemplate): string {
  if (field.refText) return field.refText;
  if (field.refLow != null && field.refHigh != null) return `${field.refLow}–${field.refHigh}`;
  if (field.refHigh != null) return `< ${field.refHigh}`;
  if (field.refLow != null) return `> ${field.refLow}`;
  return '—';
}

export function buildInterpretationSummary(metrics: Record<string, Record<string, string | number>>) {
  const remarks: string[] = [];
  let isCritical = false;

  const cbc = metrics.CBC;
  if (cbc) {
    const hb = Number(cbc.hemoglobin);
    const plt = Number(cbc.platelets);
    const wbc = Number(cbc.wbc);
    if (!Number.isNaN(hb) && hb < 12) remarks.push('Mild anemia detected.');
    if (!Number.isNaN(plt) && plt < 50000) {
      remarks.push('Thrombocytopenia — platelets critically low.');
      isCritical = true;
    }
    if (!Number.isNaN(wbc) && wbc > 15000) remarks.push('Possible infection markers observed.');
  }

  const lft = metrics.LFT;
  if (lft) {
    const ast = Number(lft.sgot);
    const alt = Number(lft.sgpt);
    if ((!Number.isNaN(ast) && ast > 40) || (!Number.isNaN(alt) && alt > 56))
      remarks.push('Elevated liver enzymes.');
  }

  const kft = metrics.KFT;
  if (kft) {
    const k = Number(kft.potassium);
    if (!Number.isNaN(k) && k > 5.5) {
      remarks.push('Hyperkalemia — urgent clinical review suggested.');
      isCritical = true;
    }
  }

  const glu = metrics.GLUCOSE;
  if (glu) {
    const fg = Number(glu.fastingGlucose);
    const rg = Number(glu.randomGlucose);
    if ((!Number.isNaN(fg) && fg > 300) || (!Number.isNaN(rg) && rg > 300)) {
      remarks.push('Severe hyperglycemia pattern observed.');
      isCritical = true;
    }
  }

  const dengue = metrics.DENGUE;
  if (dengue && (dengue.ns1 === 'Positive' || dengue.igm === 'Positive')) {
    remarks.push('Dengue serology positive — notify treating physician.');
    isCritical = true;
  }

  if (remarks.length === 0) remarks.push('All reported values within expected clinical ranges.');
  return { remarks, isCritical };
}

export function getTemplatesForOrder(tests: string[]) {
  return resolveTestTemplates(tests);
}

export function statusColor(status: FieldStatus): string {
  switch (status) {
    case 'critical':
      return 'border-red-500/80 bg-red-500/10 text-red-400 lab-critical-pulse';
    case 'low':
    case 'high':
      return 'border-amber-500/60 bg-amber-500/10 text-amber-400';
    case 'normal':
      return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
    default:
      return 'border-[var(--border)] bg-[var(--input-bg)]';
  }
}

export function priorityStyles(priority?: string) {
  switch (priority) {
    case 'Emergency':
      return { border: 'border-red-500/70', badge: 'bg-red-500/20 text-red-400', glow: 'var(--lab-glow-red)' };
    case 'Urgent':
      return { border: 'border-amber-500/60', badge: 'bg-amber-500/20 text-amber-400', glow: 'var(--lab-glow-orange)' };
    default:
      return { border: 'border-blue-500/40', badge: 'bg-blue-500/15 text-blue-400', glow: 'var(--lab-glow-blue)' };
  }
}
