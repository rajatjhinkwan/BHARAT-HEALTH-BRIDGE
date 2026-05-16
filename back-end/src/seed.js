import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient, User, QueueNode } from './models/index.js';
import Bed from './models/Bed.js';

dotenv.config();

const MONGODB_URI = "mongodb://localhost:27017/bhb";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await QueueNode.deleteMany({});
    await Bed.deleteMany({});

    // 1. Seed Staff
    const staff = [
      { name: 'Dr. Aryan', email: 'doctor@hospital.com', password: 'password123', role: 'doctor', department: 'OPD', availabilityStatus: 'AVAILABLE' },
      { name: 'Dr. Sarah', email: 'sarah@hospital.com', password: 'password123', role: 'doctor', department: 'NEURO', availabilityStatus: 'AVAILABLE' },
      { name: 'Dr. Vikram', email: 'vikram@hospital.com', password: 'password123', role: 'doctor', department: 'ICU', availabilityStatus: 'IN CONSULTATION' },
      { name: 'Rohan (Reception)', email: 'reception@hospital.com', password: 'password123', role: 'receptionist' },
      { name: 'Admin User', email: 'admin@hospital.com', password: 'password123', role: 'hospital_admin' },
      { name: 'Nurse Joy', email: 'icu_nurse@hospital.com', password: 'password123', role: 'nurse', assignedWard: 'ICU' },
      { name: 'Nurse Kevin', email: 'vent_nurse@hospital.com', password: 'password123', role: 'nurse', assignedWard: 'Ventilator Ward' }
    ];
    await User.insertMany(staff);
    console.log("Seeded staff members.");

    // 2. Seed Wards and Beds
    const wards = ['ICU', 'Ventilator Ward', 'Neuro Ward', 'Cardiac Ward', 'Emergency Observation Ward', 'Trauma Ward', 'Surgical Ward', 'Pediatric Ward'];
    const beds = [];
    wards.forEach(ward => {
      for (let i = 1; i <= 10; i++) {
        beds.push({
          bedId: `${ward.substring(0, 3).toUpperCase()}-${100 + i}`,
          bedNumber: `${ward.substring(0, 3).toUpperCase()}-${100 + i}`,
          wardName: ward,
          occupied: false,
          status: i === 5 ? 'UNDER_MAINTENANCE' : 'AVAILABLE'
        });
      }
    });
    await Bed.insertMany(beds);
    console.log(`Seeded ${beds.length} beds.`);

    // 3. Seed 20 Patients
    const firstNames = ['Rajat', 'Anjali', 'Vikram', 'Suresh', 'Meena', 'Aman', 'Priya', 'Rahul', 'Sneha', 'Kabir', 'Zoya', 'Arjun', 'Isha', 'Varun', 'Kiran', 'Rohan', 'Neeta', 'Sunil', 'Pooja', 'Deepak'];
    const lastNames = ['Singh', 'Sharma', 'Mehta', 'Raina', 'Kumari', 'Gupta', 'Patel', 'Verma', 'Reddy', 'Khan', 'Malhotra', 'Kapoor', 'Joshi', 'Bose', 'Nair', 'Das', 'Sen', 'Gill', 'Vaidya', 'Dubey'];
    
    for (let i = 0; i < 20; i++) {
      const statusRoll = Math.random();
      let status = 'REGISTERED';
      let dept = 'OPD';
      let ward = null;
      let bed = null;
      let priority = 'LOW';

      if (statusRoll > 0.9) { status = 'IN ICU'; dept = 'ICU'; ward = 'ICU'; bed = `ICU-10${(i % 5) + 1}`; priority = 'CRITICAL'; }
      else if (statusRoll > 0.8) { status = 'ON VENTILATOR'; dept = 'VENTILATOR WARD'; ward = 'Ventilator Ward'; bed = `VEN-10${(i % 5) + 1}`; priority = 'CRITICAL'; }
      else if (statusRoll > 0.7) { status = 'WAITING'; dept = 'OPD'; priority = 'MEDIUM'; }
      else if (statusRoll > 0.6) { status = 'ADMITTED'; dept = 'GENERAL WARD'; ward = 'Surgical Ward'; bed = `SUR-10${(i % 5) + 1}`; priority = 'HIGH'; }

      const patient = new Patient({
        patientName: `${firstNames[i]} ${lastNames[i]}`,
        mrn: `UHID-2026-${1000 + i}`,
        age: 20 + Math.floor(Math.random() * 50),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone: `98765432${i.toString().padStart(2, '0')}`,
        dob: '1990-01-01',
        address: 'India',
        aadharCardId: `1234567890${i.toString().padStart(2, '0')}`,
        currentStatus: status,
        currentDepartment: dept,
        currentWard: ward,
        currentBed: bed,
        priority: priority,
        timeline: [{
          action: 'REGISTERED',
          department: 'RECEPTION',
          performedBy: 'Rohan',
          details: 'Initial registration.',
          timestamp: new Date(Date.now() - 3600000)
        }]
      });

      if (ward) {
        patient.timeline.push({
          action: 'ADMITTED',
          department: dept,
          performedBy: 'Dr. Aryan',
          details: `Admitted to ${ward} Bed ${bed}`,
          timestamp: new Date()
        });
        await Bed.findOneAndUpdate({ bedNumber: bed }, { occupied: true, patientId: patient._id, status: 'OCCUPIED' });
      }

      await patient.save();
    }
    console.log("Seeded 20 patients.");

    // 4. Seed Queue
    const waitingPatients = await Patient.find({ currentStatus: 'WAITING' });
    for (const p of waitingPatients) {
        await QueueNode.create({
            queueId: 'Q-' + p._id,
            tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
            patientId: p._id,
            patientName: p.patientName,
            mrn: p.mrn,
            department: 'OPD',
            status: 'WAITING',
            doctor: 'To Be Assigned',
            time: '11:00 AM',
            date: new Date().toISOString().split('T')[0]
        });
    }
    console.log("Seeded initial queue entries.");

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
