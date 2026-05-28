import { API_BASE_URL } from '../../../config';

function headers() {
  const token = localStorage.getItem('hospflow_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchLabOrders() {
  const res = await fetch(`${API_BASE_URL}/laboratory/orders`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export async function fetchLabAnalytics() {
  const res = await fetch(`${API_BASE_URL}/laboratory/analytics`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchLabAlerts() {
  const res = await fetch(`${API_BASE_URL}/laboratory/alerts`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function patchLabOrder(
  patientId: string,
  orderIndex: number,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE_URL}/laboratory/orders/${patientId}/${orderIndex}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function submitLabResults(
  patientId: string,
  orderIndex: number,
  metrics: Record<string, Record<string, string | number>>,
  performedBy?: string
) {
  const res = await fetch(`${API_BASE_URL}/laboratory/orders/${patientId}/${orderIndex}/results`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ metrics, performedBy }),
  });
  if (!res.ok) throw new Error('Failed to submit results');
  return res.json();
}
