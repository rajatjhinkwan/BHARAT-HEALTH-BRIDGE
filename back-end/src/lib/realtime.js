/**
 * Emit events to a patient's private room and broadcast for dashboards.
 */
export function emitPatientEvent(io, patientId, event, payload = {}) {
  if (!io || !patientId) return;
  const data = { patientId: String(patientId), ...payload, ts: Date.now() };
  io.to(`patient:${patientId}`).emit(event, data);
  io.emit('realtimeUpdate', { event, ...data });
}

export function emitAppointmentUpdate(io, appointment) {
  if (!io || !appointment?.patientId) return;
  emitPatientEvent(io, appointment.patientId, 'appointmentUpdate', {
    type: 'appointment',
    appointment,
  });
}

export function emitPrescriptionUpdate(io, patientId, record) {
  if (!io || !patientId) return;
  emitPatientEvent(io, patientId, 'prescriptionUpdate', {
    type: 'prescription_added',
    record,
  });
}

export function emitDispensingUpdate(io, patientId, record) {
  if (!io || !patientId) return;
  emitPatientEvent(io, patientId, 'dispensingUpdate', {
    type: 'medicine_dispensed',
    record,
  });
  io.emit('pharmacyDispensed', { patientId: String(patientId), record, ts: Date.now() });
  io.to('pharmacy').emit('pharmacyDispensed', { patientId: String(patientId), record });
}

export function emitStockAlert(io, payload) {
  if (!io) return;
  const data = { ...payload, ts: Date.now() };
  io.emit('pharmacyStockLow', data);
  io.to('pharmacy').emit('pharmacyStockLow', data);
}

export function emitPharmacyUpdate(io, payload) {
  if (!io) return;
  io.emit('pharmacyUpdate', { ...payload, ts: Date.now() });
  io.emit('serviceUpdate', { type: 'pharmacy', ...payload });
  io.to('pharmacy').emit('pharmacyUpdate', payload);
}
