import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient, QueueNode } from '../src/models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const departments = [
    'NEPHROLOGY', 
    'CARDIOLOGY', 
    'NEUROLOGY', 
    'GENERAL MEDICINE', 
    'PEDIATRICS', 
    'ORTHOPEDICS', 
    'ENT', 
    'OPHTHALMOLOGY', 
    'EMERGENCY'
];

const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const patientsData = [
    { name: 'Rohan Sharma', age: 45, gender: 'Male', symptoms: 'Severe Chest Pain, Breathlessness' },
    { name: 'Anjali Gupta', age: 32, gender: 'Female', symptoms: 'Persistent Migraine, Blurred Vision' },
    { name: 'Vikram Singh', age: 28, gender: 'Male', symptoms: 'Abdominal Cramps, Nausea' },
    { name: 'Sanya Malhotra', age: 54, gender: 'Female', symptoms: 'Joint Pain, Swelling in Knees' },
    { name: 'Karan Mehra', age: 39, gender: 'Male', symptoms: 'Chronic Cough, High Fever' },
    { name: 'Priya Verma', age: 24, gender: 'Female', symptoms: 'Skin Rash, Itching' },
    { name: 'Aditya Das', age: 62, gender: 'Male', symptoms: 'Difficulty in Urination, Back Pain' },
    { name: 'Ishani Roy', age: 19, gender: 'Female', symptoms: 'Fainting Spells, Low BP' },
    { name: 'Rahul Khanna', age: 41, gender: 'Male', symptoms: 'Sudden Weakness in Limbs' },
    { name: 'Meera Nair', age: 35, gender: 'Female', symptoms: 'Sore Throat, Difficulty Swallowing' }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const today = new Date().toISOString().split('T')[0];

        for (const dept of departments) {
            console.log(`Seeding queue for ${dept}...`);
            
            // Add 3-5 patients per department
            const count = Math.floor(Math.random() * 3) + 3;
            
            for (let i = 0; i < count; i++) {
                const randomPatient = patientsData[Math.floor(Math.random() * patientsData.length)];
                const priority = priorities[Math.floor(Math.random() * priorities.length)];
                
                // 1. Create Patient Record
                const uhid = `UHID-DUMMY-${Math.floor(100000 + Math.random() * 900000)}`;
                const patient = new Patient({
                    patientName: randomPatient.name,
                    mrn: uhid,
                    dob: '1985-05-15', // Dummy DOB
                    age: randomPatient.age,
                    gender: randomPatient.gender,
                    phone: '9999999999',
                    address: 'Dummy Address, New Delhi',
                    aadharCardId: `AADHAR-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                    currentDepartment: dept,
                    currentStatus: 'WAITING',
                    symptoms: randomPatient.symptoms,
                    priority: priority
                });
                const savedPatient = await patient.save();

                // 2. Create Queue Node
                const deptCode = dept.substring(0, 3).toUpperCase();
                const token = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                
                const queueNode = new QueueNode({
                    queueId: 'Q-DUMMY-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                    tokenNumber: token,
                    patientId: savedPatient._id,
                    patientName: savedPatient.patientName,
                    mrn: savedPatient.mrn,
                    date: today,
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    doctor: 'TBD',
                    department: dept,
                    status: 'WAITING',
                    priorityLevel: priority,
                    symptoms: randomPatient.symptoms
                });
                await queueNode.save();
            }
        }

        console.log('Successfully seeded dummy patients across all departments!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
