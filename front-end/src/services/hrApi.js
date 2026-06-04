import { apiJson } from '../utils/api';

export async function fetchTodayAttendance() {
  return apiJson('/hr/attendance/today');
}

export async function updateAttendance(employeeId, payload) {
  return apiJson(`/hr/attendance/${encodeURIComponent(employeeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchLeaveRequests() {
  return apiJson('/hr/leave-requests');
}

export async function reviewLeaveRequest(id, action) {
  return apiJson(`/hr/leave-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

export async function fetchRosterSummary() {
  return apiJson('/hr/roster-summary');
}
