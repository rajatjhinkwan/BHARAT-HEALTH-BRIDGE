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

    const today = new Date().toISOString().split('T')[0];
    
    // 1. Generate UHID
    const year = new Date().getFullYear();
    const randomUHID = Math.floor(100000 + Math.random() * 900000);
    const uhid = `UHID-DEL-${year}-${randomUHID}`;

    // 2. Generate Department-Specific Token
    const deptCount = await QueueNode.countDocuments({ department, date: today });
    const deptCode = department.substring(0, 5).toUpperCase().replace(/\s/g, '');
    const token = `${deptCode}-${(deptCount + 1).toString().padStart(3, '0')}`;

    // 3. Save Patient Record
    const patient = new Patient({
      patientName, mrn: uhid, dob, age, gender, 
      phone: phone || req.body.contact, email, address, aadharCardId, symptoms,
      priority: priority || 'NORMAL',
      currentStatus: 'WAITING',
      currentDepartment: department,
      timeline: [{
        action: 'REGISTERED',
        department: 'Reception',
        performedBy: 'Receptionist',
        details: `Initial registration for ${department}. Token: ${token}`
      }]
    });
    const savedPatient = await patient.save();

    // 4. Create Queue Node
    const queueNode = new QueueNode({
      queueId: 'Q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      tokenNumber: token,
      patientId: savedPatient._id,
      patientName: savedPatient.patientName,
      mrn: savedPatient.mrn,
      date: today,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      doctor: 'TBD',
      department,
      status: 'WAITING',
      priorityLevel: priority || 'LOW',
      symptoms: symptoms || ''
    });
    await queueNode.save();

    // 5. Emit Live Update
    req.app.get('io').emit('queueUpdated', { department });

    res.status(201).json({
      message: 'Patient added to ' + department + ' queue',
      patient: savedPatient,
      token,
      uhid
    });
  } catch (error) {
    console.error('Registration Error:', error);
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

        const today = new Date().toISOString().split('T')[0];

        // Check for existing active consultation for THIS doctor
        const activeConsultation = await QueueNode.findOne({ 
            doctor: doctor.name, 
            status: 'IN_CONSULTATION',
            date: today
        });
        if (activeConsultation) return res.status(400).json({ message: 'Please complete current consultation first.' });

        // Find next patient ONLY for doctor's department and TODAY
        // Sort by priority first (CRITICAL > HIGH > MEDIUM > LOW), then by arrival time
        const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        
        // Find the highest priority patient
        const patients = await QueueNode.find({ 
            status: 'WAITING', 
            department: doctor.department,
            date: today
        });
        
        if (patients.length === 0) return res.status(404).json({ message: 'No patients waiting in ' + doctor.department });
        
        const next = patients.sort((a, b) => {
            const pA = priorityOrder[a.priorityLevel] || 4;
            const pB = priorityOrder[b.priorityLevel] || 4;
            return pA - pB || new Date(a.createdAt) - new Date(b.createdAt);
        })[0];

        const nextPatient = await QueueNode.findById(next._id);
        
        nextPatient.status = 'IN_CONSULTATION';
        nextPatient.doctor = doctor.name;
        nextPatient.consultationStartTime = new Date();
        await nextPatient.save();

        // Update Doctor Status
        doctor.availabilityStatus = 'IN CONSULTATION';
        await doctor.save();

        // Update Patient Record
        await Patient.findByIdAndUpdate(nextPatient.patientId, {
            currentStatus: 'IN CONSULTATION',
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
        console.error('Call Next Error:', error);
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
// 3b. GET LIVE QUEUE (By Department)
// ==========================================
router.get('/queue/live', async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) return res.status(400).json({ message: 'Department required' });

    const today = new Date().toISOString().split('T')[0];

    const waiting = await QueueNode.find({ department, status: 'WAITING', date: today }).sort({ createdAt: 1 });
    const inConsultation = await QueueNode.find({ department, status: 'IN_CONSULTATION', date: today });
    const completed = await QueueNode.find({ department, status: 'COMPLETED', date: today }).sort({ updatedAt: -1 }).limit(20);

    res.json({ waiting, inConsultation, completed });
  } catch (error) {
    console.error('Live Queue Error:', error);
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

// ==========================================
// 7. CLINICAL REFERRAL & MOVEMENT
// ==========================================
router.post('/refer', async (req, res) => {
    try {
        const { patientId, targetDepartment, referringDoctor, reason } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        patient.currentDepartment = targetDepartment.toUpperCase();
        patient.currentStatus = 'REFERRED';
        patient.timeline.push({
            action: 'REFERRED',
            department: targetDepartment,
            performedBy: referringDoctor,
            details: `Patient referred from ${referringDoctor} to ${targetDepartment}. Reason: ${reason || 'Clinical evaluation'}`
        });

        await patient.save();

        // Also add to the target department's queue
        const deptCode = targetDepartment.substring(0, 3).toUpperCase();
        const today = new Date().toISOString().split('T')[0];
        const deptCount = await QueueNode.countDocuments({ department: targetDepartment, date: today });
        const token = `${deptCode}-REF-${(deptCount + 1).toString().padStart(3, '0')}`;

        const queueNode = new QueueNode({
            queueId: 'Q-REF-' + Date.now(),
            tokenNumber: token,
            patientId: patient._id,
            patientName: patient.patientName,
            mrn: patient.mrn,
            date: today,
            time: new Date().toTimeString().split(' ')[0],
            doctor: 'To Be Assigned',
            department: targetDepartment,
            status: 'WAITING'
        });
        await queueNode.save();

        req.app.get('io').emit('queueUpdated', { department: targetDepartment });
        res.json({ message: `Referred to ${targetDepartment}`, token });
    } catch (err) {
        res.status(500).json({ error: 'Referral failed' });
    }
});

// ==========================================
// 8. SERVICE ORDERS (Lab, Radiology)
// ==========================================
router.post('/order-lab', async (req, res) => {
    try {
        const { patientId, tests, orderedBy } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const orderId = 'LAB-' + Date.now();
        patient.labOrders.push({
            tests,
            orderedBy,
            orderId,
            status: 'Pending'
        });
        patient.currentStatus = 'LAB PENDING';
        patient.timeline.push({
            action: 'LAB ORDERED',
            department: 'Laboratory',
            performedBy: orderedBy,
            details: `Ordered tests: ${tests.join(', ')}. Order ID: ${orderId}`
        });

        await patient.save();
        req.app.get('io').emit('serviceUpdate', { type: 'lab', patientId });
        res.json({ message: 'Lab tests ordered', orderId });
    } catch (err) {
        res.status(500).json({ error: 'Lab order failed' });
    }
});

router.post('/order-radiology', async (req, res) => {
    try {
        const { patientId, type, bodyPart, orderedBy } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const orderId = 'RAD-' + Date.now();
        patient.radiologyOrders.push({
            type,
            bodyPart,
            orderedBy,
            orderId,
            status: 'Pending'
        });
        patient.currentStatus = `${type} PENDING`;
        patient.timeline.push({
            action: 'RADIOLOGY ORDERED',
            department: 'Radiology',
            performedBy: orderedBy,
            details: `Ordered ${type} for ${bodyPart}. Order ID: ${orderId}`
        });

        await patient.save();
        req.app.get('io').emit('serviceUpdate', { type: 'radiology', patientId });
        res.json({ message: 'Radiology order placed', orderId });
    } catch (err) {
        res.status(500).json({ error: 'Radiology order failed' });
    }
});

// ==========================================
// 9. SPECIALIZED ACTIONS (Surgery, Dialysis, Chemo)
// ==========================================
router.post('/schedule-surgery', async (req, res) => {
    try {
        const { patientId, procedure, surgeon, scheduledDate, otNumber } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        patient.surgeryOrders.push({
            procedure,
            surgeon,
            scheduledDate,
            otNumber,
            status: 'Scheduled'
        });
        patient.currentStatus = 'SURGERY SCHEDULED';
        patient.timeline.push({
            action: 'SURGERY SCHEDULED',
            department: 'Surgery',
            performedBy: surgeon,
            details: `Procedure: ${procedure} scheduled for ${new Date(scheduledDate).toLocaleString()} in OT ${otNumber}`
        });

        await patient.save();
        res.json({ message: 'Surgery scheduled' });
    } catch (err) {
        res.status(500).json({ error: 'Surgery scheduling failed' });
    }
});

router.post('/start-session', async (req, res) => {
    try {
        const { patientId, type, performedBy, notes } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        patient.specializedSessions.push({
            type,
            performedBy,
            notes,
            status: 'Active'
        });
        patient.currentStatus = `${type} ACTIVE`;
        patient.timeline.push({
            action: `${type} STARTED`,
            department: type === 'DIALYSIS' ? 'Nephrology' : 'Oncology',
            performedBy,
            details: `${type} session started. Notes: ${notes}`
        });

        await patient.save();
        res.json({ message: `${type} session started` });
    } catch (err) {
        res.status(500).json({ error: 'Session start failed' });
    }
});

export default router;
