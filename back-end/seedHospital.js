import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import Bed from './src/models/Bed.js';
import PatientQueue from './src/models/PatientQueue.js';
import EmergencyCase from './src/models/EmergencyCase.js';
import QueueNode from './src/models/QueueNode.js';
import { STAFF_REGISTRY } from './src/lib/staffRegistry.js';

dotenv.config();

const wards = [
  'General Medicine', 'Cardiology', 'Neurology', 'Nephrology', 'Orthopedics',
  'ENT', 'Dermatology', 'Pediatrics', 'Gynecology', 'Psychiatry',
  'Radiology', 'Oncology', 'Pulmonology', 'Urology', 'Gastroenterology',
  'Endocrinology', 'Ophthalmology', 'Emergency', 'ICU', 'Ventilator Ward',
  'Trauma Ward', 'Surgery Ward'
];

const patientNames = [
  'Arjun Mehta', 'Priya Iyer', 'Rohan Sharma', 'Ananya Gupta', 'Vikram Singh',
  'Sanya Malhotra', 'Kabir Das', 'Isha Verma', 'Aditya Roy', 'Riya Sen',
  'Siddharth Jain', 'Kavita Devi', 'Rahul Nair', 'Meera Reddy', 'Suresh Pillai',
  'Deepa Menon', 'Rajesh Khurana', 'Alka Sharma', 'Varun Desai', 'Shraddha Joshi',
  'Sunil Chhetri', 'P.V. Sindhu', 'Neeraj Chopra', 'Manish Gupta', 'Pooja Verma',
  'Ratan Singh', 'Mukesh Yadav', 'Anand Rao', 'Gautam Patel', 'Azim Khan',
  'Lakshmi Devi', 'Harish Nambiar', 'Geeta Reddy', 'Sanjay Malhotra', 'Nirmala Iyer',
  'Amit Verma', 'Sunita Devi', 'Ramesh Chandra', 'Usha Pillai', 'Vijay Kumar',
  'Preeti Singh', 'Mohit Sharma', 'Divya Nair', 'Kiran Patel', 'Ashok Mehta',
  'Rekha Devi', 'Suresh Babu', 'Lata Menon', 'Gopal Iyer', 'Hari Prasad',
];

