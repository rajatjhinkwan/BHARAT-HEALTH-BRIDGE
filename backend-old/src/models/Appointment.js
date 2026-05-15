import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: String, required: true },
  department: { type: String, required: true },
  appointmentDate: { type: String, required: true }, // YYYY-MM-DD
  appointmentTime: { type: String, required: true }, // HH:mm
  status: { 
    type: String, 
    enum: ['BOOKED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 
    default: 'BOOKED' 
  }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
