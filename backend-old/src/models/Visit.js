import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  tokenNumber: { type: String, required: true },
  department: { type: String, required: true },
  assignedDoctor: { type: String },
  patientStatus: { 
    type: String, 
    enum: ['REGISTERED', 'BOOKED', 'ARRIVED', 'WAITING', 'IN CONSULTATION', 'LAB PENDING', 'REFERRED', 'ADMITTED', 'IN ICU', 'ON VENTILATOR', 'COMPLETED', 'DISCHARGED'],
    default: 'REGISTERED'
  },
  priority: { type: String, enum: ['Routine', 'Urgent', 'Emergency'], default: 'Routine' }
}, { timestamps: true });

export default mongoose.model('Visit', visitSchema);
