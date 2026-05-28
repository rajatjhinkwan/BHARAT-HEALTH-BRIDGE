import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Hospital from '../models/Hospital.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/hospitals.json');

function inferSpecialties(name) {
  const n = name.toLowerCase();
  if (n.includes('district') || n.includes('base') || n.includes('civil')) {
    return ['General Medicine', 'Emergency', 'Surgery'];
  }
  if (n.includes('chc')) return ['General Medicine', 'Maternity', 'Emergency'];
  if (n.includes('phc')) return ['Primary Care', 'OPD'];
  if (n.includes('aiims') || n.includes('medical college')) {
    return ['Multispeciality', 'Emergency', 'ICU'];
  }
  return ['General Medicine'];
}

function inferFacilities(name, type) {
  const n = name.toLowerCase();
  const base = ['OPD', 'Ambulance'];
  if (n.includes('district') || n.includes('base') || n.includes('civil')) {
    return [...base, 'Emergency', 'ICU', 'Laboratory', 'Pharmacy'];
  }
  if (n.includes('chc')) return [...base, 'Emergency', 'Laboratory'];
  return base;
}

function toHospitalDoc(row) {
  const isPrivate = row.type === 'Private';
  const isMajor =
    /district|base|civil|doon|aiims|medical college|max|indiresh|himalayan/i.test(row.name);
  return {
    name: row.name,
    city: row.city,
    district: row.district,
    state: 'Uttarakhand',
    type: isPrivate ? 'Private' : 'Govt',
    rating: isMajor ? 4.2 : 3.8,
    specialties: inferSpecialties(row.name),
    latitude: row.latitude,
    longitude: row.longitude,
    location: {
      type: 'Point',
      coordinates: [row.longitude, row.latitude],
    },
    facilities: inferFacilities(row.name, row.type),
    emergency_support: /district|base|civil|chc|emergency|doon|aiims/i.test(row.name),
    ICU_count: isMajor ? 8 : /chc/i.test(row.name) ? 2 : 0,
    bed_count: isMajor ? 100 : /chc/i.test(row.name) ? 30 : 10,
    doctors_available: isMajor ? 20 : /chc/i.test(row.name) ? 5 : 2,
    address: `${row.name}, ${row.city}, ${row.district}, Uttarakhand`,
    source: 'manual',
    sno: row.sno,
  };
}

export async function seedUttarakhandHospitals(force = false) {
  const raw = readFileSync(DATA_PATH, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('hospitals.json is empty or invalid');
  }

  const count = await Hospital.countDocuments({ state: 'Uttarakhand' });
  if (!force && count >= rows.length - 5) {
    console.log(`Bootstrap: ${count} Uttarakhand hospitals already seeded`);
    return { inserted: 0, total: count };
  }

  await Hospital.deleteMany({ state: 'Uttarakhand' });
  const docs = rows.map(toHospitalDoc);
  await Hospital.insertMany(docs, { ordered: false });
  console.log(`Bootstrap: seeded ${docs.length} Uttarakhand hospitals`);
  return { inserted: docs.length, total: docs.length };
}
