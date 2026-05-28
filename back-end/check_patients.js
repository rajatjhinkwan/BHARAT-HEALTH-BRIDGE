import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/Patient.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB.');
    const total = await Patient.countDocuments({});
    console.log(`TOTAL PATIENTS: ${total}`);
    const patients = await Patient.find({}).select('patientName _id mrn phone email');
    console.log('PATIENTS LIST:');
    console.log(JSON.stringify(patients, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

check();
