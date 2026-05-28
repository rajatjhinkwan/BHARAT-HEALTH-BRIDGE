import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Inbox,
  Droplets,
  FlaskConical,
  FileEdit,
  FileCheck2,
  BarChart3,
  TestTube2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLabStore } from '../../store/labStore';
import type { LabSection } from '../../types/lab';

const NAV: { id: LabSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incoming', label: 'Incoming Orders', icon: Inbox },
  { id: 'reports', label: 'Report Entry', icon: FileEdit },
  { id: 'completed', label: 'Completed Reports', icon: FileCheck2 },
];

export function LabSidebar() {
  const { section, setSection, orders } = useLabStore();
  const pending = orders.filter((o) => ['Pending', 'Accepted'].includes(o.status)).length;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] animate-pulse">
          <TestTube2 className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <p className="font-bold text-base text-[var(--text-main)] leading-tight">Pathology</p>
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
                  ? 'bg-[var(--primary)] text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-main)]'
              )}
            >
              {active && (
                <motion.span
                  layoutId="lab-nav-active"
                  className="absolute inset-0 rounded-xl bg-[var(--primary)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10 flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className="relative z-10 rounded-full bg-[var(--danger)] px-2 py-0.5 text-[10px] font-bold text-white">
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
