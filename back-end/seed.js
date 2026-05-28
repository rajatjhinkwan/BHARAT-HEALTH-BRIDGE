
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

dotenv.config();

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = [
        { name: 'Super Admin', employeeId: 'SAD-123', password: 'password123', role: 'super_admin' },
        { name: 'Dr. Sharma', employeeId: 'DOC-123', password: 'password123', role: 'doctor' },
        { name: 'Head Nurse', employeeId: 'NUR-123', password: 'password123', role: 'nurse' },
        { name: 'Front Desk', employeeId: 'REC-123', password: 'password123', role: 'receptionist' },
        { name: 'Pharmacist', employeeId: 'PHA-123', password: 'password123', role: 'pharmacist' },
    ];

    for (const u of users) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.findOneAndUpdate(
            { employeeId: u.employeeId },
            { ...u, password: hashed },
            { upsert: true, returnDocument: 'after' }
        );
        console.log(`Seeded user: ${u.employeeId}`);
    }

    console.log("Seeding complete");
    process.exit(0);
};

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
