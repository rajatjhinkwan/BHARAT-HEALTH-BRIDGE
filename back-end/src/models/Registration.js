import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    address: { type: String, required: true },
    aadharCardId: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

export default mongoose.model('Registration', registrationSchema)
