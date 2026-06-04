import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'not_arrived', 'leave', 'late'],
      default: 'not_arrived',
    },
    shiftStart: { type: String, default: '09:00 AM' },
    timeIn: { type: String, default: '' },
    leaveReason: { type: String, default: '' },
    returnDate: { type: String, default: '' },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
