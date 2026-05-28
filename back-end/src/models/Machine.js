import mongoose from 'mongoose';

const STATUS_VALUES = ['operational', 'maintenance', 'offline', 'calibration', 'standby'];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    changedBy: { type: String, default: 'System' },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const machineSchema = new mongoose.Schema(
  {
    machineCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    manufacturer: String,
    model: String,
    department: { type: String, required: true, index: true },
    status: { type: String, enum: STATUS_VALUES, default: 'operational', index: true },
    location: String,
    uptime: { type: Number, default: 98 },
    lastMaintenance: Date,
    nextMaintenance: Date,
    purchaseDate: Date,
    warrantyStatus: { type: String, default: 'Active' },
    serialNumber: { type: String, unique: true, sparse: true },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

machineSchema.statics.VALID_STATUSES = STATUS_VALUES;

export default mongoose.model('Machine', machineSchema);
