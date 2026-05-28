import { API_BASE_URL } from '../config';

export async function fetchWards() {
  const res = await fetch(`${API_BASE_URL}/critical/wards`);
  if (!res.ok) throw new Error('Failed to fetch wards');
  return res.json();
}

export async function fetchWardBeds(wardKey) {
  const res = await fetch(`${API_BASE_URL}/critical/beds?ward=${encodeURIComponent(wardKey)}`);
  if (!res.ok) throw new Error('Failed to fetch beds');
  return res.json();
}

export async function fetchWardPatients(wardKey, room) {
  const params = new URLSearchParams();
  if (room && room !== '__ALL__') params.set('room', room);
  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(
    `${API_BASE_URL}/critical/wards/${encodeURIComponent(wardKey)}/patients${qs}`
  );
  if (!res.ok) throw new Error('Failed to fetch ward patients');
  return res.json();
}

export async function fetchAdminOverview() {
  const res = await fetch(`${API_BASE_URL}/admin/overview`);
  if (!res.ok) throw new Error('Failed to fetch admin overview');
  return res.json();
}
