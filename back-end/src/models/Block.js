import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, unique: true },
    timestamp: { type: Date, required: true },
    previousHash: { type: String, required: true },
    hash: { type: String, required: true },
    nonce: { type: Number, required: true },
    data: {
      recordId: { type: String, required: true },
      patientId: { type: String, required: true },
      dataHash: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Block', blockSchema);
