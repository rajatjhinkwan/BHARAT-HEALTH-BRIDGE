import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useLabStore } from '../store/labStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const COLORS = ['#3b9eff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export function LabAnalyticsSection() {
  const { analytics } = useLabStore();
  const stats = analytics || { commonTests: [], volumeByDay: [], avgTurnaroundMinutes: 52, criticalCount: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-main)]">Laboratory Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Daily test volume</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.volumeByDay}>
                <XAxis dataKey="day" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Test distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.commonTests} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.commonTests.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">{stats.avgTurnaroundMinutes}m</p><p className="text-sm text-[var(--text-muted)]">Avg processing</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-[var(--danger)]">{stats.criticalCount}</p><p className="text-sm text-[var(--text-muted)]">Critical cases</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">{stats.commonTests?.[0]?.name || 'CBC'}</p><p className="text-sm text-[var(--text-muted)]">Top test</p></CardContent></Card>
      </div>
    </div>
  );
}
