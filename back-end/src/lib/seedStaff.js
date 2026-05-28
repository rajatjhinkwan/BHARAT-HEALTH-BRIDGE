import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { STAFF_REGISTRY, STAFF_DEFAULT_PASSWORD } from './staffRegistry.js';

export async function seedAllStaff() {
  const password = await bcrypt.hash(STAFF_DEFAULT_PASSWORD, 10);
  const results = [];

  for (const member of STAFF_REGISTRY) {
    const doc = await User.findOneAndUpdate(
      { employeeId: member.employeeId },
      { ...member, password, availabilityStatus: member.role === 'doctor' ? 'AVAILABLE' : 'OFFLINE' },
      { upsert: true, returnDocument: 'after' }
    );
    results.push({ employeeId: doc.employeeId, role: doc.role, department: doc.department });
  }

  return results;
}
