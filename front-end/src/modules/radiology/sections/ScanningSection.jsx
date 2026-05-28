import { useRadiologyStore } from '../store/radiologyStore';
import { useRadiologyData } from '../hooks/useRadiologyData';
import { ImagingQueueCard } from '../components/queue/ImagingQueueCard';
import { QueueSkeleton } from '../../laboratory/components/queue/QueueSkeleton';

export function ScanningSection() {
  const { refresh } = useRadiologyData();
  const { orders, loading, machines } = useRadiologyStore();
  const list = orders.filter((o) => ['In Progress', 'Scheduled', 'Accepted'].includes(o.status));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Active Scanning</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? [1, 2].map((n) => <QueueSkeleton key={n} />)
          : list.map((o, i) => (
              <ImagingQueueCard key={`${o.patientId}-${i}`} order={o} index={i} onAction={refresh} machines={machines} />
            ))}
      </div>
      {!loading && list.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-12 border border-dashed rounded-2xl">
          No scans in progress. Accept orders from Incoming Queue to begin.
        </p>
      )}
    </div>
  );
}
