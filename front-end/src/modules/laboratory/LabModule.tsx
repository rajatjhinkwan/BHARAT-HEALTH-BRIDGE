import { AnimatePresence, motion } from 'framer-motion';
// @ts-ignore
import './lab.css';
import { LabHeader } from './components/layout/LabHeader';
import { useLabStore } from './store/labStore';
import { useLabData } from './hooks/useLabData';
import { LabDashboardSection } from './sections/LabDashboardSection';
import { IncomingQueueSection } from './sections/IncomingQueueSection';
import { SampleCollectionSection } from './sections/SampleCollectionSection';
import { ReportEntrySection } from './sections/ReportEntrySection';
import { LabAnalyticsSection } from './sections/LabAnalyticsSection';
import { QueueCard } from './components/queue/QueueCard';
import { QueueSkeleton } from './components/queue/QueueSkeleton';
import { Card, CardContent } from './components/ui/card';

function ProcessingSection() {
  const { orders, loading } = useLabStore();
  const { refresh } = useLabData();
  const list = orders.filter((o) => ['Processing', 'Sample Collected'].includes(o.status));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-main)]">Processing Queue</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          [1, 2].map((n) => <QueueSkeleton key={n} />)
        ) : (
          list.map((o, i) => <QueueCard key={`${o.patientId}-${i}`} order={o} index={i} onAction={refresh} />)
        )}
      </div>
      {!loading && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-[var(--surface)]/30 backdrop-blur-sm">
          <p className="text-[var(--text-muted)] text-sm mb-6">No specimens are currently in-process in the laboratory analyzer.</p>
          <div className="mx-auto max-w-md opacity-30 pointer-events-none">
            <QueueSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedSection() {
  const { orders, loading } = useLabStore();
  const list = orders.filter((o) => ['Completed', 'Verified', 'Critical'].includes(o.status));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-main)]">Completed Reports</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          [1, 2].map((n) => <QueueSkeleton key={n} compact />)
        ) : (
          list.map((o, i) => <QueueCard key={`${o.patientId}-${i}`} order={o} index={i} compact />)
        )}
      </div>
      {!loading && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-[var(--surface)]/30 backdrop-blur-sm">
          <p className="text-[var(--text-muted)] text-sm mb-6">No reports have been finalized today.</p>
          <div className="mx-auto max-w-md opacity-30 pointer-events-none">
            <QueueSkeleton compact />
          </div>
        </div>
      )}
    </div>
  );
}

const SECTIONS: Record<string, React.ReactNode> = {
  dashboard: <LabDashboardSection />,
  incoming: <IncomingQueueSection />,
  sample: <SampleCollectionSection />,
  processing: <ProcessingSection />,
  reports: <ReportEntrySection />,
  completed: <CompletedSection />,
  analytics: <LabAnalyticsSection />,
};

export default function LabModule() {
  const { section, loading, orders } = useLabStore();
  useLabData();

  const pending = orders.filter((o) => ['Pending', 'Accepted'].includes(o.status)).length;

  return (
    <div className="lab-module -mx-4 -mt-2 flex min-h-[calc(100vh-64px)] flex-col bg-[var(--background)] md:-mx-6">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <LabHeader />
          
          {/* Top Sticky Scrollable Pill Tabs Bar */}
          <div className="flex overflow-x-auto gap-2 p-3 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md sticky top-16 z-20 no-scrollbar shadow-sm">
            {(['dashboard', 'incoming', 'reports', 'completed'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => useLabStore.getState().setSection(id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  section === id
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--text-muted)] bg-[var(--surface-hover)]/30 hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>
                  {id === 'incoming' ? 'Incoming Orders' : id === 'reports' ? 'Report Entry' : id === 'completed' ? 'Completed' : id}
                </span>
                {id === 'incoming' && pending > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold transition-colors duration-200 ${section === id ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-[var(--danger)] text-white'}`}>
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading && (
              <div className="mb-4 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div
                  className="h-full bg-[var(--primary)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                {SECTIONS[section]}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

