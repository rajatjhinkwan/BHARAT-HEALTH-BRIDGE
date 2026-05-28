import mongoose from 'mongoose';

const bloodDonorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    district: { type: String },
    city: { type: String },
    bloodType: { type: String, required: true },
    verified: { type: Boolean, default: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('BloodDonor', bloodDonorSchema);
