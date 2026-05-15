import mongoose from 'mongoose';

const PatientQueueSchema = new mongoose.Schema({
  queueId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  mrn: { type: String, required: true },
  referringDoctor: { type: String, required: true },
  targetDepartment: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  priority: { type: String, enum: ['Routine', 'Urgent', 'Emergency'], default: 'Routine' },
  status: { type: String, enum: ['Waiting', 'In Progress', 'Completed', 'Cancelled'], default: 'Waiting' },
  waitTime: { type: Number, default: 0 },
  assignedTo: { type: String, default: 'Not Assigned' }
}, { timestamps: true });

export default mongoose.model('PatientQueue', PatientQueueSchema);
