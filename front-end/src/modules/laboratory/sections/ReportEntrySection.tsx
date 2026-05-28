import { useLabStore, orderKey } from '../store/labStore';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { LabReportDocument } from '../components/reports/LabReportDocument';
import { Card, CardContent } from '../components/ui/card';

export function ReportEntrySection() {
  const { orders, selectedOrderKey } = useLabStore();
  const order = orders.find((o) => orderKey(o.patientId, o.orderIndex) === selectedOrderKey)
    || orders.find((o) => o.status === 'Processing');

  if (!order) {
    return (
      <Card className="p-12 text-center">
        <p className="text-[var(--text-muted)]">Select a processing order from the queue to enter results.</p>
      </Card>
    );
  }

  // If the report is already completed or verified, render ONLY the clinical table report
  if (['Completed', 'Verified', 'Critical'].includes(order.status)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Finalized Report</h1>
            <p className="text-[var(--text-muted)]">
              {order.patientName} · {order.mrn} · View final pathology results
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            Print Report
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <LabReportDocument order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Report Entry</h1>
        <p className="text-[var(--text-muted)]">
          {order.patientName} · {order.mrn} · Enter results below to generate report table
        </p>
      </div>
      <DynamicFormRenderer order={order} />
      
      {/* Hidden print container containing ONLY the report table */}
      <div className="hidden print:block">
        <LabReportDocument order={order} />
      </div>
      
      {/* Crisp print preview - only the clinical table is shown inside */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-main)] no-print">Live Print Preview</h3>
        <div className="overflow-auto rounded-xl border border-slate-100 bg-white">
          <LabReportDocument order={order} />
        </div>
      </div>
    </div>
  );
}

