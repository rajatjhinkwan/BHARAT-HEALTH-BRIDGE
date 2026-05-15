import mongoose from 'mongoose';

const emergencyCaseSchema = new mongoose.Schema({
    caseId: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    emergencyType: { type: String, required: true },
    condition: { type: String },
    priority: { type: String, required: true, enum: ['Critical', 'Serious', 'Stable'] },
    phone: { type: String },
    relativeName: { type: String },
    assignedDoctor: { type: String },
    assignedDepartment: { type: String },
    currentStatus: { 
        type: String, 
        default: 'WAITING',
        enum: ['REGISTERED', 'WAITING', 'IN CONSULTATION', 'LAB PENDING', 'IN ICU', 'ON VENTILATOR', 'ADMITTED', 'DISCHARGED', 'REFERRED']
    },
    vitals: {
        bp: String,
        hr: String,
        temp: String,
        spO2: String
    }
}, { timestamps: true });

export default mongoose.model('EmergencyCase', emergencyCaseSchema);
