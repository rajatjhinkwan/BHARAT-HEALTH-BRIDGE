import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodDonor from './src/models/BloodDonor.js';

dotenv.config();

const run = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb';
  console.log('Connecting to Mongo at:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'bhb' });
    console.log('Successfully connected!');
    const count = await BloodDonor.countDocuments();
    console.log('Number of BloodDonors in database:', count);
    if (count > 0) {
      const sample = await BloodDonor.findOne().lean();
      console.log('Sample donor record:', sample);
    }
  } catch (err) {
    console.error('Error checking donors:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
