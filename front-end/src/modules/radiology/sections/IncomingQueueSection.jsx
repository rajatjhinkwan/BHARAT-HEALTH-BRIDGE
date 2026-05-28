import { useMemo } from 'react';
import { useRadiologyStore } from '../store/radiologyStore';
import { useRadiologyData } from '../hooks/useRadiologyData';
import { ImagingQueueCard } from '../components/queue/ImagingQueueCard';
import { QueueSkeleton } from '../../laboratory/components/queue/QueueSkeleton';
import { Button } from '../../laboratory/components/ui/button';

export function IncomingQueueSection() {
  const { refresh } = useRadiologyData();
  const { orders, search, filterPriority, filterModality, sortBy, loading, machines } = useRadiologyStore();

  const filtered = useMemo(() => {
    let list = orders.filter((o) => !['Completed', 'Verified', 'Critical', 'Rejected'].includes(o.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.patientName?.toLowerCase().includes(q) ||
          o.mrn?.toLowerCase().includes(q) ||
          o.orderId?.toLowerCase().includes(q) ||
          o.tokenNumber?.toLowerCase().includes(q)
      );
    }
    if (filterPriority !== 'all') list = list.filter((o) => o.priority === filterPriority);
    if (filterModality !== 'all') list = list.filter((o) => o.type === filterModality);
    const rank = { Emergency: 0, Urgent: 1, Normal: 2 };
    list.sort((a, b) => {
      if (sortBy === 'priority') return (rank[a.priority] ?? 2) - (rank[b.priority] ?? 2);
      return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
    });
    return list;
  }, [orders, search, filterPriority, filterModality, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Incoming Imaging Queue</h1>
          <p className="text-[var(--text-muted)]">{filtered.length} active orders · Real-time from EMR</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refresh()}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? [1, 2, 3].map((n) => <QueueSkeleton key={n} />)
          : filtered.map((o, i) => (
              <ImagingQueueCard key={`${o.patientId}-${o.orderIndex}`} order={o} index={i} onAction={refresh} machines={machines} />
            ))}
      </div>
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-[var(--text-muted)]">No pending imaging orders. Orders from EMR appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
