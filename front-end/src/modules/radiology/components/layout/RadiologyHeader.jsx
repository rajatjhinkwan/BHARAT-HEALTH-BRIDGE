import { Search } from 'lucide-react';
import { Input } from '../../../laboratory/components/ui/input';
import { useRadiologyStore } from '../../store/radiologyStore';

export function RadiologyHeader() {
  const { search, setSearch, orders } = useRadiologyStore();
  const critical = orders.filter((o) => o.priority === 'Emergency' || o.isCritical).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="relative min-w-[240px] flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          placeholder="Search patient, UHID, token, order…"
          className="h-10 text-sm"
          style={{ paddingLeft: '2.75rem' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {critical > 0 && (
        <div className="rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-600 uppercase">
          {critical} Critical
        </div>
      )}
    </header>
  );
}
