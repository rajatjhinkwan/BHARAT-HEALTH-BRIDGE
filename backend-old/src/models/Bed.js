import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedId: {
    type: String,
    required: true,
    unique: true
  },
  bedNumber: {
    type: String,
    required: true
  },
  wardName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE'],
    default: 'AVAILABLE'
  },
  occupied: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  assignedNurse: {
    type: String,
    default: null
  }
}, { timestamps: true });

const Bed = mongoose.models.Bed || mongoose.model('Bed', bedSchema);
export default Bed;
