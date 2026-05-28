import { API_BASE_URL } from '../config';

export async function fetchMachines(params = {}) {
  const qs = new URLSearchParams();
  if (params.department) qs.set('department', params.department);
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const url = `${API_BASE_URL}/machines${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load machines');
  return res.json();
}

export async function fetchMachineStats() {
  const res = await fetch(`${API_BASE_URL}/machines/stats`);
  if (!res.ok) throw new Error('Failed to load machine stats');
  return res.json();
}

export async function updateMachineStatus(id, status, meta = {}) {
  const res = await fetch(`${API_BASE_URL}/machines/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...meta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update machine status');
  }
  return res.json();
}
