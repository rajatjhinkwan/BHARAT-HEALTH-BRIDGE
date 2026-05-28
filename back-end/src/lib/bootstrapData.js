import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Bed from '../models/Bed.js';

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

const SEED_HOSPITALS = [
  {
    name: 'District Hospital Almora',
    city: 'Almora',
    district: 'Almora',
    type: 'Govt',
    rating: 4.2,
    specialties: ['General Medicine', 'Emergency', 'Pediatrics'],
    latitude: 29.5898,
    longitude: 79.6467,
    facilities: ['Emergency', 'ICU', 'Ambulance', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 15,
    bed_count: 150,
    doctors_available: 24,
    contact_phone: '+91-5962-230012',
    address: 'Near Mall Road, Almora, Uttarakhand'
  },
  {
    name: 'CHC Bhikiasain',
    city: 'Bhikiasain',
    district: 'Almora',
    type: 'Govt',
    rating: 3.9,
    specialties: ['General Medicine', 'Family Medicine'],
    latitude: 29.7093,
    longitude: 79.2887,
    facilities: ['Emergency', 'Ambulance', 'OPD'],
    emergency_support: true,
    ICU_count: 2,
    bed_count: 30,
    doctors_available: 4,
    contact_phone: '+91-5966-224412',
    address: 'Bhikiasain Road, Almora, Uttarakhand'
  },
  {
    name: 'PHC Danya',
    city: 'Danya',
    district: 'Almora',
    type: 'Govt',
    rating: 3.5,
    specialties: ['Primary Care', 'General Medicine'],
    latitude: 29.5706,
    longitude: 79.8278,
    facilities: ['OPD', 'Maternity Care'],
    emergency_support: false,
    ICU_count: 0,
    bed_count: 10,
    doctors_available: 2,
    contact_phone: '+91-5962-284451',
    address: 'Danya Bazaar, Almora, Uttarakhand'
  },
  {
    name: 'CHC Dwarahat',
    city: 'Dwarahat',
    district: 'Almora',
    type: 'Govt',
    rating: 4.0,
    specialties: ['General Surgery', 'Orthopedics', 'Pediatrics'],
    latitude: 29.7708,
    longitude: 79.4278,
    facilities: ['Emergency', 'Ambulance', 'Laboratory'],
    emergency_support: true,
    ICU_count: 5,
    bed_count: 50,
    doctors_available: 8,
    contact_phone: '+91-5966-244221',
    address: 'Near Dwarahat Temple, Almora, Uttarakhand'
  },
  {
    name: 'PHC Jageshwar',
    city: 'Jageshwar',
    district: 'Almora',
    type: 'Govt',
    rating: 3.7,
    specialties: ['Primary Care'],
    latitude: 29.6306,
    longitude: 79.8583,
    facilities: ['OPD', 'First Aid'],
    emergency_support: false,
    ICU_count: 0,
    bed_count: 8,
    doctors_available: 1,
    contact_phone: '+91-5962-263301',
    address: 'Jageshwar Dham, Almora, Uttarakhand'
  },
  {
    name: 'Combined Hospital Ranikhet',
    city: 'Ranikhet',
    district: 'Almora',
    type: 'Govt',
    rating: 4.3,
    specialties: ['Cardiology', 'General Surgery', 'Pediatrics', 'Obstetrics'],
    latitude: 29.6450,
    longitude: 79.4333,
    facilities: ['Emergency', 'ICU', 'Ambulance', 'Blood Bank'],
    emergency_support: true,
    ICU_count: 10,
    bed_count: 100,
    doctors_available: 16,
    contact_phone: '+91-5966-220132',
    address: 'Sadar Bazaar, Ranikhet, Almora, Uttarakhand'
  },
  {
    name: 'District Hospital Bageshwar',
    city: 'Bageshwar',
    district: 'Bageshwar',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'General Surgery', 'Orthopedics', 'Pediatrics'],
    latitude: 29.8398,
    longitude: 79.7725,
    facilities: ['Emergency', 'ICU', 'Ambulance', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 8,
    bed_count: 120,
    doctors_available: 18,
    contact_phone: '+91-5963-222015',
    address: 'Pindari Road, Bageshwar, Uttarakhand'
  },
  {
    name: 'CHC Garur',
    city: 'Garur',
    district: 'Bageshwar',
    type: 'Govt',
    rating: 3.8,
    specialties: ['General Medicine', 'Maternity Care'],
    latitude: 29.9306,
    longitude: 79.6133,
    facilities: ['Emergency', 'Ambulance', 'OPD'],
    emergency_support: true,
    ICU_count: 2,
    bed_count: 40,
    doctors_available: 5,
    contact_phone: '+91-5963-250041',
    address: 'Garur Bazaar, Bageshwar, Uttarakhand'
  },
  {
    name: 'PHC Badrinath',
    city: 'Badrinath',
    district: 'Chamoli',
    type: 'Govt',
    rating: 4.2,
    specialties: ['Emergency Medicine', 'Altitude Sickness Treatment', 'Primary Care'],
    latitude: 30.7433,
    longitude: 79.4933,
    facilities: ['Oxygen Support', 'Emergency Room', 'Ambulance'],
    emergency_support: true,
    ICU_count: 4,
    bed_count: 25,
    doctors_available: 6,
    contact_phone: '+91-1381-222208',
    address: 'Near Badrinath Temple, Chamoli, Uttarakhand'
  },
  {
    name: 'District Hospital Chamoli',
    city: 'Gopeshwar',
    district: 'Chamoli',
    type: 'Govt',
    rating: 4.3,
    specialties: ['Cardiology', 'General Surgery', 'Trauma Center', 'Orthopedics'],
    latitude: 30.4022,
    longitude: 79.3247,
    facilities: ['Emergency', 'ICU', 'Blood Bank', 'Ambulance', '24x7 Pharmacy'],
    emergency_support: true,
    ICU_count: 12,
    bed_count: 140,
    doctors_available: 22,
    contact_phone: '+91-1372-252243',
    address: 'Gopeshwar Bypass Road, Chamoli, Uttarakhand'
  },
  {
    name: 'CHC Joshimath',
    city: 'Joshimath',
    district: 'Chamoli',
    type: 'Govt',
    rating: 4.0,
    specialties: ['Altitude Care', 'General Medicine', 'Orthopedics'],
    latitude: 30.5505,
    longitude: 79.5667,
    facilities: ['Emergency Room', 'Oxygen Concentrators', 'Ambulance'],
    emergency_support: true,
    ICU_count: 5,
    bed_count: 50,
    doctors_available: 8,
    contact_phone: '+91-1389-222165',
    address: 'Auli Road, Joshimath, Chamoli, Uttarakhand'
  },
  {
    name: 'CHC Karanprayag',
    city: 'Karanprayag',
    district: 'Chamoli',
    type: 'Govt',
    rating: 4.1,
    specialties: ['Trauma Care', 'General Surgery', 'Pediatrics'],
    latitude: 30.2583,
    longitude: 79.2167,
    facilities: ['24x7 Emergency', 'Ambulance', 'X-Ray Lab'],
    emergency_support: true,
    ICU_count: 6,
    bed_count: 60,
    doctors_available: 10,
    contact_phone: '+91-1363-244222',
    address: 'Near Karanprayag Confluence, Chamoli, Uttarakhand'
  },
  {
    name: 'District Hospital Champawat',
    city: 'Champawat',
    district: 'Champawat',
    type: 'Govt',
    rating: 4.0,
    specialties: ['General Medicine', 'General Surgery', 'Obstetrics'],
    latitude: 29.3367,
    longitude: 80.1000,
    facilities: ['Emergency Room', 'Ambulance', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 5,
    bed_count: 80,
    doctors_available: 12,
    contact_phone: '+91-5965-230015',
    address: 'NH-9 Bypass, Champawat, Uttarakhand'
  },
  {
    name: 'Combined Hospital Tanakpur',
    city: 'Tanakpur',
    district: 'Champawat',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Surgery', 'Orthopedics', 'Pediatrics'],
    latitude: 29.0667,
    longitude: 80.1000,
    facilities: ['Emergency', 'ICU', 'Ambulance', 'Laboratory'],
    emergency_support: true,
    ICU_count: 6,
    bed_count: 70,
    doctors_available: 11,
    contact_phone: '+91-5965-224425',
    address: 'Railway Station Road, Tanakpur, Champawat, Uttarakhand'
  },
  {
    name: 'Coronation Hospital',
    city: 'Dehradun',
    district: 'Dehradun',
    type: 'Govt',
    rating: 4.4,
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine'],
    latitude: 30.3205,
    longitude: 78.0333,
    facilities: ['Advanced ICU', 'CT Scan', 'MRI', 'Blood Bank', 'Ambulance'],
    emergency_support: true,
    ICU_count: 25,
    bed_count: 200,
    doctors_available: 55,
    contact_phone: '+91-135-2651033',
    address: 'Dalanwala, Dehradun, Uttarakhand'
  },
  {
    name: 'Government Doon Medical College Hospital',
    city: 'Dehradun',
    district: 'Dehradun',
    type: 'Govt',
    rating: 4.2,
    specialties: ['Multispeciality', 'Trauma Center', 'ICU Ward', 'Cardiology'],
    latitude: 30.3225,
    longitude: 78.0333,
    facilities: ['Emergency Multi-Bed', 'Advanced Diagnostics', 'Burn Ward'],
    emergency_support: true,
    ICU_count: 40,
    bed_count: 650,
    doctors_available: 180,
    contact_phone: '+91-135-2726021',
    address: 'Deewan Bahadur Road, Dehradun, Uttarakhand'
  },
  {
    name: 'Shri Mahant Indiresh Hospital',
    city: 'Dehradun',
    district: 'Dehradun',
    type: 'Private',
    rating: 4.3,
    specialties: ['Super Speciality', 'Nephrology', 'Neurology', 'Urology'],
    latitude: 30.3106,
    longitude: 78.0167,
    facilities: ['Dialysis Center', 'Modular OT', '24x7 Emergency', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 35,
    bed_count: 750,
    doctors_available: 150,
    contact_phone: '+91-135-2522200',
    address: 'Patel Nagar, Dehradun, Uttarakhand'
  },
  {
    name: 'Max Super Speciality Hospital',
    city: 'Dehradun',
    district: 'Dehradun',
    type: 'Private',
    rating: 4.7,
    specialties: ['Cardiology', 'Oncology', 'Neurosciences', 'Orthopedics'],
    latitude: 30.3706,
    longitude: 78.0667,
    facilities: ['Advanced Diagnostics', 'Helipad', 'Cardiac ICU', 'Ambulance'],
    emergency_support: true,
    ICU_count: 50,
    bed_count: 300,
    doctors_available: 110,
    contact_phone: '+91-135-7193000',
    address: 'Mussoorie Diversion Road, Malsi, Dehradun, Uttarakhand'
  },
  {
    name: 'District Hospital Haridwar',
    city: 'Haridwar',
    district: 'Haridwar',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'Trauma Center', 'Obstetrics', 'Pediatrics'],
    latitude: 29.9497,
    longitude: 78.1333,
    facilities: ['Emergency Room', 'Ambulance', 'Blood Storage', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 15,
    bed_count: 220,
    doctors_available: 36,
    contact_phone: '+91-1334-226063',
    address: 'Devpura, Haridwar, Uttarakhand'
  },
  {
    name: 'Civil Hospital Roorkee',
    city: 'Roorkee',
    district: 'Haridwar',
    type: 'Govt',
    rating: 4.2,
    specialties: ['General Medicine', 'General Surgery', 'Orthopedics'],
    latitude: 29.8500,
    longitude: 77.8833,
    facilities: ['Emergency Ward', 'Ambulance', 'X-Ray Lab'],
    emergency_support: true,
    ICU_count: 10,
    bed_count: 150,
    doctors_available: 28,
    contact_phone: '+91-1332-262102',
    address: 'Civil Lines, Roorkee, Haridwar, Uttarakhand'
  },
  {
    name: 'Base Hospital Haldwani',
    city: 'Haldwani',
    district: 'Nainital',
    type: 'Govt',
    rating: 4.2,
    specialties: ['Multispeciality', 'Trauma Center', 'Orthopedics', 'Emergency'],
    latitude: 29.2167,
    longitude: 79.5167,
    facilities: ['Trauma Wing', 'ICU Wards', 'Pharmacy', 'Ambulance Fleet'],
    emergency_support: true,
    ICU_count: 20,
    bed_count: 300,
    doctors_available: 64,
    contact_phone: '+91-5946-250102',
    address: 'Nainital Road, Haldwani, Nainital, Uttarakhand'
  },
  {
    name: 'Dr. Susheela Tiwari Govt Hospital',
    city: 'Haldwani',
    district: 'Nainital',
    type: 'Govt',
    rating: 4.4,
    specialties: ['Cardiology', 'Nephrology', 'Burn Unit', 'Advanced Diagnostics'],
    latitude: 29.2185,
    longitude: 79.5195,
    facilities: ['Dialysis Unit', 'Advanced ICU', 'CT-Scan/MRI', 'Blood Bank'],
    emergency_support: true,
    ICU_count: 45,
    bed_count: 700,
    doctors_available: 195,
    contact_phone: '+91-5946-234423',
    address: 'Rampur Road, Haldwani, Nainital, Uttarakhand'
  },
  {
    name: 'B.D. Pandey District Hospital Nainital',
    city: 'Nainital',
    district: 'Nainital',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'Pediatrics', 'Obstetrics & Gynecology'],
    latitude: 29.3833,
    longitude: 79.4500,
    facilities: ['Emergency Response', 'ICU Care', 'Ambulance', 'Laboratory'],
    emergency_support: true,
    ICU_count: 8,
    bed_count: 120,
    doctors_available: 20,
    contact_phone: '+91-5942-235022',
    address: 'Mallital, Nainital, Uttarakhand'
  },
  {
    name: 'District Hospital Pithoragarh',
    city: 'Pithoragarh',
    district: 'Pithoragarh',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'General Surgery', 'Orthopedics', 'Pediatrics'],
    latitude: 29.5833,
    longitude: 80.2167,
    facilities: ['Emergency room', 'Blood storage', 'Ambulance', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 8,
    bed_count: 150,
    doctors_available: 24,
    contact_phone: '+91-5964-222018',
    address: 'Near Bus Station, Pithoragarh, Uttarakhand'
  },
  {
    name: 'District Hospital Rudraprayag',
    city: 'Rudraprayag',
    district: 'Rudraprayag',
    type: 'Govt',
    rating: 4.2,
    specialties: ['Trauma Center', 'Altitude Medicine', 'General Medicine'],
    latitude: 30.2833,
    longitude: 78.9833,
    facilities: ['Emergency Disaster Ward', 'Ambulance Service', 'Oxygen Concentrators'],
    emergency_support: true,
    ICU_count: 6,
    bed_count: 75,
    doctors_available: 12,
    contact_phone: '+91-1364-233310',
    address: 'Kedarnath Road, Rudraprayag, Uttarakhand'
  },
  {
    name: 'District Hospital Tehri',
    city: 'New Tehri',
    district: 'Tehri Garhwal',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'General Surgery', 'Maternity Care', 'Pediatrics'],
    latitude: 30.3833,
    longitude: 78.4833,
    facilities: ['Emergency ER', 'Ambulance', 'Laboratory', 'Pharmacy'],
    emergency_support: true,
    ICU_count: 8,
    bed_count: 110,
    doctors_available: 19,
    contact_phone: '+91-1376-234015',
    address: 'Baurari, New Tehri, Uttarakhand'
  },
  {
    name: 'District Hospital Uttarkashi',
    city: 'Uttarkashi',
    district: 'Uttarkashi',
    type: 'Govt',
    rating: 4.2,
    specialties: ['Emergency medicine', 'Trauma response', 'General Surgery'],
    latitude: 30.7333,
    longitude: 78.4333,
    facilities: ['24x7 ER Care', 'ICU Suite', 'Ambulance', 'Diagnostics'],
    emergency_support: true,
    ICU_count: 8,
    bed_count: 100,
    doctors_available: 17,
    contact_phone: '+91-1374-222103',
    address: 'Court Road, Uttarkashi, Uttarakhand'
  },
  {
    name: 'L.D. Bhatt Hospital Kashipur',
    city: 'Kashipur',
    district: 'Udham Singh Nagar',
    type: 'Govt',
    rating: 4.1,
    specialties: ['General Medicine', 'General Surgery', 'Pediatrics'],
    latitude: 29.2205,
    longitude: 78.9500,
    facilities: ['24x7 Emergency Room', 'Maternity Ward', 'Ambulance'],
    emergency_support: true,
    ICU_count: 10,
    bed_count: 120,
    doctors_available: 22,
    contact_phone: '+91-5947-275323',
    address: 'Ramnagar Road, Kashipur, Udham Singh Nagar, Uttarakhand'
  },
  {
    name: 'District Hospital Rudrapur',
    city: 'Rudrapur',
    district: 'Udham Singh Nagar',
    type: 'Govt',
    rating: 4.2,
    specialties: ['General Medicine', 'Orthopedics', 'Emergency Medicine'],
    latitude: 28.9833,
    longitude: 79.4000,
    facilities: ['Trauma Center', 'ICU Care', 'Pharmacy', 'Ambulance'],
    emergency_support: true,
    ICU_count: 12,
    bed_count: 180,
    doctors_available: 30,
    contact_phone: '+91-5944-243054',
    address: 'Civil Lines, Rudrapur, Udham Singh Nagar, Uttarakhand'
  }
];

export async function ensureBootstrapData() {
  const bedCount = await Bed.countDocuments();
  if (bedCount === 0) {
    const beds = [];
    for (const wardName of WARDS) {
      const prefix = wardName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      for (const roomNumber of ROOMS) {
        for (let slot = 1; slot <= 2; slot++) {
          beds.push({
            bedId: `${prefix}-${roomNumber.replace(/\s/g, '')}-${String.fromCharCode(64 + slot)}`,
            bedNumber: `${roomNumber} Bed ${slot}`,
            roomNumber,
            wardName,
            status: 'AVAILABLE',
            occupied: false,
            patientId: null,
          });
        }
      }
    }
    await Bed.insertMany(beds);
    console.log(`Bootstrap: inserted ${beds.length} beds`);
  }

  // Seed full Uttarakhand hospital directory (159 facilities)
  try {
    const { seedUttarakhandHospitals } = await import('./seedUttarakhandHospitals.js');
    await seedUttarakhandHospitals(false);
  } catch (err) {
    console.error('Bootstrap hospital seed failed:', err);
  }

  const { seedAllStaff } = await import('./seedStaff.js');
  await seedAllStaff();
  console.log('Bootstrap: full staff registry seeded (password123)');

  try {
    const { seedMachines } = await import('./seedMachines.js');
    await seedMachines();
  } catch (err) {
    console.warn('Bootstrap machine seed skipped:', err.message);
  }

  // Demo patient account for mobile app (login: +919876543210 / patient123)
  const patientPassword = await bcrypt.hash('patient123', 10);
  const demoPhone = '+919876543210';
  let demoPatient = await (await import('../models/Patient.js')).default.findOne({ phone: demoPhone });
  if (!demoPatient) {
    demoPatient = await (await import('../models/Patient.js')).default.create({
      patientName: 'Rahul Sharma',
      mrn: 'MRN-DEMO-001',
      dob: '1994-03-15',
      age: 32,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: demoPhone,
      email: 'rahul.demo@bhb.in',
      address: 'Mall Road, Almora, Uttarakhand',
      aadharCardId: 'XXXX-XXXX-9812',
      currentDepartment: 'OPD',
      currentStatus: 'REGISTERED',
    });
    console.log('Bootstrap: demo patient profile created');
  }

  if (demoPatient && (!demoPatient.prescriptions || demoPatient.prescriptions.length === 0)) {
    demoPatient.prescriptions = [
      {
        date: new Date(),
        medications: [
          { name: 'Paracetamol 500mg', dosage: '500mg', duration: '5 days', frequency: 'TDS', quantity: 15 },
          { name: 'Amoxicillin 500mg', dosage: '500mg', duration: '7 days', frequency: 'BD', quantity: 14 },
        ],
        prescribedBy: 'Dr. General Physician',
        dispensed: false,
      },
    ];
    demoPatient.markModified('prescriptions');
    await demoPatient.save();
    console.log('Bootstrap: demo prescription queued for pharmacy');
  }

  await User.findOneAndUpdate(
    { phone: demoPhone },
    {
      name: 'Rahul Sharma',
      phone: demoPhone,
      email: 'rahul.demo@bhb.in',
      password: patientPassword,
      role: 'patient',
      patientProfileId: demoPatient._id,
    },
    { upsert: true }
  );
  console.log('Bootstrap: demo patient user (+919876543210 / patient123)');

  // Proactively bootstrap initial Medical History record (Health Vault Prescription) for Rahul Sharma online login
  try {
    const MedicalHistoryModel = (await import('../models/MedicalHistory.js')).default;
    const historyCount = await MedicalHistoryModel.countDocuments({ patientId: demoPatient._id, type: 'prescription' });
    if (historyCount === 0) {
      await MedicalHistoryModel.create({
        patientId: demoPatient._id,
        type: 'prescription',
        title: 'OPD General Medicine Prescription',
        doctor: 'Dr. Ramesh Rungta',
        hospital: 'District Hospital Almora',
        createdAt: new Date(),
        prescriptionDetails: {
          diagnosis: 'Mild hypertension and seasonal viral fever.',
          medicines: [
            { name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '5 days' },
            { name: 'Amoxicillin 500mg', dosage: '1-0-1', duration: '7 days' }
          ],
          notes: 'Take medicines after meals. Drink plenty of warm water and rest.'
        },
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      });
      console.log('Bootstrap: initial demo patient medical history record created');
    }
  } catch (err) {
    console.error('Bootstrap: demo patient medical history record failed:', err.message);
  }

  // Blood donors (full list loaded from local database)
  try {
    const BloodDonor = (await import('../models/BloodDonor.js')).default;
    const { BLOOD_DONORS } = await import('./bloodDonors.js');
    const donorCount = await BloodDonor.countDocuments();
    if (donorCount !== BLOOD_DONORS.length) {
      console.log(`Bootstrap: Seeding ${BLOOD_DONORS.length} blood donors...`);
      await BloodDonor.deleteMany({});
      
      const docs = BLOOD_DONORS.map((d) => {
        let lat = 30.0;
        let lng = 79.0;
        if (d.district === 'Almora') { lat = 29.5976; lng = 79.6093; }
        else if (d.district === 'Chamoli') { lat = 30.4075; lng = 79.3187; }
        else if (d.district === 'Bageshwar') { lat = 29.8369; lng = 79.7748; }
        else if (d.district === 'Dehradun') { lat = 30.3165; lng = 78.0322; }
        else if (d.district === 'Haridwar') { lat = 29.9457; lng = 78.1642; }
        else if (d.district === 'Nainital') { lat = 29.3803; lng = 79.4636; }
        else if (d.district === 'Pauri Garhwal') { lat = 30.1470; lng = 78.7782; }
        else if (d.district === 'Pithoragarh') { lat = 29.5829; lng = 80.2179; }
        else if (d.district === 'Rudraprayag') { lat = 30.2847; lng = 78.9815; }
        else if (d.district === 'Tehri Garhwal') { lat = 30.3782; lng = 78.4334; }
        else if (d.district === 'Udham Singh Nagar') { lat = 28.9845; lng = 79.4032; }
        else if (d.district === 'Uttarkashi') { lat = 30.7268; lng = 78.4354; }
        else if (d.district === 'Champawat') { lat = 29.3338; lng = 80.0909; }
        
        lat += (Math.random() - 0.5) * 0.05;
        lng += (Math.random() - 0.5) * 0.05;

        return {
          name: d.name,
          phone: d.phone || '9999999999',
          district: d.district,
          city: d.city,
          bloodType: d.bloodType,
          verified: d.verified ?? true,
          latitude: lat,
          longitude: lng,
        };
      });

      await BloodDonor.insertMany(docs);
      console.log(`Bootstrap: successfully seeded ${docs.length} blood donors`);
    }
  } catch (err) {
    console.warn('Bootstrap donors skipped:', err.message);
  }

  try {
    const { ensureClinicalBeds } = await import('./seedClinicalBeds.js');
    await ensureClinicalBeds();
  } catch (err) {
    console.warn('Bootstrap clinical beds skipped:', err.message);
  }

  try {
    const { ensureLabSeed } = await import('./seedLab.js');
    await ensureLabSeed();
  } catch (err) {
    console.warn('Bootstrap lab skipped:', err.message);
  }

  try {
    const { ensurePharmacySeed } = await import('./seedPharmacy.js');
    await ensurePharmacySeed();
  } catch (err) {
    console.warn('Bootstrap pharmacy skipped:', err.message);
  }
}
