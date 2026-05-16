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
      enum: [
        'RECEPTION', 'OPD', 'GENERAL MEDICINE', 'CARDIOLOGY', 'NEUROLOGY', 
        'NEPHROLOGY', 'ORTHOPEDICS', 'ENT', 'DERMATOLOGY', 'PEDIATRICS', 
        'GYNECOLOGY', 'PSYCHIATRY', 'RADIOLOGY', 'ONCOLOGY', 'PULMONOLOGY', 
        'UROLOGY', 'GASTROENTEROLOGY', 'ENDOCRINOLOGY', 'OPHTHALMOLOGY', 
        'EMERGENCY', 'ICU', 'VENTILATOR WARD', 'TRAUMA CARE', 'SURGERY WARD', 
        'PATHOLOGY', 'LABORATORY', 'PHARMACY', 'HDU', 'TRAUMA WARD', 'GENERAL WARD',
        'DISCHARGED'
      ],
      default: 'OPD' 
    },
    currentStatus: {
      type: String,
      enum: [
        'REGISTERED', 'WAITING', 'IN CONSULTATION', 'ADMITTED', 
        'IN ICU', 'ON VENTILATOR', 'UNDER OBSERVATION', 'CRITICAL',
        'LAB PENDING', 'XRAY PENDING', 'MRI PENDING', 'CT PENDING', 'ULTRASOUND PENDING',
        'SURGERY SCHEDULED', 'SURGERY IN PROGRESS',
        'DIALYSIS ACTIVE', 'CHEMOTHERAPY ACTIVE',
        'REFERRED', 'RECOVERING', 'DISCHARGED'
      ],
      default: 'REGISTERED'
    },
    assignedDoctor: { type: String },
    admissionDate: { type: Date },
    dischargeDate: { type: Date },
    
    // Bed Management (Unified)
    currentWard: { type: String },
    currentRoom: { type: String },
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
        orderedBy: String,
        orderId: String
      }
    ],
    radiologyOrders: [
      {
        orderDate: { type: Date, default: Date.now },
        type: { type: String, enum: ['X-RAY', 'MRI', 'CT', 'ULTRASOUND'] },
        bodyPart: String,
        status: { type: String, default: 'Pending' },
        results: String,
        imageUrls: [String],
        orderedBy: String,
        orderId: String
      }
    ],
    surgeryOrders: [
      {
        orderDate: { type: Date, default: Date.now },
        procedure: String,
        status: { type: String, default: 'Scheduled' },
        otNumber: String,
        scheduledDate: Date,
        surgeon: String,
        notes: String
      }
    ],
    specializedSessions: [
      {
        type: { type: String, enum: ['DIALYSIS', 'CHEMOTHERAPY'] },
        startDate: { type: Date, default: Date.now },
        status: { type: String, default: 'Active' },
        notes: String,
        performedBy: String
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
