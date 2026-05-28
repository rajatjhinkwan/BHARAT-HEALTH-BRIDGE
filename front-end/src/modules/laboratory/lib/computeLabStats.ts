import type { LabOrder } from '../types/lab';

export function computeLabStatsFromOrders(orders: LabOrder[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPending = orders.filter((o) => ['Pending', 'Accepted'].includes(o.status)).length;
  const processing = orders.filter((o) =>
    ['Processing', 'Sample Collected'].includes(o.status)
  ).length;
  const completedToday = orders.filter((o) => {
    if (!['Completed', 'Verified'].includes(o.status)) return false;
    return new Date(o.orderDate || 0) >= today;
  }).length;
  const criticalCount = orders.filter(
    (o) => o.isCritical || o.priority === 'Emergency'
  ).length;
  const avgTurnaroundMinutes = orders.length
    ? Math.round(
        orders.reduce((sum, o) => sum + (o.estimatedTurnaround ?? 60), 0) / orders.length
      )
    : 52;

  return {
    totalPending,
    processing,
    completedToday,
    criticalCount,
    avgTurnaroundMinutes,
  };
}
