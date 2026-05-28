import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    genericName: String,
    brandName: String,
    category: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'],
      default: 'Tablet',
    },
    batchNumber: String,
    barcode: String,
    stockQuantity: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 10 },
    expiryDate: Date,
    manufacturingDate: Date,
    supplierName: String,
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    rackLocation: String,
    unitPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    gst: { type: Number, default: 12 },
    prescriptionRequired: { type: Boolean, default: false },
    isNarcotic: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text', barcode: 1, batchNumber: 1 });

export function getStockStatus(med) {
  const qty = med.stockQuantity ?? 0;
  const min = med.minimumStock ?? 10;
  if (qty <= 0) return 'out_of_stock';
  if (qty <= min) return 'low_stock';
  if (med.expiryDate) {
    const days = Math.ceil((new Date(med.expiryDate) - new Date()) / (86400000));
    if (days <= 0) return 'expired';
    if (days <= 30) return 'expiring_soon';
  }
  return 'healthy';
}

export default mongoose.model('Medicine', medicineSchema);
