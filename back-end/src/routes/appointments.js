import { Router } from 'express';
import { Appointment, Patient, User, QueueNode } from '../models/index.js';
import { normalizeDepartment, tokenPrefixForDepartment } from '../lib/departments.js';
import { emitAppointmentUpdate } from '../lib/realtime.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const SLOT_START = 9;
const SLOT_END = 16; // 4:00 PM
const SLOT_MINUTES = 30;

function getISTDateInfo() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  const hour = istDate.getHours();
  const min = istDate.getMinutes();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  
  return {
    dateStr,
    timeStr,
    dateObj: istDate
  };
}

function generateSlots() {
  const slots = [];
  for (let h = SLOT_START; h < SLOT_END; h++) {
    for (let m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function generateAppointmentId() {
  return `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// GET /availability?doctorId=DOC-GEN-123&date=2026-05-20
router.get('/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const { dateStr, dateObj } = getISTDateInfo();

    // Past date check
    if (date < dateStr) {
      return res.json({ date, doctorId, slots: [] });
    }

    // Limit maximum window to 7 days ahead
    const maxBookingDate = new Date(dateObj);
    maxBookingDate.setDate(maxBookingDate.getDate() + 7);
    const maxBookingDateStr = maxBookingDate.toISOString().split('T')[0];
    if (date > maxBookingDateStr) {
      return res.json({ date, doctorId, slots: [] });
    }

    const booked = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    }).select('appointmentTime');

    const bookedTimes = new Set(booked.map((a) => a.appointmentTime));
    const allSlots = generateSlots();
    let available = allSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));

    // If requesting today, filter out past/expired slots
    if (date === dateStr) {
      const currentHour = dateObj.getHours();
      const currentMin = dateObj.getMinutes();
      
      available = available.filter((slot) => {
        const [hStr, mStr] = slot.time.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (h > currentHour) return true;
        if (h === currentHour && m > currentMin) return true;
        return false;
      });
    }

    res.json({ date, doctorId, slots: available });
  } catch (err) {
    console.error('Availability Error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { patientId, doctorId, department, date, status } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (department) filter.department = normalizeDepartment(department);
    if (date) filter.appointmentDate = date;
    if (status) filter.status = status;

    const apps = await Appointment.find(filter)
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(500);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      department,
      appointmentDate,
      appointmentTime,
      date,
      time,
      reason,
    } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'patientId and doctorId are required' });
    }

    const apptDate = appointmentDate || date;
    const apptTime = appointmentTime || time;
    if (!apptDate || !apptTime) {
      return res.status(400).json({ error: 'appointmentDate and appointmentTime are required' });
    }

    const { dateStr, dateObj } = getISTDateInfo();

    // 1. Validate past dates
    if (apptDate < dateStr) {
      return res.status(400).json({ error: 'Cannot book appointments for past dates' });
    }

    // Validate maximum booking window (7 days ahead)
    const maxBookingDate = new Date(dateObj);
    maxBookingDate.setDate(maxBookingDate.getDate() + 7);
    const maxBookingDateStr = maxBookingDate.toISOString().split('T')[0];
    if (apptDate > maxBookingDateStr) {
      return res.status(400).json({ error: 'Appointments can only be booked up to 7 days in advance.' });
    }

    // 2. Validate operating hours (9:00 AM to 4:00 PM)
    const [hStr, mStr] = apptTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m) || h < SLOT_START || h >= SLOT_END) {
      return res.status(400).json({ error: 'Hospital operating hours are from 9:00 AM to 4:00 PM' });
    }

    // 3. Validate expired slots if booking for today
    if (apptDate === dateStr) {
      const currentHour = dateObj.getHours();
      const currentMin = dateObj.getMinutes();
      if (currentHour >= SLOT_END) {
        return res.status(400).json({ error: 'Hospital is closed for today. Please select tomorrow or a future date.' });
      }
      if (h < currentHour || (h === currentHour && m <= currentMin)) {
        return res.status(400).json({ error: 'Cannot book a past or expired time slot' });
      }
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const doctor = await User.findOne({ employeeId: doctorId, role: 'doctor' });
    const dept =
      normalizeDepartment(department) ||
      normalizeDepartment(doctor?.department) ||
      'General Medicine';

    // 4. Queue overflow prevention (limit 50 per department per day)
    const today = dateStr;
    const deptCount = await QueueNode.countDocuments({ department: dept, date: today });
    if (apptDate === today && deptCount >= 50) {
      return res.status(400).json({ error: 'Queue limit exceeded for this department today. Please book for tomorrow.' });
    }

    // 5. Double-booking prevention
    const conflict = await Appointment.findOne({
      doctorId,
      appointmentDate: apptDate,
      appointmentTime: apptTime,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    });
    if (conflict) {
      return res.status(409).json({ error: 'This slot is already booked' });
    }

    const appointment = await Appointment.create({
      appointmentId: generateAppointmentId(),
      patientId,
      patientName: patient.patientName,
      doctorId,
      doctorName: doctor?.name || req.body.doctorName || doctorId,
      department: dept,
      appointmentDate: apptDate,
      appointmentTime: apptTime,
      reason: reason || '',
      status: 'BOOKED',
    });

    // Auto Check-In to Queue if the appointment is for today
    if (apptDate === today) {
      const alreadyQueued = await QueueNode.findOne({
        patientId: patient._id,
        department: dept,
        date: today,
        status: { $in: ['WAITING', 'IN_CONSULTATION'] }
      });

      if (!alreadyQueued) {
        // Generate Department-Specific Token
        const deptCode = tokenPrefixForDepartment(dept);
        const token = `${deptCode}-${(deptCount + 1).toString().padStart(3, '0')}`;

        // Update Patient Profile status
        patient.currentDepartment = dept;
        patient.currentStatus = 'WAITING';
        patient.timeline.push({
          action: 'REGISTERED',
          department: dept,
          performedBy: 'Patient Portal',
          details: `Checked-in automatically via appointment booking. Token: ${token}`
        });
        await patient.save();

        // Create active QueueNode
        await QueueNode.create({
          queueId: 'Q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          tokenNumber: token,
          patientId: patient._id,
          patientName: patient.patientName,
          mrn: patient.mrn,
          date: today,
          time: apptTime,
          doctor: doctor?.name || doctorId,
          department: dept,
          status: 'WAITING',
          priorityLevel: 'LOW',
          symptoms: reason || 'Booked via Mobile App'
        });

        // Broadcast live queue update
        const io = req.app.get('io');
        if (io) {
          io.emit('queueUpdated', { department: dept });
          io.emit('realtimeUpdate', { type: 'queue', department: dept });
        }
      }
    }

    const io = req.app.get('io');
    emitAppointmentUpdate(io, appointment.toObject ? appointment.toObject() : appointment);

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Appointment Error:', err);
    res.status(500).json({ error: 'Failed to book appointment', message: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }

    const updated = await Appointment.findOneAndUpdate(
      { $or: [{ _id: id }, { appointmentId: id }] },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const io = req.app.get('io');
    emitAppointmentUpdate(io, updated.toObject ? updated.toObject() : updated);

    res.json(updated);
  } catch (err) {
    console.error('Appointment PATCH Error:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
