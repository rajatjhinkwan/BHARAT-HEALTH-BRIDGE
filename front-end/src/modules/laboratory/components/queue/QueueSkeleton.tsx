import { Card, CardContent } from '../ui/card';

interface Props {
  compact?: boolean;
}

export function QueueSkeleton({ compact }: Props) {
  return (
    <Card className="overflow-hidden border-l-4 border-[var(--border)] bg-[var(--surface)] animate-pulse shadow-sm">
      <CardContent className="space-y-4 p-5">
        {/* Header Block */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[var(--border)]" />
              <div className="h-5 w-40 rounded-md bg-[var(--border)]" />
            </div>
            <div className="h-4 w-32 rounded-md bg-[var(--border)]" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-5 w-16 rounded-full bg-[var(--border)]" />
            <div className="h-5 w-20 rounded-full bg-[var(--border)]" />
          </div>
        </div>

        {/* Workflow Timeline */}
        {!compact && (
          <div className="relative my-4 flex items-center justify-between px-2 pt-2 pb-1 bg-[var(--surface-hover)]/30 rounded-xl p-3 border border-[var(--border)]/40">
            <div className="absolute left-6 right-6 top-6 h-0.5 bg-[var(--border)]/50" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative z-10 flex flex-col items-center flex-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--border)] text-[10px] font-bold text-transparent" />
                <div className="mt-1.5 h-2 w-10 rounded bg-[var(--border)]" />
              </div>
            ))}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-[var(--border)]/40 bg-[var(--background)] p-3">
          <div className="h-4 w-28 rounded bg-[var(--border)]" />
          <div className="h-4 w-24 rounded bg-[var(--border)]" />
          <div className="h-4 w-32 rounded bg-[var(--border)]" />
          <div className="h-4 w-28 rounded bg-[var(--border)]" />
        </div>

        {/* Test Panels */}
        <div className="rounded-xl bg-[var(--primary-light)]/10 border border-[var(--border)]/20 p-3 space-y-3">
          <div className="h-3 w-32 rounded bg-[var(--border)]" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-6 w-20 rounded-lg bg-[var(--border)]" />
            <div className="h-6 w-24 rounded-lg bg-[var(--border)]" />
            <div className="h-6 w-16 rounded-lg bg-[var(--border)]" />
          </div>
          <div className="pt-2 border-t border-[var(--border)]/30 flex justify-between">
            <div className="h-3.5 w-24 rounded bg-[var(--border)]" />
            <div className="h-3.5 w-16 rounded bg-[var(--border)]" />
          </div>
        </div>

        {/* Action Footer */}
        {!compact && (
          <div className="flex gap-2 pt-2 border-t border-[var(--border)]/40">
            <div className="h-9 flex-1 rounded-xl bg-[var(--border)]" />
            <div className="h-9 w-20 rounded-xl bg-[var(--border)]" />
            <div className="h-9 w-16 rounded-xl bg-[var(--border)]" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

