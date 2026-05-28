import { useRadiologyStore } from '../store/radiologyStore';
import { ImagingQueueCard } from '../components/queue/ImagingQueueCard';
import { QueueSkeleton } from '../../laboratory/components/queue/QueueSkeleton';

export function CompletedSection() {
  const { orders, loading } = useRadiologyStore();
  const list = orders.filter((o) => ['Completed', 'Verified', 'Critical'].includes(o.status));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Completed Reports</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? [1, 2].map((n) => <QueueSkeleton key={n} compact />)
          : list.map((o, i) => <ImagingQueueCard key={`${o.patientId}-${i}`} order={o} index={i} compact />)}
      </div>
      {!loading && list.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-12">No finalized reports yet today.</p>
      )}
    </div>
  );
}
