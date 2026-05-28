import { API_BASE_URL } from '../../../config';

function headers() {
  const token = localStorage.getItem('hospflow_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchRadiologyOrders() {
  const res = await fetch(`${API_BASE_URL}/radiology/orders`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to load imaging orders');
  return res.json();
}

export async function fetchRadiologyAnalytics() {
  const res = await fetch(`${API_BASE_URL}/radiology/analytics`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchRadiologyAlerts() {
  const res = await fetch(`${API_BASE_URL}/radiology/alerts`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRadiologyQueue() {
  const res = await fetch(`${API_BASE_URL}/radiology/queue`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchImagingMachines() {
  const res = await fetch(`${API_BASE_URL}/radiology/machines`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function patchRadiologyOrder(patientId, orderIndex, body) {
  const res = await fetch(`${API_BASE_URL}/radiology/orders/${patientId}/${orderIndex}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function submitRadiologyReport(patientId, orderIndex, findings, performedBy, options = {}) {
  const res = await fetch(`${API_BASE_URL}/radiology/orders/${patientId}/${orderIndex}/results`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ findings, performedBy, ...options }),
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}
