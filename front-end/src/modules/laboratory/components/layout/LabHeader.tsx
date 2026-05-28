import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { useLabStore } from '../../store/labStore';

export function LabHeader() {
  const { search, setSearch, orders } = useLabStore();
  const critical = orders.filter((o) => o.priority === 'Emergency' || o.isCritical).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="relative min-w-[240px] flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          placeholder="Search patients, UHID, orders…"
          className="h-10 text-sm"
          style={{ paddingLeft: '2.75rem' }} // Bulletproof padding to prevent overlap with the Search icon
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {critical > 0 && (
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="rounded-full bg-[var(--danger-light)] px-4 py-1.5 text-xs font-semibold text-[var(--danger)] uppercase tracking-wider"
        >
          {critical} Critical Orders
        </motion.div>
      )}
    </header>
  );
}
