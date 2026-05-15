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
    department: { type: String, default: 'OPD' }, // New field for department-wise routing
    status: { 
      type: String, 
      enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED'], 
      default: 'WAITING' 
    }
  },
  { timestamps: true }
)

export default mongoose.model('QueueNode', queueNodeSchema)
