import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import Bed from './src/models/Bed.js';
import PatientQueue from './src/models/PatientQueue.js';
import EmergencyCase from './src/models/EmergencyCase.js';
import QueueNode from './src/models/QueueNode.js';

dotenv.config();

const wards = [
  'GENERAL MEDICINE', 'CARDIOLOGY', 'NEUROLOGY', 'NEPHROLOGY', 'ORTHOPEDICS',
  'ENT', 'DERMATOLOGY', 'PEDIATRICS', 'GYNECOLOGY', 'PSYCHIATRY',
  'RADIOLOGY', 'ONCOLOGY', 'PULMONOLOGY', 'UROLOGY', 'GASTROENTEROLOGY',
  'ENDOCRINOLOGY', 'OPHTHALMOLOGY', 'EMERGENCY', 'ICU', 'VENTILATOR WARD',
  'TRAUMA WARD', 'SURGERY WARD', 'PATHOLOGY', 'LABORATORY', 'PHARMACY'
];

const patientNames = [
  'Arjun Mehta', 'Priya Iyer', 'Rohan Sharma', 'Ananya Gupta', 'Vikram Singh',
  'Sanya Malhotra', 'Kabir Das', 'Isha Verma', 'Aditya Roy', 'Riya Sen',
  'Siddharth Jain', 'Kavita Devi', 'Rahul Nair', 'Meera Reddy', 'Amitabh Bacchan',
  'Deepika Padukone', 'Ranveer Singh', 'Alia Bhatt', 'Varun Dhawan', 'Shraddha Kapoor',
  'Suresh Raina', 'Mahendra Singh', 'Virat Kohli', 'Rohit Sharma', 'Hardik Pandya',
  'Sunil Chhetri', 'Mary Kom', 'P.V. Sindhu', 'Neeraj Chopra', 'Saina Nehwal',
  'Rajesh Khanna', 'Hema Malini', 'Amit Trivedi', 'Arijit Singh', 'Shreya Ghoshal',
  'Narendra Modi', 'Rahul Gandhi', 'Arvind Kejriwal', 'Mamata Banerjee', 'Yogi Adityanath',
  'Elon Musk', 'Jeff Bezos', 'Bill Gates', 'Mark Zuckerberg', 'Steve Jobs',
  'Ratan Tata', 'Mukesh Ambani', 'Anand Mahindra', 'Gautam Adani', 'Azim Premji',
  'Nelson Mandela', 'Barack Obama', 'Angela Merkel', 'Justin Trudeau', 'Jacinda Ardern',
  'Lionel Messi', 'Cristiano Ronaldo', 'Neymar Jr', 'Kylian Mbappe', 'Luka Modric',
  'Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Serena Williams', 'Maria Sharapova',
  'Albert Einstein', 'Isaac Newton', 'Nikola Tesla', 'Marie Curie', 'Charles Darwin',
  'William Shakespeare', 'Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Michelangelo',
  'Sherlock Holmes', 'Harry Potter', 'Tony Stark', 'Bruce Wayne', 'Peter Parker',
  'Clark Kent', 'Diana Prince', 'Wanda Maximoff', 'Natasha Romanoff', 'Steve Rogers',
  'James Bond', 'Indiana Jones', 'Jack Sparrow', 'Ellen Ripley', 'Sarah Connor'
];

const doctorNames = [
  'Dr. A.K. Bansal', 'Dr. S. Mukherjee', 'Dr. V. Kurien', 'Dr. N. Sethi', 'Dr. P. Hegde',
  'Dr. R. Marwah', 'Dr. J. Dsouza', 'Dr. K. Mittal', 'Dr. S. Rao', 'Dr. L. Fernandez',
  'Dr. M. Chawla', 'Dr. G. Reddy', 'Dr. T. Singh', 'Dr. B. Patel', 'Dr. D. Gupta'
];

const nurseNames = [
  'Sister Mary', 'Nurse Kavita', 'Sister Lucy', 'Nurse Priya', 'Sister Reena',
  'Nurse Sneha', 'Sister Ancy', 'Nurse Deepa', 'Sister Mini', 'Nurse Shiny'
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

    // Create Admin and Reception
    await User.create({
      name: 'Super Admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'ADMIN'
    });

    await User.create({
      name: 'Main Reception',
      email: 'reception@hospital.com',
      password: hashedPassword,
      role: 'RECEPTIONIST'
    });

    let patientIndex = 0;

    for (let i = 0; i < wards.length; i++) {
      const ward = wards[i];
      const wardPrefix = ward.substring(0, 3).toUpperCase().replace(/\s/g, '');
      console.log(`Seeding Ward: ${ward}...`);

      // 1. Create Ward Staff
      const drName = doctorNames[i % doctorNames.length];
      const nurseName = nurseNames[i % nurseNames.length];

      const doctor = await User.create({
        name: drName,
        email: `${ward.toLowerCase().replace(/\s/g, '_')}_doctor@hospital.com`,
        password: hashedPassword,
        role: 'DOCTOR',
        department: ward,
        specialization: `${ward} Specialist`,
        availabilityStatus: 'AVAILABLE'
      });

      const nurse = await User.create({
        name: nurseName,
        email: `${ward.toLowerCase().replace(/\s/g, '_')}_nurse@hospital.com`,
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
