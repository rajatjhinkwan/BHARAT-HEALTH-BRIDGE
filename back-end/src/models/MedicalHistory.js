import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    type: {
      type: String,
      enum: [
        'prescription', 'lab_report', 'blood_test', 'mri', 'ct_scan',
        'x_ray', 'ultrasound', 'ecg', 'voice_note', 'surgery', 'vaccination',
        'discharge_summary'
      ],
      required: true
    },
    title: { type: String, required: true },
    hospital: { type: String, default: 'General Hospital' },
    doctor: { type: String, default: 'Dr. Self-Reported' },
    fileUrl: { type: String },
    ocrText: { type: String },
    prescriptionDetails: {
      medicines: [
        {
          name: String,
          dosage: String,
          duration: String
        }
      ],
      diagnosis: String,
      notes: String,
      followUpDate: Date,
      doctorSignature: String
    },
    voiceNoteDetails: {
      audioUrl: String,
      transcript: String,
      duration: Number
    },
    accessControl: {
      locked: { type: Boolean, default: false },
      approvedDoctors: [{ type: String }],
      approvedHospitals: [{ type: String }]
    }
  },
  { timestamps: true }
);

export default mongoose.model('MedicalHistory', medicalHistorySchema);
