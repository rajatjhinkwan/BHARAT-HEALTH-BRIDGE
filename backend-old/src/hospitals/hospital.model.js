import mongoose from 'mongoose'

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String, enum: ['Govt', 'Private'], required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    specialties: { type: [String], default: [] },
    aqi: { type: Number },
  },
  { timestamps: true }
)

export default mongoose.model('Hospital', hospitalSchema)