const generateMRN = () => `MRN-${Math.floor(100000 + Math.random() * 900000)}`;

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bhb');
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing existing data...');
    await Patient.deleteMany({});
    await Bed.deleteMany({});
    await User.deleteMany({});
    await PatientQueue.deleteMany({});
    await EmergencyCase.deleteMany({});
    await QueueNode.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin, Reception, Lab and Pharmacy
    await User.create({
      name: 'Super Admin',
      email: 'admin@hospital.com',
      employeeId: 'SAD-123',
      password: hashedPassword,
      role: 'ADMIN'
    });

    await User.create({
      name: 'Main Receptionist',
      email: 'reception@hospital.com',
      employeeId: 'REC-123',
      password: hashedPassword,
      role: 'RECEPTIONIST'
    });

    await User.create({
      name: 'Chief Lab Technician',
      email: 'lab@hospital.com',
      employeeId: 'LAB-123',
      password: hashedPassword,
      role: 'LAB_TECH'
    });

    await User.create({
      name: 'Chief Pharmacist',
      email: 'pharmacy@hospital.com',
      employeeId: 'PHA-123',
      password: hashedPassword,
      role: 'PHARMACIST'
    });

    let patientIndex = 0;

    for (let i = 0; i < wards.length; i++) {
      const ward = wards[i];
      const wardPrefix = ward.substring(0, 3).toUpperCase().replace(/\s/g, '');
      console.log(`Seeding Ward: ${ward}...`);

      // Look up doctor and nurse from STAFF_REGISTRY
      const regDoc = STAFF_REGISTRY.find(s => s.role === 'doctor' && s.department === ward);
      const regNurse = STAFF_REGISTRY.find(s => s.role === 'nurse' && s.department === ward);

      if (!regDoc || !regNurse) {
        throw new Error(`Doctor or nurse not found in staff registry for department: ${ward}`);
      }

      // 1. Create Ward Staff
      const doctor = await User.create({
        name: regDoc.name,
        email: `${ward.toLowerCase().replace(/\s/g, '_')}_doctor@hospital.com`,
        employeeId: regDoc.employeeId,
        password: hashedPassword,
        role: 'DOCTOR',
        department: ward,
        specialization: regDoc.specialization || `${ward} Specialist`,
        availabilityStatus: 'AVAILABLE'
      });

      const nurse = await User.create({
        name: regNurse.name,
        email: `${ward.toLowerCase().replace(/\s/g, '_')}_nurse@hospital.com`,
        employeeId: regNurse.employeeId,
        password: hashedPassword,
        role: 'NURSE',
        department: ward,
        assignedWard: ward
      });

      // 2. Create Rooms for this Ward
      const roomNames = ['Room 101', 'Room 102', 'Room 103'];
      if (ward === 'ICU') roomNames[0] = 'ICU Main';
      if (ward === 'Emergency') roomNames[0] = 'Triage Area';

      for (const roomName of roomNames) {
        // 3. Create Beds for this Room (4 beds per room)
        const bedsInRoom = [];
        for (let j = 1; j <= 4; j++) {
          const bedId = `${wardPrefix}-${roomName.split(' ').pop()}-${j}`;
          const bed = await Bed.create({
            bedId: bedId,
            bedNumber: j.toString(),
            roomNumber: roomName,
            wardName: ward,
            status: 'AVAILABLE',
            occupied: false
          });
          bedsInRoom.push(bed);
        }

        // 4. Populate some beds with patients
        // Each room has different occupancy level
        const occupancyLevel = Math.floor(Math.random() * 3) + 1; // 1 to 3 patients per 4 beds
        for (let k = 0; k < occupancyLevel; k++) {
          const name = patientNames[patientIndex % patientNames.length];
          patientIndex++;
          
          const isCritical = ward === 'ICU' || ward === 'Ventilator Ward' || Math.random() > 0.8;
          const status = isCritical ? 'CRITICAL' : (Math.random() > 0.6 ? 'UNDER OBSERVATION' : 'ADMITTED');

          const patient = await Patient.create({
            patientName: name,
            mrn: generateMRN(),
            dob: '1990-01-01',
            age: Math.floor(Math.random() * 60) + 20,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            phone: '9876543210',
            email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
            address: '123 Hospital Lane, New Delhi',
            aadharCardId: `AADHAR-${Math.floor(1000 + Math.random() * 9000)}`,
            currentWard: ward,
            currentRoom: roomName,
            currentBed: bedsInRoom[k].bedId,
            currentStatus: status,
            assignedDoctor: doctor.name,
            assignedNurse: nurse.name,
            admissionDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
            vitals: [{
              bp: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 20)}`,
              heartRate: isCritical ? (100 + Math.floor(Math.random() * 40)) : (70 + Math.floor(Math.random() * 20)),
              temp: (98 + Math.random() * 4).toFixed(1),
              spo2: isCritical ? (85 + Math.floor(Math.random() * 10)) : (95 + Math.floor(Math.random() * 5)),
              respiratoryRate: 16 + Math.floor(Math.random() * 8),
              recordedBy: nurse.name,
              timestamp: new Date()
            }],
            timeline: [{
              action: 'ADMITTED',
              department: ward,
              performedBy: 'Receptionist',
              details: `Patient admitted to ${ward}, ${roomName}. Assigned bed: ${bedsInRoom[k].bedId}`
            }]
          });

          // Link bed to patient
          bedsInRoom[k].occupied = true;
          bedsInRoom[k].patientId = patient._id;
          bedsInRoom[k].status = isCritical ? 'CRITICAL' : 'OCCUPIED';
          await bedsInRoom[k].save();
        }
        
        // Mark one bed as under maintenance occasionally
        if (Math.random() > 0.8) {
            const maintenanceBed = bedsInRoom[3];
            if (!maintenanceBed.occupied) {
                maintenanceBed.status = 'UNDER_MAINTENANCE';
                await maintenanceBed.save();
            }
        }
      }

      // 5. Create Queue data for this ward
      // One patient "In Consultation"
      const consultationPatientName = `Consultation ${ward} Patient`;
      const consultationMRN = generateMRN();
      const qnId = `QN-CONS-${wardPrefix}-${i}`;
      
      const consultPatient = await Patient.create({
          patientName: consultationPatientName,
          mrn: consultationMRN,
          dob: '1985-05-20',
          age: 35,
          gender: 'Female',
          phone: '9876543210',
          address: '456 Consultation Row, Delhi',
          aadharCardId: `AADHAR-CONS-${i}`,
          currentDepartment: ward,
          currentStatus: 'IN CONSULTATION',
          assignedDoctor: doctor.name
      });

      await QueueNode.create({
          queueId: qnId,
          tokenNumber: `${wardPrefix.substring(0,2)}-${300 + i}`,
          patientId: consultPatient._id,
          patientName: consultationPatientName,
          mrn: consultationMRN,
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM',
          doctor: doctor.name,
          department: ward,
          status: 'IN_CONSULTATION'
      });

      // Two patients "Waiting"
      for (let w = 0; w < 2; w++) {
          const waitingName = `Waiting ${ward} ${w+1}`;
          const waitingMRN = generateMRN();
          
          await QueueNode.create({
              queueId: `QN-WAIT-${wardPrefix}-${i}-${w}`,
              tokenNumber: `${wardPrefix.substring(0,2)}-${400 + i + w}`,
              patientId: new mongoose.Types.ObjectId(), // Placeholder
              patientName: waitingName,
              mrn: waitingMRN,
              date: new Date().toISOString().split('T')[0],
              time: '12:00 PM',
              doctor: 'To Be Assigned',
              department: ward,
              status: 'WAITING'
          });
      }

      // 6. Seed Emergency Case if ward is Emergency
      if (ward === 'Emergency') {
        await EmergencyCase.create({
          caseId: `EMER-${Date.now()}`,
          patientName: 'Unknown Trauma Patient',
          age: 45,
          gender: 'Male',
          emergencyType: 'Accident/Trauma',
          condition: 'CRITICAL',
          priority: 'Critical',
          status: 'ACTIVE'
        });
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
