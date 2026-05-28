import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB.');
    const users = await User.find({}, 'name email role employeeId');
    console.log('USERS IN SYSTEM:');
    users.forEach((u) => {
      console.log(`- ${u.name} | ${u.email} | Role: ${u.role} | EmpId: ${u.employeeId}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

check();
