import mongoose from 'mongoose';

const dispensingLogSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: String,
    mrn: String,
    prescriptionIndex: Number,
    items: [
      {
        medicineId: mongoose.Schema.Types.ObjectId,
        name: String,
        dosage: String,
        frequency: String,
        days: String,
        quantity: Number,
        dispensed: { type: Boolean, default: true },
        partial: Boolean,
        alternative: String,
        unitPrice: Number,
      },
    ],
    pharmacistId: String,
    pharmacistName: String,
    doctorName: String,
    department: String,
    totalAmount: Number,
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'insurance'], default: 'cash' },
    invoiceId: String,
    dispenseHash: String,
    status: { type: String, enum: ['completed', 'partial', 'pending'], default: 'completed' },
  },
  { timestamps: true }
);

export default mongoose.model('DispensingLog', dispensingLogSchema);
