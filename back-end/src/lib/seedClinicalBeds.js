import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import { CLINICAL_WARD_KEYS } from './wards.js';

const ROOMS = ['Room 101', 'Room 102', 'Room 103'];
const INDIAN_NAMES = [
  'Arjun Mehta', 'Priya Iyer', 'Rohan Sharma', 'Ananya Gupta', 'Vikram Singh',
  'Kavita Devi', 'Rahul Nair', 'Meera Reddy', 'Suresh Raina', 'P.V. Sindhu',
];

function generateMRN() {
  return `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function ensureClinicalBeds() {
  for (const ward of CLINICAL_WARD_KEYS) {
    const existing = await Bed.countDocuments({ wardName: ward });
    if (existing >= 8) continue;

    const wardPrefix = ward.replace(/\s/g, '').substring(0, 4).toUpperCase();
    for (const roomName of ROOMS) {
      for (let j = 1; j <= 4; j++) {
        const bedId = `${wardPrefix}-${roomName.split(' ').pop()}-${j}`;
        const exists = await Bed.findOne({ bedId });
        if (exists) continue;

        const shouldOccupy = Math.random() > 0.55;
        const shouldClean = !shouldOccupy && Math.random() > 0.85;
        let status = 'AVAILABLE';
        if (shouldClean) status = 'CLEANING';
        else if (shouldOccupy) status = ward.includes('ICU') && Math.random() > 0.7 ? 'CRITICAL' : 'OCCUPIED';

        const bed = await Bed.create({
          bedId,
          bedNumber: String(j),
          roomNumber: roomName,
          wardName: ward,
          status,
          occupied: status === 'OCCUPIED' || status === 'CRITICAL',
        });

        if (bed.occupied) {
          const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
          const patient = await Patient.create({
            patientName: name,
            mrn: generateMRN(),
            dob: '1985-06-15',
            age: 35 + Math.floor(Math.random() * 30),
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            phone: '9876543210',
            address: 'Dehradun, Uttarakhand',
            aadharCardId: `9876-5432-${Math.floor(1000 + Math.random() * 9000)}`,
            currentWard: ward,
            currentRoom: roomName,
            currentBed: bed.bedId,
            currentStatus: status === 'CRITICAL' ? 'CRITICAL' : 'ADMITTED',
            admissionDate: new Date(),
          });
          bed.patientId = patient._id;
          await bed.save();
        }
      }
    }
    console.log(`Bootstrap: clinical beds ensured for ${ward}`);
  }
}
