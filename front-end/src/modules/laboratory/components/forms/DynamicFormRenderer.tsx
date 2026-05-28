import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, AlertTriangle } from 'lucide-react';
import type { LabOrder } from '../../types/lab';
import { getTemplatesForOrder, buildZodSchema, evaluateField, getReferenceText, buildInterpretationSummary, statusColor } from '../../lib/formEngine';
import { orderKey, useLabStore } from '../../store/labStore';
import { submitLabResults } from '../../api/labApi';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface Props {
  order: LabOrder;
  onSubmitted?: () => void;
}

export function DynamicFormRenderer({ order, onSubmitted }: Props) {
  const key = orderKey(order.patientId, order.orderIndex);
  const { getDraftMetrics, setDraftMetric, pushActivity } = useLabStore();
  const templates = useMemo(() => getTemplatesForOrder(order.tests), [order.tests]);
  const schema = useMemo(() => buildZodSchema(templates), [templates]);
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(templates.map((t) => [t.id, true]))
  );
  const [remarks, setRemarks] = useState<string[]>([]);
  const [isCritical, setIsCritical] = useState(false);
  const [saving, setSaving] = useState(false);

  const draft = getDraftMetrics(key);

  const { register, watch, setValue, handleSubmit } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: draft,
    mode: 'onChange',
  });

  const values = watch();

  useEffect(() => {
    const t = setTimeout(() => {
      const { remarks: r, isCritical: c } = buildInterpretationSummary(values as Record<string, Record<string, string | number>>);
      setRemarks(r);
      setIsCritical(c);
    }, 200);
    return () => clearTimeout(t);
  }, [values]);

  const togglePanel = (id: string) => setOpenPanels((p) => ({ ...p, [id]: !p[id] }));

  const applyNormal = (testId: string, fieldKey: string, preset?: number) => {
    if (preset != null) {
      setValue(`${testId}.${fieldKey}`, preset);
      setDraftMetric(key, testId, fieldKey, preset);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (!order.patientId.startsWith('mock')) {
        await submitLabResults(order.patientId, order.orderIndex, data as Record<string, Record<string, string | number>>);
      }
      pushActivity(`Report finalized for ${order.patientName}`, isCritical ? 'critical' : 'success');
      onSubmitted?.();
    } catch (e) {
      console.error(e);
      alert('Failed to submit — check connection');
    } finally {
      setSaving(false);
    }
  });

  if (templates.length === 0) {
    return (
      <Card className="p-8 text-center text-[var(--text-muted)]">
        No recognized test templates for this order. Add CBC, LFT, KFT, Thyroid, Lipid, Glucose, or Dengue tests.
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isCritical && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lab-critical-pulse flex items-center gap-3 rounded-xl border border-red-500/60 bg-red-500/15 px-4 py-3 text-red-400"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">Critical values detected — physician notification will be triggered on submit.</span>
        </motion.div>
      )}

      {templates.map((tpl) => (
        <Card key={tpl.id} className="overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[var(--surface-hover)]"
            onClick={() => togglePanel(tpl.id)}
          >
            <div>
              <CardTitle className="text-base">{tpl.name}</CardTitle>
              <p className="text-xs text-[var(--text-muted)]">{tpl.category} · {tpl.sampleType}</p>
            </div>
            <ChevronDown className={cn('h-5 w-5 transition-transform', openPanels[tpl.id] && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openPanels[tpl.id] && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {tpl.fields.map((field) => {
                    const val = values?.[tpl.id]?.[field.key];
                    const ev = evaluateField(field, val);
                    const fieldName = `${tpl.id}.${field.key}`;

                    return (
                      <div
                        key={field.key}
                        className={cn(
                          'rounded-xl border-2 p-4 transition-all duration-300 shadow-sm hover:shadow-md',
                          statusColor(ev.status)
                        )}
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-dashed border-current/10 pb-1.5">
                          <label className="font-bold text-[var(--text-main)] tracking-tight text-sm">
                            {field.label}
                          </label>
                          {field.unit && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/5 text-[var(--text-muted)]">
                              {field.unit}
                            </span>
                          )}
                        </div>
                        {field.type === 'select' ? (
                          <select
                            className={cn(
                              'h-12 w-full rounded-xl border-2 px-3 transition-all font-semibold text-sm',
                              ev.status === 'critical' && 'border-red-500 bg-red-500/5 text-red-500 focus:ring-red-500/30',
                              ev.status === 'low' && 'border-amber-500 bg-amber-500/5 text-amber-500 focus:ring-amber-500/30',
                              ev.status === 'high' && 'border-amber-500 bg-amber-500/5 text-amber-500 focus:ring-amber-500/30',
                              ev.status === 'normal' && 'border-emerald-500 bg-emerald-500/5 text-emerald-500 focus:ring-emerald-500/30',
                              ev.status === 'empty' && 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-main)]'
                            )}
                            {...register(fieldName)}
                            onChange={(e) => {
                              setDraftMetric(key, tpl.id, field.key, e.target.value);
                            }}
                          >
                            <option value="">— Select Result —</option>
                            {field.options?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="any"
                              className={cn(
                                'text-xl font-bold tabular-nums h-12 rounded-xl transition-all border-2 flex-1 shadow-inner',
                                ev.status === 'critical' && 'border-red-500 bg-red-500/5 text-red-500 focus-visible:ring-red-500/30',
                                ev.status === 'low' && 'border-amber-500 bg-amber-500/5 text-amber-500 focus-visible:ring-amber-500/30',
                                ev.status === 'high' && 'border-amber-500 bg-amber-500/5 text-amber-500 focus-visible:ring-amber-500/30',
                                ev.status === 'normal' && 'border-emerald-500 bg-emerald-500/5 text-emerald-500 focus-visible:ring-emerald-500/30',
                                ev.status === 'empty' && 'border-[var(--border)] focus-visible:ring-[var(--primary)] text-[var(--text-main)] bg-[var(--input-bg)]'
                              )}
                              {...register(fieldName, {
                                valueAsNumber: true,
                                onChange: (e) =>
                                  setDraftMetric(key, tpl.id, field.key, e.target.value),
                              })}
                            />
                            {field.normalPreset != null && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="shrink-0 rounded-xl px-4 font-bold border border-dashed border-[var(--border)]"
                                onClick={() => applyNormal(tpl.id, field.key, field.normalPreset)}
                              >
                                Preset Normal
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
                          <span>Ref: {getReferenceText(field)} {field.unit}</span>
                          {ev.interpretation && (
                            <span className="font-extrabold text-[var(--danger)] animate-pulse uppercase tracking-wider text-[9px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              {ev.interpretation}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}

      <Card className="border-[var(--primary)]/30 bg-[var(--primary-light)]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            Auto-interpretation (supportive only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-main)]">
            {remarks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={saving} className="min-w-[200px]">
          {saving ? 'Generating report…' : 'Finalize & Send to Doctor'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          Print Preview
        </Button>
      </div>
    </form>
  );
}
