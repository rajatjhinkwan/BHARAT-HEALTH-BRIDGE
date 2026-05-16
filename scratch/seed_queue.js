import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient, User } from '../backend-old/src/models/index.js';
import QueueNode from '../backend-old/src/models/QueueNode.js';

dotenv.config({ path: './backend-old/.env' });

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

    // 2. Create Dummy Patients if they don't exist
    const dummyPatients = [
      { name: 'John Smith', age: 45, gender: 'Male', dept: 'Cardiology' },
      { name: 'Sarah Miller', age: 32, gender: 'Female', dept: 'Neurology' },
      { name: 'Robert Brown', age: 58, gender: 'Male', dept: 'Nephrology' },
      { name: 'Emily Davis', age: 24, gender: 'Female', dept: 'General Medicine' },
      { name: 'Michael Wilson', age: 67, gender: 'Male', dept: 'Cardiology' },
      { name: 'Jessica Taylor', age: 41, gender: 'Female', dept: 'Neurology' }
    ];

    const savedPatients = [];
    for (const p of dummyPatients) {
      let patient = await Patient.findOne({ patientName: p.name });
      if (!patient) {
        patient = new Patient({
          patientName: p.name,
          mrn: `UHID-${Math.floor(100000 + Math.random() * 900000)}`,
          age: p.age,
          gender: p.gender,
          phone: '9876543210',
          aadharCardId: `ADHR-${Math.floor(1000 + Math.random() * 9000)}`,
          currentStatus: 'REGISTERED'
        });
        await patient.save();
      }
      savedPatients.push({ ...p, id: patient._id });
    }

    // 3. Create Queue Nodes
    // Clear existing today's queue for fresh demo
    await QueueNode.deleteMany({ date: today });

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const symptoms = [
      'Severe chest pain and shortness of breath',
      'Persistent migraine and blurred vision',
      'Chronic kidney pain and swelling',
      'High fever and body ache',
      'Arrhythmia and dizziness',
      'Memory loss and confusion'
    ];

    for (let i = 0; i < savedPatients.length; i++) {
      const p = savedPatients[i];
      const deptCode = p.dept.substring(0, 5).toUpperCase().replace(/\s/g, '');
      const token = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;

      const node = new QueueNode({
        patientId: p.id,
        patientName: p.name,
        department: p.dept,
        tokenNumber: token,
        status: i < 2 ? 'WAITING' : (i === 2 ? 'IN_CONSULTATION' : 'COMPLETED'),
        priorityLevel: priorities[i % 4],
        symptoms: symptoms[i % symptoms.length],
        date: today,
        doctor: i === 2 ? doctors.find(d => d.department === p.dept)?.name || 'Dr. Sethi' : null,
        consultationStartTime: i === 2 ? new Date() : null
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
