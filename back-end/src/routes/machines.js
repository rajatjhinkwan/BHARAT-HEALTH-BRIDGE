import { Router } from 'express';
import Machine from '../models/Machine.js';
import { seedMachines } from '../lib/seedMachines.js';

const router = Router();

const VALID_STATUSES = Machine.VALID_STATUSES || [
  'operational',
  'maintenance',
  'offline',
  'calibration',
  'standby',
];

async function ensureSeeded() {
  await seedMachines();
}

function toClient(doc) {
  const m = doc.toObject ? doc.toObject() : doc;
  return {
    id: m._id?.toString(),
    machineCode: m.machineCode,
    name: m.name,
    manufacturer: m.manufacturer,
    model: m.model,
    department: m.department,
    status: m.status,
    location: m.location,
    uptime: m.uptime,
    lastMaintenance: m.lastMaintenance,
    nextMaintenance: m.nextMaintenance,
    purchaseDate: m.purchaseDate,
    warrantyStatus: m.warrantyStatus,
    serialNumber: m.serialNumber,
    statusHistory: m.statusHistory,
    updatedAt: m.updatedAt,
  };
}

router.get('/', async (req, res) => {
  try {
    await ensureSeeded();
    const { department, status, search } = req.query;
    const query = {};
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;
    if (search) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
      ];
    }
    const machines = await Machine.find(query).sort({ department: 1, name: 1 });
    res.json(machines.map(toClient));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machines', message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    await ensureSeeded();
    const machines = await Machine.find().lean();
    const counts = {
      operational: 0,
      maintenance: 0,
      offline: 0,
      calibration: 0,
      standby: 0,
      total: machines.length,
    };
    machines.forEach((m) => {
      if (counts[m.status] !== undefined) counts[m.status]++;
    });
    counts.avgUptime =
      machines.length > 0
        ? Number((machines.reduce((s, m) => s + (m.uptime || 0), 0) / machines.length).toFixed(1))
        : 0;
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machine stats', message: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, changedBy, note } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: VALID_STATUSES,
      });
    }

    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    machine.status = status;
    machine.statusHistory.push({
      status,
      changedBy: changedBy || req.body.userName || 'Admin',
      note: note || '',
    });

    if (status === 'offline') {
      machine.uptime = Math.max(0, (machine.uptime || 98) - 2);
    } else if (status === 'maintenance' || status === 'calibration') {
      machine.uptime = Math.max(85, (machine.uptime || 98) - 1);
    } else if (status === 'operational') {
      machine.uptime = Math.min(99.9, (machine.uptime || 95) + 0.5);
    }

    await machine.save();

    const io = req.app.get('io');
    if (io) io.emit('machineUpdate', toClient(machine));

    res.json(toClient(machine));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update machine status', message: err.message });
  }
});

export default router;
