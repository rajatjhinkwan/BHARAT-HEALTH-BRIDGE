import { Router } from 'express';
import { User } from '../models/index.js';
import { OPD_DEPARTMENTS, normalizeDepartment } from '../lib/departments.js';

const router = Router();

router.get('/departments', (_req, res) => {
  res.json(OPD_DEPARTMENTS);
});

router.get('/doctors', async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { role: 'doctor' };
    if (department) {
      const canonical = normalizeDepartment(department);
      filter.department = { $in: [canonical, department, department.toUpperCase()] };
    }

    const doctors = await User.find(filter)
      .select('name employeeId department specialization availabilityStatus')
      .sort({ department: 1, name: 1 });

    res.json(
      doctors.map((d) => ({
        id: d._id,
        name: d.name,
        employeeId: d.employeeId,
        department: normalizeDepartment(d.department),
        specialization: d.specialization,
        availabilityStatus: d.availabilityStatus || 'available',
      }))
    );
  } catch (err) {
    console.error('Doctors catalog error:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

export default router;
