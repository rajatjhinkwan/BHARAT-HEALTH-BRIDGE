import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

let socket = null;

export function usePatientRealtime(patientId, handlers = {}) {
  useEffect(() => {
    if (!patientId) return;

    const url = API_BASE_URL.replace(/\/api\/?$/, '');
    if (!socket) {
      socket = io(url, { transports: ['websocket', 'polling'] });
    }
    socket.emit('joinPatient', String(patientId));

    const onPrescription = (p) => handlers.onPrescription?.(p);
    const onAppointment = (p) => handlers.onAppointment?.(p);
    const onPatientRecord = (p) => handlers.onPatientRecord?.(p);
    const onQueueUpdated = (p) => handlers.onQueueUpdate?.(p);

    socket.on('prescriptionUpdate', onPrescription);
    socket.on('appointmentUpdate', onAppointment);
    socket.on('patientRecordUpdate', onPatientRecord);
    socket.on('queueUpdated', onQueueUpdated);

    return () => {
      socket.off('prescriptionUpdate', onPrescription);
      socket.off('appointmentUpdate', onAppointment);
      socket.off('patientRecordUpdate', onPatientRecord);
      socket.off('queueUpdated', onQueueUpdated);
      socket.emit('leavePatient', String(patientId));
    };
  }, [patientId, handlers.onPrescription, handlers.onAppointment, handlers.onPatientRecord, handlers.onQueueUpdate]);
}
