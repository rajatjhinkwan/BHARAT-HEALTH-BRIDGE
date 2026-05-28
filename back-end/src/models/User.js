import mongoose from 'mongoose'
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    role: { type: String, default: 'patient' },
    employeeId: { type: String, unique: true, sparse: true },
    department: { type: String }, // e.g., 'Nephrology', 'Cardiology'
    dob: { type: Date },
    gender: { type: String },
    specialization: { type: String },
    assignedWard: { type: String },
    patientProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    availabilityStatus: { 
      type: String, 
      enum: ['AVAILABLE', 'IN CONSULTATION', 'OFFLINE'],
      default: 'OFFLINE'
    },
    healthCardImage: { type: String },
    healthCardType: { type: String },
    aadharCardId: { type: String },
    aadharCardImage: { type: String },
    organDonor: { type: Boolean, default: false },
  },
  { timestamps: true }
)
export default mongoose.model('User', userSchema)
