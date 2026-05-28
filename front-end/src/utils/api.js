import { API_BASE_URL } from '../config';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('hospflow_auth_user') || 'null');
  } catch {
    return null;
  }
}

export function getAuthHeaders(json = true) {
  const token = localStorage.getItem('hospflow_auth_token');
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Headers for doctor-only queue actions (start / complete consultation). */
export function getDoctorHeaders(json = true) {
  const user = getStoredUser();
  return {
    ...getAuthHeaders(json),
    'X-User-Id': user?._id || user?.id || '',
  };
}

export async function apiFetch(path, options = {}) {
  const { json = true, ...init } = options;
  const headers = {
    ...getAuthHeaders(json && !(init.body instanceof FormData)),
    ...init.headers,
  };
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { API_BASE_URL };
