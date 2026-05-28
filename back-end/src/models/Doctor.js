import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    slots: [timeSlotSchema],
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'medical_license',
        'degree_certificate',
        'aadhaar',
        'pan',
        'signature',
        'prescription_stamp',
        'certification',
        'license',
      ],
    },
    name: String,
    url: String,
    publicId: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: String,
    section: String,
    meta: mongoose.Schema.Types.Mixed,
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email: { type: String, sparse: true, unique: true },
    password: { type: String },

    profileImage: {
      url: String,
      publicId: String,
    },

    personal: {
      fullName: String,
      gender: String,
      age: Number,
      dateOfBirth: Date,
      bloodGroup: String,
      bio: { type: String, maxlength: 500 },
      languages: [String],
    },

    professional: {
      medicalRegistrationNumber: String,
      doctorId: String,
      specialization: String,
      superSpecialization: String,
      qualifications: [String],
      degrees: [String],
      experienceYears: Number,
      consultationFees: Number,
      hospitalName: String,
      department: String,
      specializations: [String],
    },

    contact: {
      mobile: String,
      alternateMobile: String,
      email: String,
      emergencyContact: String,
      clinicAddress: String,
      city: String,
      state: String,
      pincode: String,
      mapLocation: String,
      mobileVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
    },

    settings: {
      telemedicineEnabled: { type: Boolean, default: true },
      videoConsultationEnabled: { type: Boolean, default: true },
      voiceDictationEnabled: { type: Boolean, default: false },
      aiPrescriptionEnabled: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
    },

    availability: {
      status: {
        type: String,
        enum: ['online', 'offline', 'busy', 'emergency'],
        default: 'offline',
      },
      weeklySchedule: [dayScheduleSchema],
      emergencyAvailable: { type: Boolean, default: false },
      onlineSlots: [timeSlotSchema],
      offlineSlots: [timeSlotSchema],
      holidayMode: { type: Boolean, default: false },
    },

    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginActivity: [
        {
          device: String,
          ip: String,
          location: String,
          at: { type: Date, default: Date.now },
        },
      ],
      sessions: [
        {
          device: String,
          tokenId: String,
          lastActive: Date,
          current: Boolean,
        },
      ],
    },

    documents: [documentSchema],

    analytics: {
      totalPatients: { type: Number, default: 0 },
      consultationsToday: { type: Number, default: 0 },
      onlineConsultations: { type: Number, default: 0 },
      pendingReports: { type: Number, default: 0 },
      rating: { type: Number, default: 4.8 },
      reviews: { type: Number, default: 0 },
    },

    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      verifiedAt: Date,
      badges: [String],
    },

    draft: mongoose.Schema.Types.Mixed,
    activityLogs: [activityLogSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

doctorSchema.statics.createFromUser = async function (user) {
  const existing = await this.findOne({ userId: user._id });
  if (existing) return existing;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklySchedule = days.map((day) => ({
    day,
    enabled: day !== 'Saturday',
    slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
  }));

  return this.create({
    userId: user._id,
    email: user.email,
    profileImage: user.avatar ? { url: user.avatar } : undefined,
    personal: {
      fullName: user.name,
      gender: user.gender,
      dateOfBirth: user.dob,
      languages: ['English', 'Hindi'],
    },
    professional: {
      doctorId: user.employeeId,
      specialization: user.specialization,
      department: user.department,
      hospitalName: 'Bharat Health Bridge',
      specializations: user.specialization ? [user.specialization] : [],
      experienceYears: 5,
      consultationFees: 500,
    },
    contact: {
      mobile: user.phone,
      email: user.email,
    },
    availability: {
      status: user.availabilityStatus === 'AVAILABLE' ? 'online' : 'offline',
      weeklySchedule,
    },
    verification: {
      status: 'verified',
      badges: ['BHB Certified'],
    },
    analytics: {
      totalPatients: Math.floor(Math.random() * 200) + 50,
      consultationsToday: Math.floor(Math.random() * 12) + 2,
      onlineConsultations: Math.floor(Math.random() * 8),
      pendingReports: Math.floor(Math.random() * 5),
      rating: 4.5 + Math.random() * 0.5,
      reviews: Math.floor(Math.random() * 80) + 10,
    },
  });
};

doctorSchema.methods.logActivity = function (action, section, meta = {}) {
  this.activityLogs.unshift({ action, section, meta });
  if (this.activityLogs.length > 50) this.activityLogs = this.activityLogs.slice(0, 50);
};

doctorSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model('Doctor', doctorSchema);
