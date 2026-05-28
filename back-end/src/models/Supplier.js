import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: String,
    phone: String,
    email: String,
    gstNumber: String,
    address: String,
    medicinesSupplied: [String],
    rating: { type: Number, default: 4, min: 0, max: 5 },
    lastDelivery: Date,
    pendingInvoices: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);
