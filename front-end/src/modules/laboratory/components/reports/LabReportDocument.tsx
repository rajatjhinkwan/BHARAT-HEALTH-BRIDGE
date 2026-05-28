import type { LabOrder } from '../../types/lab';
import { getTemplatesForOrder } from '../../lib/formEngine';
import { orderKey, useLabStore } from '../../store/labStore';

export function LabReportDocument({ order }: { order: LabOrder }) {
  const draftMetrics = useLabStore().getDraftMetrics(orderKey(order.patientId, order.orderIndex));
  const metrics = order.metrics || draftMetrics || {};
  const templates = getTemplatesForOrder(order.tests);

  return (
    <div
      id="lab-print-report"
      className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 print:shadow-none print:border-none print:p-0"
      style={{ colorScheme: 'light' }}
    >
      {/* Premium Clinical Panel Header */}
      <div className="mb-6 border-b-2 border-blue-600 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-blue-600 font-sans uppercase">
              Bharat Health Bridge
            </h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-wider font-sans uppercase">
              Department of Pathology & Laboratory Medicine
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 font-mono">
              ORDER ID: {order.orderId || `ORD-${order.orderIndex}-${order.patientId.slice(0, 5)}`.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Patient and Doctor Clinical Metadata Panel */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100 text-[11px] font-sans">
          <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
            <span className="font-semibold text-slate-500 uppercase">Patient Name:</span>
            <span className="font-bold text-slate-800">{order.patientName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
            <span className="font-semibold text-slate-500 uppercase">UHID / MRN:</span>
            <span className="font-bold text-slate-800 font-mono">{order.mrn}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500 uppercase">Ref. Doctor:</span>
            <span className="font-bold text-slate-800">{order.assignedDoctor || order.doctorName || 'Dr. Sharma'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500 uppercase">Report Date:</span>
            <span className="font-bold text-slate-800">
              {order.orderDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Parameters Tables */}
      <div className="space-y-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-bold text-slate-700 tracking-wide uppercase font-sans">
                {tpl.name}
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">
                Specimen: {tpl.sampleType}
              </span>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-650">
                    <th className="p-3 text-left font-bold w-1/3">Test Parameter</th>
                    <th className="p-3 text-center font-bold w-1/6">Observed Result</th>
                    <th className="p-3 text-center font-bold w-1/6">Unit</th>
                    <th className="p-3 text-left font-bold w-1/3">Biological Reference Interval</th>
                  </tr>
                </thead>
                <tbody>
                  {tpl.fields.map((f) => (
                    <tr key={f.key} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      <td className="p-3 text-left font-medium text-slate-800">{f.label}</td>
                      <td className="p-3 text-center font-black text-slate-900">{metrics[tpl.id]?.[f.key] ?? '—'}</td>
                      <td className="p-3 text-center font-medium text-slate-500">{f.unit || '—'}</td>
                      <td className="p-3 text-left font-medium text-slate-600">
                        {f.refLow != null && f.refHigh != null ? `${f.refLow} – ${f.refHigh}` : f.refText || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
