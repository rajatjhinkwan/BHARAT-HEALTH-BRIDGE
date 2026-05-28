import { AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';
import { useMemo } from 'react';
import { useLabStore } from '../store/labStore';
import { QueueCard } from '../components/queue/QueueCard';
import { QueueSkeleton } from '../components/queue/QueueSkeleton';
import { Button } from '../components/ui/button';
import { useLabData } from '../hooks/useLabData';

const PRIORITIES = ['all', 'Normal', 'Urgent', 'Emergency'];
const STATUSES = ['all', 'Pending', 'Accepted', 'Sample Collected', 'Processing'];

export function IncomingQueueSection() {
  const { refresh } = useLabData();
  const {
    orders,
    search,
    filterPriority,
    filterStatus,
    filterDepartment,
    sortBy,
    loading,
    setFilterPriority,
    setFilterStatus,
    setFilterDepartment,
    setSortBy,
  } = useLabStore();

  const filtered = useMemo(() => {
    let list = orders.filter((o) => !['Completed', 'Verified', 'Critical'].includes(o.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.patientName.toLowerCase().includes(q) ||
          o.mrn.toLowerCase().includes(q) ||
          o.orderId?.toLowerCase().includes(q)
      );
    }
    if (filterPriority !== 'all') list = list.filter((o) => o.priority === filterPriority);
    if (filterStatus !== 'all') list = list.filter((o) => o.status === filterStatus);
    if (filterDepartment !== 'all') list = list.filter((o) => o.department === filterDepartment);
    const priorityRank = { Emergency: 0, Urgent: 1, Normal: 2 };
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityRank[a.priority || 'Normal'] ?? 2) - (priorityRank[b.priority || 'Normal'] ?? 2);
      }
      return new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime();
    });
    return list;
  }, [orders, search, filterPriority, filterStatus, filterDepartment, sortBy]);

  const departments = useMemo(
    () => ['all', ...new Set(orders.map((o) => o.department).filter(Boolean))],
    [orders]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Incoming Test Queue</h1>
          <p className="text-[var(--text-muted)]">{filtered.length} active orders</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refresh()}>
          Refresh
        </Button>
      </div>

      <div 
         style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          overflowX: 'auto',
          padding: '0.5rem',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
        className="sticky top-[72px] z-20 shadow-sm lab-glass"
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
            color: 'var(--primary)',
            flexShrink: 0,
          }}
          className="font-bold text-xs uppercase tracking-wider"
        >
          <Filter className="h-4.5 w-4.5 shrink-0" />
          <span className="whitespace-nowrap">Queue Filters:</span>
        </div>
        <select
          style={{ flex: '1 1 0%', minWidth: '120px' }}
          className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-[var(--text-main)] outline-none transition-all hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === 'all' ? 'Priority: All' : `Priority: ${p}`}</option>
          ))}
        </select>
        <select
          style={{ flex: '1 1 0%', minWidth: '120px' }}
          className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-[var(--text-main)] outline-none transition-all hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'Status: All' : `Status: ${s}`}</option>
          ))}
        </select>
        <select
          style={{ flex: '1 1 0%', minWidth: '120px' }}
          className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-[var(--text-main)] outline-none transition-all hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'Dept: All' : `Dept: ${d}`}</option>
          ))}
        </select>
        <select
          style={{ flex: '1 1 0%', minWidth: '120px' }}
          className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-2 text-xs font-semibold text-[var(--text-main)] outline-none transition-all hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'time' | 'priority')}
        >
          <option value="priority">Sort: Priority Rank</option>
          <option value="time">Sort: Recency</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((n) => <QueueSkeleton key={n} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((order, i) => (
              <QueueCard key={`${order.patientId}-${order.orderIndex}`} order={order} index={i} onAction={refresh} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-[var(--surface)]/30 backdrop-blur-sm">
          <p className="text-[var(--text-muted)] text-sm mb-6">No active laboratory orders found in this queue.</p>
          <div className="mx-auto max-w-md opacity-30 pointer-events-none">
            <QueueSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}


