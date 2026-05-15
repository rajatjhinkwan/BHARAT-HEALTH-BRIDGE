import { API_BASE_URL } from '@/constants/api';

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  return res.json();
}

export async function listHospitals() {
  const res = await fetch(`${API_BASE_URL}/hospitals`);
  return res.json();
}
