import { Activity, AlertTriangle, CheckCircle2, Clock, Scan } from 'lucide-react';
import { useRadiologyStore } from '../store/radiologyStore';
import { Card, CardContent } from '../../laboratory/components/ui/card';

const statCards = [
  { key: 'totalPending', label: 'Pending Scans', icon: Clock, color: 'text-sky-500' },
  { key: 'inProgress', label: 'In Scanner', icon: Scan, color: 'text-amber-500' },
  { key: 'awaitingReport', label: 'Awaiting Report', icon: Activity, color: 'text-indigo-500' },
  { key: 'completedToday', label: 'Completed Today', icon: CheckCircle2, color: 'text-emerald-500' },
];

export function RadiologyDashboardSection() {
  const { analytics, orders, queueNodes, activityFeed } = useRadiologyStore();
  const stats = analytics || {
    totalPending: 0,
    inProgress: 0,
    awaitingReport: 0,
    completedToday: 0,
    criticalCount: 0,
    avgTurnaroundMinutes: 75,
  };

  const waitingQueue = queueNodes.filter((n) => n.status === 'WAITING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Radiology Command Center</h1>
        <p className="text-[var(--text-muted)]">
          Bharat Health Bridge · OPD queue: {waitingQueue} waiting · Avg TAT {stats.avgTurnaroundMinutes} min
        </p>
      </div>

      {stats.criticalCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-semibold">{stats.criticalCount} critical finding(s) need review</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl bg-[var(--surface-hover)] p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums">{stats[key] ?? 0}</p>
                <p className="text-sm text-[var(--text-muted)]">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">Live OPD tokens (Radiology)</h3>
            {queueNodes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No patients in radiology OPD queue today.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {queueNodes.slice(0, 12).map((n) => (
                  <li key={n.queueId} className="flex justify-between text-sm border-b border-[var(--border)]/50 py-2">
                    <span className="font-mono text-sky-600">{n.tokenNumber}</span>
                    <span>{n.patientName}</span>
                    <span className="text-[var(--text-muted)]">{n.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">Activity</h3>
            <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
              {(activityFeed.length ? activityFeed : [{ message: 'Connected — waiting for orders', time: '—' }]).map(
                (a) => (
                  <li key={a.id || a.message} className="text-[var(--text-muted)]">
                    <span className="text-[var(--text-main)]">{a.message}</span> · {a.time}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Active imaging orders: {orders.filter((o) => !['Completed', 'Verified'].includes(o.status)).length} · Orders
        placed from EMR (MRI, CT, X-Ray, Ultrasound) sync here in real time.
      </p>
    </div>
  );
}
