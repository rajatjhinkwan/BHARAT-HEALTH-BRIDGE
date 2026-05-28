
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { STAFF_REGISTRY } from './src/lib/staffRegistry.js';

dotenv.config();

const seedStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bhb');
        console.log("Connected to MongoDB for comprehensive staff seeding");

        const password = 'password123';
        const hashed = await bcrypt.hash(password, 10);

        for (const member of STAFF_REGISTRY) {
            await User.findOneAndUpdate(
                { employeeId: member.employeeId },
                { ...member, password: hashed, availabilityStatus: member.role === 'doctor' ? 'AVAILABLE' : 'OFFLINE' },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`Seeded: ${member.name} (${member.employeeId}) - ${member.role} in ${member.department || '—'}`);
        }

        console.log("\nSuccess: All ward-specific credentials have been seeded!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedStaff();
