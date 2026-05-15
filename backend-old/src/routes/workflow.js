import { Router } from 'express';
import { Patient, Visit, QueueNode, Appointment, User } from '../models/index.js';
import Bed from '../models/Bed.js';

const router = Router();

// ==========================================
// 1. REGISTER PATIENT (Receptionist)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { 
      patientName, dob, age, gender, aadharCardId, 
      phone, email, address, department, priority, symptoms 
    } = req.body;

    const year = new Date().getFullYear();
    const randomUHID = Math.floor(100000 + Math.random() * 900000);
    const uhid = `UHID-DEL-${year}-${randomUHID}`;

    const today = new Date().toISOString().split('T')[0];
    const deptCount = await QueueNode.countDocuments({ department, date: today });
    const deptCode = department.substring(0, 3).toUpperCase();
    const token = `${deptCode}-${(deptCount + 1).toString().padStart(3, '0')}`;

    const patient = new Patient({
      patientName, mrn: uhid, dob, age, gender, 
      phone: phone || req.body.contact, email, address, aadharCardId, symptoms,
      priority: priority || 'LOW',
      currentStatus: 'REGISTERED',
      currentDepartment: 'RECEPTION',
      timeline: [{
        action: 'REGISTERED',
        department: 'Reception',
        performedBy: 'Receptionist',
        details: `Initial registration at hospital. Assigned UHID: ${uhid}. Token: ${token}`
      }]
    });
    const savedPatient = await patient.save();

    const queueNode = new QueueNode({
      queueId: 'Q-' + Date.now(),
      tokenNumber: token,
      patientId: savedPatient._id,
      patientName: savedPatient.patientName,
      mrn: savedPatient.mrn,
      date: today,
      time: new Date().toTimeString().split(' ')[0],
      doctor: 'To Be Assigned',
      department,
      status: 'WAITING'
    });
    await queueNode.save();

    req.app.get('io').emit('queueUpdated', { department });

    res.status(201).json({
      message: 'Patient registered and added to queue',
      patient: savedPatient,
      token,
      uhid
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ==========================================
// 2. CALL NEXT PATIENT (Doctor ONLY)
// ==========================================
router.patch('/queue/call-next/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const doctor = await User.findById(userId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const activeConsultation = await QueueNode.findOne({ doctor: doctor.name, status: 'IN_CONSULTATION' });
        if (activeConsultation) return res.status(400).json({ message: 'Active consultation exists.' });

        const nextPatient = await QueueNode.findOne({ status: 'WAITING', department: doctor.department }).sort({ createdAt: 1 });
        if (!nextPatient) return res.status(404).json({ message: 'Queue empty.' });

        nextPatient.status = 'IN_CONSULTATION';
        nextPatient.doctor = doctor.name;
        await nextPatient.save();

        // Update Doctor Status
        doctor.availabilityStatus = 'IN CONSULTATION';
        await doctor.save();

        // Update Patient Status & Timeline
        await Patient.findByIdAndUpdate(nextPatient.patientId, {
            currentStatus: 'IN CONSULTATION',
            currentDepartment: doctor.department,
            assignedDoctor: doctor.name,
            $push: {
                timeline: {
                    action: 'CONSULTATION STARTED',
                    department: doctor.department,
                    performedBy: doctor.name,
                    details: `Consultation started with ${doctor.name}`
                }
            }
        });

        req.app.get('io').emit('queueUpdated', { department: doctor.department });
        res.json(nextPatient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ==========================================
// 3. COMPLETE CONSULTATION (Doctor ONLY)
// ==========================================
router.patch('/queue/complete/:queueId', async (req, res) => {
    try {
        const queueNode = await QueueNode.findOne({ queueId: req.params.queueId });
        if (!queueNode) return res.status(404).json({ message: 'Queue node not found' });

        queueNode.status = 'COMPLETED';
        await queueNode.save();

        // Update Doctor Status back to AVAILABLE
        const doctor = await User.findOne({ name: queueNode.doctor });
        if (doctor) {
            doctor.availabilityStatus = 'AVAILABLE';
            await doctor.save();
        }

        await Patient.findByIdAndUpdate(queueNode.patientId, {
            currentStatus: 'WAITING', 
            $push: {
                timeline: {
                    action: 'CONSULTATION COMPLETED',
                    department: queueNode.department,
                    performedBy: queueNode.doctor,
                    details: 'Consultation concluded by doctor.'
                }
            }
        });

        req.app.get('io').emit('queueUpdated', { department: queueNode.department });
        res.json(queueNode);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ==========================================
// 4. GLOBAL SEARCH
// ==========================================
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // Search by Token Number in QueueNodes first
        const queueNodes = await QueueNode.find({ tokenNumber: { $regex: query, $options: 'i' } }).limit(5);
        const patientIdsFromQueue = queueNodes.map(q => q.patientId);

        const patients = await Patient.find({
            $or: [
                { _id: { $in: patientIdsFromQueue } },
                { patientName: { $regex: query, $options: 'i' } },
                { mrn: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// ==========================================
// 5. DASHBOARD METRICS
// ==========================================
router.get('/metrics', async (req, res) => {
    try {
        const stats = {
            totalPatients: await Patient.countDocuments({}),
            todayAppointments: await Appointment.countDocuments({ date: new Date().toISOString().split('T')[0] }),
            waitingQueue: await QueueNode.countDocuments({ status: 'WAITING' }),
            activeICU: await Patient.countDocuments({ currentWard: 'ICU' }),
            ventilator: await Patient.countDocuments({ currentWard: 'Ventilator Ward' }),
            emergencyCases: await Patient.countDocuments({ currentDepartment: 'EMERGENCY' }),
            availableBeds: await Bed.countDocuments({ occupied: false }),
            occupiedBeds: await Bed.countDocuments({ occupied: true }),
            pendingLabs: await Patient.countDocuments({ currentStatus: 'LAB PENDING' }),
            dischargedToday: await Patient.countDocuments({ 
                currentStatus: 'DISCHARGED',
                updatedAt: { $gte: new Date().setHours(0,0,0,0) }
            })
        };
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// ==========================================
// 6. RECENT ACTIVITY FEED
// ==========================================
router.get('/activity', async (req, res) => {
    try {
        // Collect latest timeline events across all patients
        const patients = await Patient.find({}).sort({ updatedAt: -1 }).limit(20);
        let activities = [];
        patients.forEach(p => {
            if (p.timeline && p.timeline.length > 0) {
                const latest = p.timeline[p.timeline.length - 1];
                activities.push({
                    patientName: p.patientName,
                    mrn: p.mrn,
                    action: latest.action,
                    details: latest.details,
                    performedBy: latest.performedBy,
                    timestamp: latest.timestamp
                });
            }
        });
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(activities.slice(0, 10));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

export default router;
