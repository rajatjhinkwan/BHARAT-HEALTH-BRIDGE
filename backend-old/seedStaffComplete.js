
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for comprehensive staff seeding");

        const password = 'password123';
        const hashed = await bcrypt.hash(password, 10);

        const staffMembers = [
            // Administrators
            { name: 'Super Admin', employeeId: 'SAD-123', password: hashed, role: 'super_admin', department: 'Administration' },
            { name: 'Hospital Admin', employeeId: 'ADM-123', password: hashed, role: 'hospital_admin', department: 'Administration' },
            
            // Reception
            { name: 'Main Receptionist', employeeId: 'REC-123', password: hashed, role: 'receptionist', department: 'Reception' },
            { name: 'OPD Receptionist', employeeId: 'REC-OPD-123', password: hashed, role: 'receptionist', department: 'OPD' },

            // ICU
            { name: 'Dr. ICU Specialist', employeeId: 'DOC-ICU-123', password: hashed, role: 'doctor', department: 'ICU', specialization: 'Intensivist' },
            { name: 'Nurse ICU Head', employeeId: 'NUR-ICU-123', password: hashed, role: 'nurse', department: 'ICU' },

            // Ventilator Ward
            { name: 'Dr. Pulmonologist', employeeId: 'DOC-VENT-123', password: hashed, role: 'doctor', department: 'Ventilator Ward', specialization: 'Pulmonology' },
            { name: 'Nurse Ventilator Tech', employeeId: 'NUR-VENT-123', password: hashed, role: 'nurse', department: 'Ventilator Ward' },

            // Emergency
            { name: 'Dr. Emergency Lead', employeeId: 'DOC-EMER-123', password: hashed, role: 'doctor', department: 'Emergency', specialization: 'Emergency Medicine' },
            { name: 'Nurse Emergency Triage', employeeId: 'NUR-EMER-123', password: hashed, role: 'nurse', department: 'Emergency' },

            // Cardiology
            { name: 'Dr. Cardiologist', employeeId: 'DOC-CARD-123', password: hashed, role: 'doctor', department: 'Cardiology', specialization: 'Cardiology' },
            { name: 'Nurse Cardiac Care', employeeId: 'NUR-CARD-123', password: hashed, role: 'nurse', department: 'Cardiology' },

            // Neurology
            { name: 'Dr. Neurologist', employeeId: 'DOC-NEUR-123', password: hashed, role: 'doctor', department: 'Neurology', specialization: 'Neurology' },
            { name: 'Nurse Neuro Specialist', employeeId: 'NUR-NEUR-123', password: hashed, role: 'nurse', department: 'Neurology' },

            // Nephrology
            { name: 'Dr. Nephrologist', employeeId: 'DOC-NEPH-123', password: hashed, role: 'doctor', department: 'Nephrology', specialization: 'Nephrology' },
            { name: 'Nurse Dialysis Tech', employeeId: 'NUR-NEPH-123', password: hashed, role: 'nurse', department: 'Nephrology' },

            // Pediatrics
            { name: 'Dr. Pediatrician', employeeId: 'DOC-PEDI-123', password: hashed, role: 'doctor', department: 'Pediatrics', specialization: 'Pediatrics' },
            { name: 'Nurse Pediatric Care', employeeId: 'NUR-PEDI-123', password: hashed, role: 'nurse', department: 'Pediatrics' },

            // Maternity -> Gynecology
            { name: 'Dr. Obstetrician', employeeId: 'DOC-MATE-123', password: hashed, role: 'doctor', department: 'Gynecology', specialization: 'OB/GYN' },
            { name: 'Nurse Midwife', employeeId: 'NUR-MATE-123', password: hashed, role: 'nurse', department: 'Gynecology' },

            // Services
            { name: 'Chief Pharmacist', employeeId: 'PHA-123', password: hashed, role: 'pharmacist', department: 'Pharmacy' },
            { name: 'Lab Technician', employeeId: 'LAB-123', password: hashed, role: 'lab_tech', department: 'Laboratory' },
            { name: 'Blood Bank Manager', employeeId: 'BLD-123', password: hashed, role: 'lab_tech', department: 'Blood Bank' }
        ];

        for (const staff of staffMembers) {
            await User.findOneAndUpdate(
                { employeeId: staff.employeeId },
                { ...staff },
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${staff.name} (${staff.employeeId}) - ${staff.role} in ${staff.department}`);
        }

        console.log("\nSuccess: All ward-specific credentials have been seeded!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedStaff();
