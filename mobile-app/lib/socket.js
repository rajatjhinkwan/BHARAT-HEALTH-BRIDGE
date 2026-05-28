import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api';

let socket = null;
let activePatientId = null;

export function getSocketUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export function connectSocket(patientId) {
  if (!patientId) return null;
  const url = getSocketUrl();
  if (!socket) {
    socket = io(url, { transports: ['websocket', 'polling'], reconnection: true });
  }
  const nextPatientId = String(patientId);
  if (activePatientId && activePatientId !== nextPatientId) {
    socket.emit('leavePatient', activePatientId);
  }
  socket.emit('joinPatient', nextPatientId);
  activePatientId = nextPatientId;
  return socket;
}

export function disconnectSocket(patientId) {
  if (socket && patientId) {
    socket.emit('leavePatient', String(patientId));
    if (activePatientId === String(patientId)) {
      activePatientId = null;
    }
  }
}

export function resetSocket() {
  if (!socket) return;
  if (activePatientId) {
    socket.emit('leavePatient', activePatientId);
  }
  socket.disconnect();
  socket = null;
  activePatientId = null;
}

export function getSocket() {
  return socket;
}
