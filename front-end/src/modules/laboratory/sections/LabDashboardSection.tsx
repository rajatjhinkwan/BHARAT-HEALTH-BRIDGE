import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Clock, FlaskConical } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useLabStore } from '../store/labStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const statCards = [
  { key: 'totalPending', label: 'Pending Tests', icon: Clock, color: 'text-blue-400' },
  { key: 'processing', label: 'Processing', icon: FlaskConical, color: 'text-amber-400' },
  { key: 'completedToday', label: 'Completed Today', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'criticalCount', label: 'Critical Reports', icon: AlertTriangle, color: 'text-red-400' },
] as const;

export function LabDashboardSection() {
  const { analytics, activityFeed, orders } = useLabStore();

  const stats = analytics || {
    totalPending: 0,
    processing: 0,
    completedToday: 0,
    criticalCount: 0,
    avgTurnaroundMinutes: 52,
    volumeByDay: [],
    commonTests: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Laboratory Command Center</h1>
        <p className="text-[var(--text-muted)]">Bharat Health Bridge · Real-time workflow · Avg TAT {stats.avgTurnaroundMinutes} min</p>
      </div>

      {(stats.criticalCount > 0 || orders.some((o) => o.isCritical || o.priority === 'Emergency')) && (
        <div
          className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-semibold text-[var(--text-main)]">Critical lab alerts active</p>
            <p className="text-sm text-[var(--text-muted)]">
              {stats.criticalCount} critical report(s) require immediate review. Check Incoming Orders.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl bg-[var(--surface-hover)] p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums text-[var(--text-main)]">
                    {(stats as any)[key]}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">{label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Test volume trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live feed
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-3 overflow-y-auto">
            {(activityFeed.length ? activityFeed : [{ id: '1', message: 'System ready', time: 'Now', type: 'info' }]).map(
              (a) => (
                <div key={a.id} className="rounded-lg bg-[var(--background)] px-3 py-2 text-sm">
                  <p className="text-[var(--text-main)]">{a.message}</p>
                  <p className="text-xs text-[var(--text-muted)]">{a.time}</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Most common tests</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.commonTests} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="commonTestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="url(#commonTestsGrad)" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
