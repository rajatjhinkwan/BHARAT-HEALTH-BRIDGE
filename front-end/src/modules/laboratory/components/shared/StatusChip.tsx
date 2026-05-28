import { Badge } from '../ui/badge';
import type { LabOrderStatus } from '../../types/lab';

const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  Pending: 'muted',
  Accepted: 'default',
  'Sample Collected': 'warning',
  Processing: 'warning',
  Completed: 'success',
  Verified: 'success',
  Critical: 'danger',
  Rejected: 'danger',
};

export function StatusChip({ status }: { status: LabOrderStatus | string }) {
  return <Badge variant={map[status] || 'muted'}>{status}</Badge>;
}
