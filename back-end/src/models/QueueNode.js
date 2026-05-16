import mongoose from 'mongoose'

const queueNodeSchema = new mongoose.Schema(
  {
    queueId: { type: String, required: true, unique: true },
    tokenNumber: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

    patientName: { type: String, required: true },
    mrn: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    doctor: { type: String, required: true },
    department: { type: String, default: 'OPD' }, 
    status: { 
      type: String, 
      enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'REFERRED', 'TRANSFERRED'], 
      default: 'WAITING' 
    },
    priorityLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    consultationStartTime: { type: Date },
    consultationEndTime: { type: Date },
    symptoms: { type: String }
  },
  { timestamps: true }
)

export default mongoose.model('QueueNode', queueNodeSchema)
