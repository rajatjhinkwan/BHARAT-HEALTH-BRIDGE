import { STATUS_LABELS, statusClass } from '../../lib/stockStatus';

export default function StatusChip({ status }) {
  return <span className={statusClass(status)}>{STATUS_LABELS[status] || status}</span>;
}
