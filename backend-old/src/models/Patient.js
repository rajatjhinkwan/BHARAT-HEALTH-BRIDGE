import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    mrn: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    bloodGroup: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    aadharCardId: { type: String, required: true },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    allergies: { type: String },
    chronicIllness: { type: String },
    profileImage: { type: String },
    insuranceProvider: { type: String },
    policyNumber: { type: String },
    symptoms: { type: String },
    
    // Critical Care & Movement Logic
    currentDepartment: { 
      type: String, 
      enum: ['RECEPTION', 'OPD', 'ICU', 'VENTILATOR WARD', 'EMERGENCY', 'HDU', 'TRAUMA CARE', 'CARDIAC', 'NEURO', 'NEPHRO', 'GENERAL WARD', 'PEDIATRIC', 'SURGICAL', 'DISCHARGED'],
      default: 'OPD' 
    },
    currentStatus: {
      type: String,
      enum: [
        'REGISTERED', 'WAITING', 'IN CONSULTATION', 'ADMITTED', 
        'IN ICU', 'ON VENTILATOR', 'UNDER OBSERVATION', 
        'LAB PENDING', 'REFERRED', 'RECOVERING', 'DISCHARGED'
      ],
      default: 'REGISTERED'
    },
    assignedDoctor: { type: String },
    admissionDate: { type: Date },
    dischargeDate: { type: Date },
    
    // Bed Management (Unified)
    currentWard: { type: String },
    currentBed: { type: String }, // e.g., 'ICU-101'
    assignedNurse: { type: String },
    priority: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    
    nurseNotes: [
      {
        timestamp: { type: Date, default: Date.now },
        nurseName: String,
        note: String
      }
    ],

    
    // Clinical Embedded arrays
    vitals: [
      {
        timestamp: { type: Date, default: Date.now },
        bp: String,
        heartRate: String,
        temp: String,
        spo2: String,
        weight: String,
        recordedBy: String
      }
    ],
    encounters: [
      {
        timestamp: { type: Date, default: Date.now },
        doctorId: String,
        notes: String,
        diagnosis: String,
        clinicalAction: String,
        voiceNoteUrl: String
      }
    ],
    labOrders: [
      {
        orderDate: { type: Date, default: Date.now },
        tests: [String],
        status: { type: String, default: 'Pending' },
        results: String,
        orderedBy: String
      }
    ],
    prescriptions: [
      {
        date: { type: Date, default: Date.now },
        medications: [
          {
            name: String,
            dosage: String,
            duration: String
          }
        ],
        prescribedBy: String,
        voiceNoteUrl: String,
        dispensed: { type: Boolean, default: false }
      }
    ],

    timeline: [
      {
        action: String, // e.g., 'REGISTERED', 'ADMITTED', 'VITALS_UPDATE'
        department: String,
        performedBy: String,
        timestamp: { type: Date, default: Date.now },
        details: String
      }
    ]
  },
  { timestamps: true }
)

export default mongoose.model('Patient', patientSchema)
