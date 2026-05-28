import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient, User } from './src/models/index.js';
import QueueNode from './src/models/QueueNode.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'bhb' });
    console.log('Connected to MongoDB for seeding...');

    // 1. Find some doctors to assign to
    const doctors = await User.find({ role: 'DOCTOR' });
    if (doctors.length === 0) {
      console.log('No doctors found. Please ensure you have seeded users first.');
      process.exit(1);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString();

    // 2. Create Dummy Patients
    const dummyPatients = [
      { name: 'Arjun Mehta', age: 45, gender: 'Male', dept: 'Cardiology' },
      { name: 'Priya Iyer', age: 32, gender: 'Female', dept: 'Neurology' },
      { name: 'Rohan Sharma', age: 58, gender: 'Male', dept: 'Nephrology' },
      { name: 'Kavita Devi', age: 24, gender: 'Female', dept: 'General Medicine' },
      { name: 'Vikram Singh', age: 67, gender: 'Male', dept: 'Cardiology' },
      { name: 'Ananya Gupta', age: 41, gender: 'Female', dept: 'Neurology' },
      { name: 'Suresh Pillai', age: 55, gender: 'Male', dept: 'Nephrology' },
      { name: 'Meera Reddy', age: 29, gender: 'Female', dept: 'Cardiology' },
    ];

    const savedPatients = [];
    for (const p of dummyPatients) {
      let patient = await Patient.findOne({ patientName: p.name });
      if (!patient) {
        patient = new Patient({
          patientName: p.name,
          mrn: `UHID-${Math.floor(100000 + Math.random() * 900000)}`,
          age: p.age,
          dob: '1980-01-01',
          gender: p.gender,
          phone: '9876543210',
          address: '123 Medical Lane, New Delhi',
          aadharCardId: `ADHR-${Math.floor(1000 + Math.random() * 9000)}`,
          currentStatus: 'REGISTERED'
        });
        await patient.save();
      }
      savedPatients.push({ ...p, id: patient._id, mrn: patient.mrn });
    }

    // 3. Create Queue Nodes
    await QueueNode.deleteMany({ date: today });

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const symptomsList = [
      'Severe chest pain and shortness of breath',
      'Persistent migraine and blurred vision',
      'Chronic kidney pain and swelling',
      'High fever and body ache',
      'Arrhythmia and dizziness',
      'Memory loss and confusion',
      'Lower back pain and numbness',
      'Palpitations and fatigue'
    ];

    for (let i = 0; i < savedPatients.length; i++) {
      const p = savedPatients[i];
      const deptCode = p.dept.substring(0, 5).toUpperCase().replace(/\s/g, '');
      const token = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;

      let status = 'WAITING';
      if (i >= 4 && i < 6) status = 'IN_CONSULTATION';
      if (i >= 6) status = 'COMPLETED';

      const assignedDoctor = doctors.find(d => d.department === p.dept) || doctors[0];

      const node = new QueueNode({
        queueId: `QID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        patientId: p.id,
        patientName: p.name,
        mrn: p.mrn,
        department: p.dept,
        tokenNumber: token,
        status: status,
        priorityLevel: priorities[i % 4],
        symptoms: symptomsList[i % symptomsList.length],
        date: today,
        time: now,
        doctor: assignedDoctor.name,
        consultationStartTime: status === 'IN_CONSULTATION' ? new Date() : null
      });

      await node.save();
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
