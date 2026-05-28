import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String },
  department: { type: String, required: true },
  appointmentDate: { type: String, required: true }, // YYYY-MM-DD
  appointmentTime: { type: String, required: true }, // HH:mm
  reason: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 
    default: 'BOOKED' 
  }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
