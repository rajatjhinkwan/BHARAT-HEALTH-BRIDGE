import { useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

/**
 * Subscribe to real-time patient events (prescriptions, appointments).
 */
export function usePatientRealtime(patientId, handlers = {}) {
  const { onPrescription, onAppointment, onRealtime, onQueueUpdate, onPatientRecord, onConsultation, onVoiceNote } = handlers;

  useEffect(() => {
    if (!patientId) return;
    const sock = connectSocket(patientId);
    if (!sock) return;

    const prescriptionHandler = (payload) => onPrescription?.(payload);
    const appointmentHandler = (payload) => onAppointment?.(payload);
    const realtimeHandler = (payload) => onRealtime?.(payload);
    const queueHandler = (payload) => onQueueUpdate?.(payload);
    const patientRecordHandler = (payload) => onPatientRecord?.(payload);
    const consultationHandler = (payload) => onConsultation?.(payload);
    const voiceNoteHandler = (payload) => onVoiceNote?.(payload);

    sock.on('prescriptionUpdate', prescriptionHandler);
    sock.on('appointmentUpdate', appointmentHandler);
    sock.on('realtimeUpdate', realtimeHandler);
    sock.on('queueUpdated', queueHandler);
    sock.on('patientRecordUpdate', patientRecordHandler);
    sock.on('consultationUpdate', consultationHandler);
    sock.on('voiceNoteUpdate', voiceNoteHandler);

    return () => {
      sock.off('prescriptionUpdate', prescriptionHandler);
      sock.off('appointmentUpdate', appointmentHandler);
      sock.off('realtimeUpdate', realtimeHandler);
      sock.off('queueUpdated', queueHandler);
      sock.off('patientRecordUpdate', patientRecordHandler);
      sock.off('consultationUpdate', consultationHandler);
      sock.off('voiceNoteUpdate', voiceNoteHandler);
      disconnectSocket(patientId);
    };
  }, [patientId, onPrescription, onAppointment, onRealtime, onQueueUpdate, onPatientRecord, onConsultation, onVoiceNote]);
}

export { getSocket };
