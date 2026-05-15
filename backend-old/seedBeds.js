import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bed from './src/models/Bed.js';

dotenv.config();

const seedBeds = async () => {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'bhb' });
    console.log("Connected to MongoDB for seeding beds");

    const beds = [];
    const wards = ['ICU', 'General', 'Emergency', 'Maternity', 'Pediatrics'];
    const statuses = ['Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'];

    // Generate 30 beds
    for (let i = 1; i <= 30; i++) {
        const ward = wards[Math.floor(Math.random() * wards.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        let patientName = null;
        let admissionDate = null;
        let expectedDischarge = null;

        if (status === 'Occupied') {
            patientName = `Patient ${Math.floor(Math.random() * 900) + 100}`;
            admissionDate = new Date();
            admissionDate.setDate(admissionDate.getDate() - Math.floor(Math.random() * 5));
            expectedDischarge = new Date();
            expectedDischarge.setDate(expectedDischarge.getDate() + Math.floor(Math.random() * 5) + 1);
        }

        beds.push({
            id: `${ward.substring(0, 3).toUpperCase()}-B${i}`,
            ward,
            status,
            type: ward === 'ICU' ? 'ICU' : 'Standard',
            patientName,
            admissionDate,
            expectedDischarge,
            dailyRate: ward === 'ICU' ? 15000 : 2000,
            equipment: ward === 'ICU' ? ['Ventilator', 'Monitor'] : ['Monitor'],
            floor: Math.floor(Math.random() * 5) + 1
        });
    }

    for (const b of beds) {
        await Bed.findOneAndUpdate(
            { id: b.id },
            { ...b },
            { upsert: true, new: true }
        );
        console.log(`Seeded bed: ${b.id}`);
    }

    console.log("Bed seeding complete");
    process.exit(0);
};

seedBeds().catch(err => {
    console.error(err);
    process.exit(1);
});
