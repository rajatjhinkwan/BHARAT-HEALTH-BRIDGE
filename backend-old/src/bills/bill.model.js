import mongoose from 'mongoose'

const billItemSchema = new mongoose.Schema(
  {
    description: String,
    unitCost: Number,
    quantity: Number,
  },
  { _id: false }
)

const billSchema = new mongoose.Schema(
  {
    hospital: { type: String, required: true },
    patientName: { type: String, required: true },
    items: { type: [billItemSchema], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('Bill', billSchema)
