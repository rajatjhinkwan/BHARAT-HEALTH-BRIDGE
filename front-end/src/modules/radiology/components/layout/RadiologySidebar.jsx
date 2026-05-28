import { motion } from 'framer-motion';
import { LayoutDashboard, Inbox, Scan, FileEdit, FileCheck2, BarChart3, Radio } from 'lucide-react';
import { cn } from '../../../laboratory/lib/utils';
import { useRadiologyStore } from '../../store/radiologyStore';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incoming', label: 'Incoming Scans', icon: Inbox },
  { id: 'scanning', label: 'Active Scanning', icon: Scan },
  { id: 'reports', label: 'Report Entry', icon: FileEdit },
  { id: 'completed', label: 'Completed', icon: FileCheck2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function RadiologySidebar() {
  const { section, setSection, orders } = useRadiologyStore();
  const pending = orders.filter((o) => ['Pending', 'Accepted', 'Scheduled'].includes(o.status)).length;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
          <Radio className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <p className="font-bold text-base text-[var(--text-main)] leading-tight">Radiology</p>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Imaging OS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = section === id;
          const badge = id === 'incoming' ? pending : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
            >
              {active && (
                <motion.span
                  layoutId="rad-nav-active"
                  className="absolute inset-0 rounded-xl bg-sky-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10 flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className="relative z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
