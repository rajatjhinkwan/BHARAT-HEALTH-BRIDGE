import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    type: {
      type: String,
      enum: ['added', 'updated', 'dispensed', 'returned', 'expired', 'removed', 'purchase_received'],
      required: true,
    },
    quantity: Number,
    batchNumber: String,
    pharmacistId: String,
    pharmacistName: String,
    patientId: String,
    patientName: String,
    referenceId: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('StockTransaction', stockTransactionSchema);
