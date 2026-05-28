import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: String,
    items: [
      {
        medicineId: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'received', 'cancelled'],
      default: 'draft',
    },
    totalAmount: Number,
    createdBy: String,
    expectedDate: Date,
    receivedDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
