/** Maps UI labels (Routine, Urgent, …) to Patient / QueueNode enums */
const VALID = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export function normalizeClinicalPriority(input) {
  if (!input) return 'LOW';
  const raw = String(input).trim().toUpperCase();
  if (VALID.has(raw)) return raw;

  const p = String(input).trim().toLowerCase();
  if (p === 'emergency' || p === 'critical') return 'CRITICAL';
  if (p === 'urgent' || p === 'high') return 'HIGH';
  if (p === 'medium' || p === 'routine') return p === 'medium' ? 'MEDIUM' : 'LOW';
  return 'LOW';
}
