import { API_BASE_URL } from '../../../config';

function headers() {
  const token = localStorage.getItem('hospflow_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}/pharmacy${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const fetchDashboard = () => request('/dashboard');
export const fetchMedicines = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/medicines${q ? `?${q}` : ''}`);
};
export const fetchMedicineByBarcode = (code) => request(`/medicines/barcode/${code}`);
export const createMedicine = (body) => request('/medicines', { method: 'POST', body: JSON.stringify(body) });
export const updateMedicine = (id, body) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteMedicine = (id) => request(`/medicines/${id}`, { method: 'DELETE' });
export const fetchPendingPrescriptions = () => request('/prescriptions/pending');
export const dispensePrescription = (body) => request('/dispense', { method: 'POST', body: JSON.stringify(body) });
export const fetchAlerts = () => request('/alerts');
export const fetchExpiry = () => request('/expiry');
export const fetchSuppliers = () => request('/suppliers');
export const createSupplier = (body) => request('/suppliers', { method: 'POST', body: JSON.stringify(body) });
export const fetchPurchaseOrders = () => request('/purchase-orders');
export const createPurchaseOrder = (body) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(body) });
export const receivePurchaseOrder = (id) => request(`/purchase-orders/${id}/receive`, { method: 'PATCH' });
export const fetchHistory = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/history${q ? `?${q}` : ''}`);
};
export const submitReturn = (body) => request('/returns', { method: 'POST', body: JSON.stringify(body) });
export const fetchReports = () => request('/reports');
export const searchMedicines = (q) => request(`/search?q=${encodeURIComponent(q)}`);
