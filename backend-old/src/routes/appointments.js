import { Router } from 'express';
import { Appointment, Patient, QueueNode } from '../models/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { patientId, patientName, department, date, time, type } = req.body;

    const appointment = await Appointment.create({
      patientId,
      patientName,
      department,
      date,
      time,
      type: type || 'Consultation',
      status: 'Scheduled'
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Appointment Error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

router.get('/', async (req, res) => {
  try {
    const apps = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;
