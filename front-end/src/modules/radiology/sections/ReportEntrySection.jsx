import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRadiologyStore, orderKey } from '../store/radiologyStore';
import { useRadiologyData } from '../hooks/useRadiologyData';
import { submitRadiologyReport } from '../api/radiologyApi';
import { Button } from '../../laboratory/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../laboratory/components/ui/card';

const REPORT_FIELDS = [
  { key: 'technique', label: 'Technique / Protocol' },
  { key: 'findings', label: 'Findings', multiline: true },
  { key: 'impression', label: 'Impression', multiline: true },
  { key: 'recommendation', label: 'Recommendation', multiline: true },
];

export function ReportEntrySection() {
  const { user } = useAuth();
  const { refresh } = useRadiologyData();
  const { orders, selectedOrderKey, selectOrder, draftFindings, setDraftFinding, pushActivity } = useRadiologyStore();

  const order = useMemo(() => {
    if (!selectedOrderKey) return orders.find((o) => o.status === 'Awaiting Report') || orders[0];
    const [pid, idx] = selectedOrderKey.split(':');
    return orders.find((o) => o.patientId === pid && String(o.orderIndex) === idx);
  }, [orders, selectedOrderKey]);

  const key = order ? orderKey(order.patientId, order.orderIndex) : '';
  const draft = draftFindings[key] || order?.findings || {};

  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center text-[var(--text-muted)]">
        Select an order from Incoming or Active Scanning to enter a radiology report.
      </div>
    );
  }

  const handleSubmit = async (markCritical = false) => {
    try {
      await submitRadiologyReport(order.patientId, order.orderIndex, draft, user?.name || 'Radiologist', {
        isCritical: markCritical,
        criticalFinding: markCritical ? draft.impression || 'Critical finding documented' : '',
      });
      pushActivity(`Report finalized: ${order.patientName}`, markCritical ? 'critical' : 'info');
      refresh();
    } catch (e) {
      alert('Failed to save report');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Radiology Report</h1>
        <p className="text-[var(--text-muted)]">
          {order.patientName} · {order.mrn} · {order.type} {order.bodyPart}
        </p>
      </div>

      {orders.filter((o) => o.status === 'Awaiting Report').length > 1 && (
        <select
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm w-full max-w-md"
          value={selectedOrderKey || ''}
          onChange={(e) => {
            const [pid, idx] = e.target.value.split(':');
            selectOrder(pid, Number(idx));
          }}
        >
          {orders
            .filter((o) => ['Awaiting Report', 'In Progress'].includes(o.status))
            .map((o) => (
              <option key={orderKey(o.patientId, o.orderIndex)} value={orderKey(o.patientId, o.orderIndex)}>
                {o.patientName} — {o.type} {o.bodyPart}
              </option>
            ))}
        </select>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Structured Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {REPORT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase text-[var(--text-muted)]">{f.label}</label>
              {f.multiline ? (
                <textarea
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm min-h-[100px]"
                  value={draft[f.key] || ''}
                  onChange={(e) => setDraftFinding(key, f.key, e.target.value)}
                />
              ) : (
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={draft[f.key] || ''}
                  onChange={(e) => setDraftFinding(key, f.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => handleSubmit(false)}>
              Finalize Report
            </Button>
            <Button variant="secondary" className="border-red-300 text-red-600" onClick={() => handleSubmit(true)}>
              Mark Critical & Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div id="rad-print-report" className="hidden print:block p-8 bg-white text-black">
        <h2 className="text-xl font-bold mb-4">Radiology Report — Bharat Health Bridge</h2>
        <p>
          <strong>Patient:</strong> {order.patientName} ({order.mrn})
        </p>
        <p>
          <strong>Study:</strong> {order.type} — {order.bodyPart}
        </p>
        {REPORT_FIELDS.map((f) => (
          <div key={f.key} className="mt-4">
            <h3 className="font-bold">{f.label}</h3>
            <p className="whitespace-pre-wrap">{draft[f.key] || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
