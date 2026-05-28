/**
 * Seeds staff credentials, ward beds, and demo hospital data.
 * Run: npm run seed:all   (from back-end/)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bed from './src/models/Bed.js';
import { Hospital } from './src/models/index.js';
import { seedAllStaff } from './src/lib/seedStaff.js';
import { STAFF_DEFAULT_PASSWORD } from './src/lib/staffRegistry.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb';

const WARDS = [
  'ICU',
  'Ventilator Ward',
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Nephrology',
  'Pediatrics',
  'Emergency',
];

const ROOMS = ['Room 101', 'Room 102', 'Room 103'];

async function seedBeds() {
  await Bed.deleteMany({});
  const beds = [];
  let counter = 1;

  for (const wardName of WARDS) {
    const prefix = wardName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    for (const roomNumber of ROOMS) {
      for (let slot = 1; slot <= 2; slot++) {
        const bedId = `${prefix}-${roomNumber.replace(/\s/g, '')}-${String.fromCharCode(64 + slot)}`;
        beds.push({
          bedId,
          bedNumber: `${roomNumber} Bed ${slot}`,
          roomNumber,
          wardName,
          status: 'AVAILABLE',
          occupied: false,
          patientId: null,
        });
        counter++;
      }
    }
  }

  await Bed.insertMany(beds);
  console.log(`Seeded ${beds.length} beds across ${WARDS.length} wards`);
}

async function seedStaff() {
  const results = await seedAllStaff();
  for (const r of results) {
    console.log(`Staff: ${r.employeeId} (${r.role}) — ${r.department || '—'}`);
  }
}

async function seedHospitals() {
  const count = await Hospital.countDocuments();
  if (count > 0) return;
  await Hospital.insertMany([
    { name: 'Bharat Health Bridge Central', city: 'Delhi', type: 'Private', rating: 4.5, specialties: ['General Medicine', 'Cardiology', 'Emergency'] },
    { name: 'City Care Hospital', city: 'Mumbai', type: 'Private', rating: 4.2, specialties: ['Pediatrics', 'Neurology'] },
  ]);
  console.log('Seeded demo hospitals');
}

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: 'bhb' });
  console.log('Connected to MongoDB (bhb)\n');

  await seedStaff();
  await seedBeds();
  await seedHospitals();

  console.log(`\n--- Demo logins (password: ${STAFF_DEFAULT_PASSWORD}) ---`);
  console.log('Printable reference: front-end/public/staff-credentials.html');
  console.log('Reception:     REC-123        (no department field)');
  console.log('Lab:           LAB-123        (no department field)');
  console.log('Pharmacy:      PHA-123        (no department field)');
  console.log('OPD Doctor:    DOC-GEN-123    + dept: General Medicine');
  console.log('ICU Nurse:     NUR-ICU-123    + dept: ICU');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
