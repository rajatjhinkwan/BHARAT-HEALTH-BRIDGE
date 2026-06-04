import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import MedicalHistory from '../src/models/MedicalHistory.js';
import Block from '../src/models/Block.js';

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bharat-health-bridge';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const records = await MedicalHistory.find({ title: /\[ALERT\]/ });
  console.log(`Found ${records.length} tampered records`);

  for (const record of records) {
    // Revert title: [ALERT] UN... (Original Title)
    const match = record.title.match(/\((.*?)\)$/);
    if (match) {
      record.title = match[1];
    } else {
      record.title = record.title.replace(/\[ALERT\].*? /, '');
    }

    if (record.type === 'prescription' && record.prescriptionDetails && record.prescriptionDetails.diagnosis && record.prescriptionDetails.diagnosis.includes('HACKED')) {
      record.prescriptionDetails.diagnosis = 'Restored Diagnosis';
    }

    await record.save();
    console.log(`Restored record ${record._id}`);
  }

  console.log('Dropping blocks to recreate them cleanly...');
  await Block.deleteMany({});
  
  console.log('Done. Please go back to the dashboard and click "Sync Historical Records" to rebuild the chain.');
  process.exit(0);
}

run().catch(console.error);
