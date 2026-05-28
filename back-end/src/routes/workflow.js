import { Router } from 'express';
import mongoose from 'mongoose';
import { Patient, Visit, QueueNode, Appointment, User } from '../models/index.js';
import Bed from '../models/Bed.js';
import { normalizeDepartment, tokenPrefixForDepartment } from '../lib/departments.js';
import { authenticate, validatePermission } from '../middleware/auth.js';
import { logAuditAction } from '../lib/auditLogger.js';
import {
  todayDateString,
  departmentQuery,
  emitQueueUpdated,
  sortQueueByPriority,
  enrichQueueNodes,
  isDoctorRole,
} from '../lib/queueHelpers.js';
import { normalizeClinicalPriority } from '../lib/priority.js';
import { emitPatientEvent } from '../lib/realtime.js';

const router = Router();

async function loadDoctor(userId, res) {
  if (!userId) {
    res.status(401).json({ message: 'Doctor user id required (X-User-Id header)' });
    return null;
  }
  const doctor = await User.findById(userId);
  if (!doctor) {
    res.status(404).json({ message: 'Doctor not found' });
    return null;
  }
  if (!isDoctorRole(doctor.role)) {
    res.status(403).json({ message: 'Only doctors can perform this action' });
    return null;
  }
  return doctor;
}

async function startConsultation(doctor, queueNode, req) {
  const today = todayDateString();
  const doctorDept = normalizeDepartment(doctor.department);

  if (normalizeDepartment(queueNode.department) !== doctorDept) {
    throw new Error(`Patient is in ${queueNode.department}, not ${doctorDept}`);
  }
  if (queueNode.date !== today) {
    throw new Error('This queue token is not for today');
  }
  if (queueNode.status !== 'WAITING') {
    throw new Error('Patient is not in waiting status');
  }

  const active = await QueueNode.findOne({
    doctor: doctor.name,
    status: 'IN_CONSULTATION',
    date: today,
  });
  if (active) {
    throw new Error('Please complete your current consultation first');
  }

  queueNode.status = 'IN_CONSULTATION';
  queueNode.doctor = doctor.name;
  queueNode.consultationStartTime = new Date();
  await queueNode.save();

  doctor.availabilityStatus = 'IN CONSULTATION';
  await doctor.save();

  await Patient.findByIdAndUpdate(queueNode.patientId, {
    currentStatus: 'IN CONSULTATION',
    assignedDoctor: doctor.name,
    currentDepartment: doctorDept,
    $push: {
      timeline: {
        action: 'CONSULTATION STARTED',
        department: doctorDept,
        performedBy: doctor.name,
        details: `Consultation started — token ${queueNode.tokenNumber}`,
      },
    },
  });

  emitQueueUpdated(req, doctorDept);
  emitPatientEvent(req.app.get('io'), queueNode.patientId, 'patientRecordUpdate', {
    type: 'queue_status',
    status: queueNode.status,
    department: doctorDept,
    tokenNumber: queueNode.tokenNumber,
    queueId: queueNode.queueId,
  });
  return queueNode;
}

// ==========================================
// 1. REGISTER PATIENT (Receptionist)
// ==========================================
router.post('/register', authenticate, validatePermission('canRegisterPatient'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database unavailable',
        error: 'MongoDB is not connected. Check MONGO_URI in back-end/.env and restart the server.',
      });
    }

    const { 
      patientName, dob, age, gender, aadharCardId, 
      phone, email, address, department, priority, symptoms,
      insuranceProvider, policyNumber
    } = req.body;

    const resolvedAadhar = aadharCardId || 'N/A';
    let resolvedDob = dob;
    let resolvedAge = age;

    if (!resolvedDob && resolvedAge !== undefined && resolvedAge !== '') {
      const birthYear = new Date().getFullYear() - Number(resolvedAge);
      resolvedDob = `${birthYear}-01-01`;
    } else if (resolvedDob && (resolvedAge === undefined || resolvedAge === '')) {
      const birthYear = new Date(resolvedDob).getFullYear();
      resolvedAge = new Date().getFullYear() - birthYear;
    }

    if (!patientName || !resolvedDob || !phone || !address || !department) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'patientName, dob or age, phone, address, and department are required',
      });
    }

    const dept = normalizeDepartment(department);
    const ageNum = Number(resolvedAge);
    if (Number.isNaN(ageNum) || ageNum < 0) {
      return res.status(400).json({ message: 'Invalid age', error: 'Age must be a number' });
    }

    const today = todayDateString();
    
    // 1. Generate UHID
    const year = new Date().getFullYear();
    const randomUHID = Math.floor(100000 + Math.random() * 900000);
    const uhid = `UHID-DEL-${year}-${randomUHID}`;

    // 2. Generate Department-Specific Token
    const deptCount = await QueueNode.countDocuments({ department: dept, date: today });
    const deptCode = tokenPrefixForDepartment(dept);
    const token = `${deptCode}-${(deptCount + 1).toString().padStart(3, '0')}`;

    // 3. Save Patient Record
    const patient = new Patient({
      patientName, mrn: uhid, dob: resolvedDob, age: ageNum, gender, 
      phone: phone || req.body.contact, email, address, aadharCardId: resolvedAadhar, symptoms,
      priority: priority || 'LOW',
      insuranceProvider, policyNumber,
      currentStatus: 'WAITING',
      currentDepartment: dept,
      timeline: [{
        action: 'REGISTERED',
        department: 'Reception',
        performedBy: 'Receptionist',
        details: `Initial registration for ${dept}. Token: ${token}`
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
      department: dept,
      status: 'WAITING',
      priorityLevel: priority || 'LOW',
      symptoms: symptoms || ''
    });
    await queueNode.save();

    emitQueueUpdated(req, dept);
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Patient Registration (OPD)', `Registered patient ${savedPatient.patientName} (MRN: ${savedPatient.mrn}) for ${dept} queue (Token: ${token})`);

    res.status(201).json({
      message: 'Patient added to ' + dept + ' queue',
      patient: savedPatient,
      queueNode,
      token,
      uhid,
      department: dept,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    const isValidation = error.name === 'ValidationError';
    res.status(isValidation ? 400 : 500).json({
      message: isValidation ? 'Validation failed' : 'Server Error',
      error: error.message,
      details: isValidation ? error.errors : undefined,
    });
  }
});

// ==========================================
// 2. CALL NEXT PATIENT (Doctor ONLY)
// ==========================================
// Start consultation for a specific queue entry (doctor only)
router.patch('/queue/start/:queueId', authenticate, validatePermission('canViewEMR'), async (req, res) => {
  try {
    const doctorUserId = req.headers['x-user-id'] || req.body?.doctorUserId;
    const doctor = await loadDoctor(doctorUserId, res);
    if (!doctor) return;

    const queueNode = await QueueNode.findOne({ queueId: req.params.queueId });
    if (!queueNode) {
      // What if it is an Appointment (virtual queue node)?
      const appointment = await Appointment.findOne({ appointmentId: req.params.queueId });
      if (appointment) {
        if (appointment.status !== 'BOOKED' && appointment.status !== 'CHECKED_IN') {
          return res.status(400).json({ message: 'Appointment is not in booked/waiting status' });
        }

        // Ensure no other active consultations for this doctor
        const today = todayDateString();
        const active = await QueueNode.findOne({
          doctor: doctor.name,
          status: 'IN_CONSULTATION',
          date: today,
        });
        const activeAppt = await Appointment.findOne({
          doctorName: doctor.name,
          status: 'IN_CONSULTATION',
          appointmentDate: appointment.appointmentDate,
        });
        if (active || activeAppt) {
          return res.status(400).json({ message: 'Please complete your current consultation first' });
        }

        appointment.status = 'IN_CONSULTATION';
        await appointment.save();

        doctor.availabilityStatus = 'IN CONSULTATION';
        await doctor.save();

        const patientDetails = await Patient.findById(appointment.patientId);
        await Patient.findByIdAndUpdate(appointment.patientId, {
          currentStatus: 'IN CONSULTATION',
          assignedDoctor: doctor.name,
          currentDepartment: appointment.department,
          $push: {
            timeline: {
              action: 'CONSULTATION STARTED',
              department: appointment.department,
              performedBy: doctor.name,
              details: `Consultation started for future appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
            },
          },
        });

        const virtualNode = {
          queueId: appointment.appointmentId,
          tokenNumber: `APT-${appointment.appointmentTime}`,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          mrn: patientDetails?.mrn || '—',
          age: patientDetails?.age || null,
          gender: patientDetails?.gender || null,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          doctor: doctor.name,
          department: appointment.department,
          status: 'IN_CONSULTATION',
          priorityLevel: 'LOW',
          symptoms: appointment.reason || 'Booked via Mobile App'
        };

        const io = req.app.get('io');
        if (io) {
          io.emit('queueUpdated', { department: appointment.department });
        }

        logAuditAction(`User: ${doctor.name} (${doctor.role})`, 'Consultation Started (Appointment)', `Started consultation for patient ${appointment.patientName} on ${appointment.appointmentDate}`);
        return res.json(virtualNode);
      }
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const updated = await startConsultation(doctor, queueNode, req);
    logAuditAction(`User: ${doctor.name} (${doctor.role})`, 'Consultation Started', `Started consultation for patient ${queueNode.patientName} (Token: ${queueNode.tokenNumber})`);
    res.json(updated);
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(400).json({ message: error.message || 'Could not start consultation' });
  }
});

// Call next waiting patient by priority (doctor only)
router.patch('/queue/call-next/:userId', authenticate, validatePermission('canViewEMR'), async (req, res) => {
    try {
        const doctor = await loadDoctor(req.params.userId, res);
        if (!doctor) return;

        const today = todayDateString();
        const doctorDept = normalizeDepartment(doctor.department);

        const waiting = await QueueNode.find({
            status: 'WAITING',
            department: departmentQuery(doctorDept),
            date: today,
        });

        if (waiting.length === 0) {
          return res.status(404).json({ message: 'No patients waiting in ' + doctorDept });
        }

        const next = sortQueueByPriority(waiting)[0];
        const queueNode = await QueueNode.findById(next._id);
        const updated = await startConsultation(doctor, queueNode, req);
        logAuditAction(`User: ${doctor.name} (${doctor.role})`, 'Consultation Started (Call Next)', `Called next patient for consultation: ${updated.patientName} (Token: ${updated.tokenNumber})`);
        res.json(updated);
    } catch (error) {
        console.error('Call Next Error:', error);
        res.status(400).json({ message: error.message || 'Server Error' });
    }
});

// ==========================================
// 3. COMPLETE CONSULTATION (Doctor ONLY)
// ==========================================
router.patch('/queue/complete/:queueId', authenticate, validatePermission('canViewEMR'), async (req, res) => {
    try {
        const doctorUserId = req.headers['x-user-id'] || req.body?.doctorUserId;
        const doctor = await loadDoctor(doctorUserId, res);
        if (!doctor) return;

        const queueNode = await QueueNode.findOne({ queueId: req.params.queueId });
        if (!queueNode) {
            // What if queueId is actually an Appointment ID?
            const appointment = await Appointment.findOne({ appointmentId: req.params.queueId });
            if (appointment) {
                if (appointment.status !== 'IN_CONSULTATION') {
                    return res.status(400).json({ message: 'Patient is not in consultation' });
                }

                appointment.status = 'COMPLETED';
                await appointment.save();

                doctor.availabilityStatus = 'AVAILABLE';
                await doctor.save();

                await Patient.findByIdAndUpdate(appointment.patientId, {
                    currentStatus: 'RECOVERING',
                    $push: {
                        timeline: {
                            action: 'CONSULTATION COMPLETED',
                            department: appointment.department,
                            performedBy: doctor.name,
                            details: 'Consultation concluded by doctor from future schedule.',
                        },
                    },
                });

                emitQueueUpdated(req, appointment.department);
                emitPatientEvent(req.app.get('io'), appointment.patientId, 'patientRecordUpdate', {
                  type: 'queue_status',
                  status: 'COMPLETED',
                  department: appointment.department,
                  tokenNumber: `APT-${appointment.appointmentTime}`,
                  queueId: appointment.appointmentId,
                });
                
                logAuditAction(`User: ${doctor.name} (${doctor.role})`, 'Consultation Completed (Appointment)', `Completed consultation for patient ${appointment.patientName} (Appointment ID: ${appointment.appointmentId})`);
                return res.json({ queueId: appointment.appointmentId, status: 'COMPLETED', patientName: appointment.patientName });
            }
            return res.status(404).json({ message: 'Queue node or Appointment not found' });
        }

        if (queueNode.status !== 'IN_CONSULTATION') {
          return res.status(400).json({ message: 'Patient is not in consultation' });
        }

        if (queueNode.doctor !== doctor.name) {
          return res.status(403).json({
            message: 'Only the assigned doctor can complete this consultation',
          });
        }

        queueNode.status = 'COMPLETED';
        queueNode.consultationEndTime = new Date();
        await queueNode.save();

        doctor.availabilityStatus = 'AVAILABLE';
        await doctor.save();

        await Patient.findByIdAndUpdate(queueNode.patientId, {
            currentStatus: 'RECOVERING',
            $push: {
                timeline: {
                    action: 'CONSULTATION COMPLETED',
                    department: queueNode.department,
                    performedBy: queueNode.doctor,
                    details: 'Consultation concluded by doctor.',
                },
            },
        });

        emitQueueUpdated(req, queueNode.department);
        emitPatientEvent(req.app.get('io'), queueNode.patientId, 'patientRecordUpdate', {
          type: 'queue_status',
          status: queueNode.status,
          department: queueNode.department,
          tokenNumber: queueNode.tokenNumber,
          queueId: queueNode.queueId,
        });
        logAuditAction(`User: ${doctor.name} (${doctor.role})`, 'Consultation Completed', `Completed consultation for patient ${queueNode.patientName} (Token: ${queueNode.tokenNumber})`);
        res.json(queueNode);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// ==========================================
// 3b. GET LIVE QUEUE (By Department)
// ==========================================
router.get('/queue/live', authenticate, async (req, res) => {
  try {
    const { department, date } = req.query;
    if (!department) return res.status(400).json({ message: 'Department required' });

    const selectedDate = date || todayDateString();
    const today = todayDateString();
    const deptFilter = departmentQuery(normalizeDepartment(department));

    // Handle future dates (selectedDate > today) using Appointment records
    if (selectedDate > today) {
      const appointments = await Appointment.find({
        department: deptFilter,
        appointmentDate: selectedDate,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] }
      }).sort({ appointmentTime: 1 });

      const waitingRaw = [];
      const inRaw = [];
      const completedRaw = [];

      for (const appt of appointments) {
        const patientDetails = await Patient.findById(appt.patientId);
        const virtualNode = {
          queueId: appt.appointmentId,
          tokenNumber: `APT-${appt.appointmentTime}`,
          patientId: appt.patientId,
          patientName: appt.patientName,
          mrn: patientDetails ? patientDetails.mrn : '—',
          age: patientDetails ? patientDetails.age : null,
          gender: patientDetails ? patientDetails.gender : null,
          date: appt.appointmentDate,
          time: appt.appointmentTime,
          doctor: appt.doctorName || 'TBD',
          department: appt.department,
          status: appt.status === 'COMPLETED' ? 'COMPLETED' : appt.status === 'IN_CONSULTATION' ? 'IN_CONSULTATION' : 'WAITING',
          priorityLevel: 'LOW',
          symptoms: appt.reason || 'Booked via Mobile App'
        };

        if (appt.status === 'COMPLETED') {
          completedRaw.push(virtualNode);
        } else if (appt.status === 'IN_CONSULTATION') {
          inRaw.push(virtualNode);
        } else {
          waitingRaw.push(virtualNode);
        }
      }

      return res.json({
        department: normalizeDepartment(department),
        date: selectedDate,
        waiting: sortQueueByPriority(waitingRaw),
        inConsultation: inRaw,
        completed: completedRaw,
      });
    }

    // Default behavior for today/past dates
    const base = { department: deptFilter, date: selectedDate };

    const [waitingRaw, inRaw, completedRaw] = await Promise.all([
      QueueNode.find({ ...base, status: 'WAITING' }).sort({ createdAt: 1 }),
      QueueNode.find({ ...base, status: 'IN_CONSULTATION' }),
      QueueNode.find({ ...base, status: 'COMPLETED' }).sort({ updatedAt: -1 }).limit(20),
    ]);

    const waiting = sortQueueByPriority(await enrichQueueNodes(waitingRaw, Patient));
    const inConsultation = await enrichQueueNodes(inRaw, Patient);
    const completed = await enrichQueueNodes(completedRaw, Patient);

    res.json({
      department: normalizeDepartment(department),
      date: selectedDate,
      waiting,
      inConsultation,
      completed,
    });
  } catch (error) {
    console.error('Live Queue Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ==========================================
// 4. GLOBAL SEARCH
// ==========================================
router.get('/search', authenticate, async (req, res) => {
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
router.get('/metrics', authenticate, async (req, res) => {
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
router.get('/activity', authenticate, async (req, res) => {
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
router.post('/refer', authenticate, validatePermission('canCreateReferral'), async (req, res) => {
    try {
        const { patientId, targetDepartment, referringDoctor, reason, priority, oldQueueId } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const dept = normalizeDepartment(targetDepartment);
        const oldDept = patient.currentDepartment;
        
        patient.currentDepartment = dept;
        patient.currentStatus = 'REFERRED';
        const queuePriority = normalizeClinicalPriority(priority);
        patient.priority = queuePriority;
        
        patient.timeline.push({
            action: 'REFERRED',
            department: dept,
            performedBy: referringDoctor,
            details: `Patient referred from ${referringDoctor} to ${dept}. Reason: ${reason || 'Clinical evaluation'}`
        });

        await patient.save();

        const today = todayDateString();
        const deptCount = await QueueNode.countDocuments({ department: dept, date: today });
        const deptCode = tokenPrefixForDepartment(dept);
        const token = `${deptCode}-REF-${(deptCount + 1).toString().padStart(3, '0')}`;

        const queueNode = new QueueNode({
            queueId: 'Q-REF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            tokenNumber: token,
            patientId: patient._id,
            patientName: patient.patientName,
            mrn: patient.mrn,
            date: today,
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            doctor: 'To Be Assigned',
            department: dept,
            status: 'WAITING',
            priorityLevel: queuePriority,
            symptoms: reason || ''
        });
        await queueNode.save();

        if (oldQueueId) {
            const oldNode = await QueueNode.findOne({ queueId: oldQueueId });
            if (oldNode) {
                oldNode.status = 'REFERRED';
                oldNode.consultationEndTime = new Date();
                await oldNode.save();
                
                const doctorUser = await User.findOne({ name: oldNode.doctor });
                if (doctorUser) {
                    doctorUser.availabilityStatus = 'AVAILABLE';
                    await doctorUser.save();
                }
            } else {
                const appointment = await Appointment.findOne({ appointmentId: oldQueueId });
                if (appointment) {
                    appointment.status = 'COMPLETED';
                    await appointment.save();

                    const doctorUser = await User.findOne({ name: appointment.doctorName });
                    if (doctorUser) {
                        doctorUser.availabilityStatus = 'AVAILABLE';
                        await doctorUser.save();
                    }
                }
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('queueUpdated', { department: dept });
            if (oldDept) io.emit('queueUpdated', { department: oldDept });
            emitPatientEvent(io, patient._id, 'patientRecordUpdate', {
              type: 'referral_update',
              department: dept,
              tokenNumber: token,
              queueId: queueNode.queueId,
            });
        }
        
        logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Department Referral', `Referred patient ${patient.patientName} (MRN: ${patient.mrn}) from ${oldDept || 'OPD'} to ${dept}. Token: ${token}`);
        res.json({ message: `Referred to ${dept}`, token });
    } catch (err) {
        console.error('Referral Error:', err);
        res.status(500).json({ error: 'Referral failed', details: err.message });
    }
});

// ==========================================
// 8. SERVICE ORDERS (Lab, Radiology)
// ==========================================
router.post('/order-lab', authenticate, validatePermission('canViewEMR'), async (req, res) => {
    try {
        const { patientId, tests, orderedBy } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const orderId = 'LAB-' + Date.now();
        const encounterId = 'ENC-' + Date.now();
        const priority = req.body.priority || 'Normal';
        patient.labOrders.push({
            tests,
            orderedBy,
            doctorName: orderedBy,
            orderId,
            encounterId,
            status: 'Pending',
            priority,
            department: patient.currentDepartment || 'OPD',
            sampleStatus: 'Awaiting Collection',
            sampleType: 'Blood',
        });
        patient.currentStatus = 'LAB PENDING';
        patient.timeline.push({
            action: 'LAB ORDERED',
            department: 'Laboratory',
            performedBy: orderedBy,
            details: `Ordered tests: ${tests.join(', ')}. Order ID: ${orderId}`
        });

        // Mirror pending lab request to MedicalHistory Health Vault for timeline visibility
        try {
            const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
            await MedicalHistory.create({
                patientId,
                type: 'lab_report',
                title: `Lab Request: ${tests.join(', ') || 'Diagnostics'}`,
                doctor: orderedBy || 'Attending Staff',
                hospital: patient.currentDepartment ? `${patient.currentDepartment} Ward` : 'Bharat Health Bridge',
                ocrText: 'Lab order successfully requested. Results pending.'
            });
        } catch (mirrorErr) {
            console.error('Failed to seed pending lab to MedicalHistory:', mirrorErr);
        }

        await patient.save();
        const io = req.app.get('io');
        if (io) {
          io.emit('serviceUpdate', { type: 'lab', patientId });
          io.emit('queueUpdated', { department: patient.currentDepartment });
        }
        logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Diagnostic Lab Order', `Ordered lab tests (${tests.join(', ')}) for patient ${patient.patientName} (Order ID: ${orderId})`);
        res.json({ message: 'Lab tests ordered', orderId });
    } catch (err) {
        res.status(500).json({ error: 'Lab order failed' });
    }
});

router.post('/order-radiology', authenticate, validatePermission('canViewEMR'), async (req, res) => {
    try {
        const { patientId, type, bodyPart, orderedBy, priority, clinicalQuestion } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const { normalizeModalityType, resolveModality, medicalHistoryTypeForModality, pendingStatusForModality } = await import('../lib/imagingTemplates.js');
        const normalizedType = normalizeModalityType(type);
        const modality = resolveModality(normalizedType);

        const orderId = 'RAD-' + Date.now();
        const referringDepartment = patient.currentDepartment || 'OPD';
        const orderPriority = priority === 'Emergency' || priority === 'Urgent' ? priority : 'Normal';

        const today = todayDateString();
        const deptCount = await QueueNode.countDocuments({ department: 'Radiology', date: today });
        const deptCode = tokenPrefixForDepartment('Radiology');
        const token = `${deptCode}-${(deptCount + 1).toString().padStart(3, '0')}`;
        const queueId = 'Q-RAD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        const queueNode = new QueueNode({
            queueId,
            tokenNumber: token,
            patientId: patient._id,
            patientName: patient.patientName,
            mrn: patient.mrn,
            date: today,
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            doctor: 'Radiology — To Be Assigned',
            department: 'Radiology',
            status: 'WAITING',
            priorityLevel: normalizeClinicalPriority(priority || 'Routine'),
            symptoms: `${normalizedType} — ${bodyPart || 'Study'}${clinicalQuestion ? `: ${clinicalQuestion}` : ''}`,
        });
        await queueNode.save();

        patient.radiologyOrders.push({
            type: normalizedType,
            bodyPart,
            clinicalQuestion: clinicalQuestion || '',
            orderedBy,
            orderId,
            status: 'Pending',
            priority: orderPriority,
            queueId,
            tokenNumber: token,
            referringDepartment,
            estimatedTurnaround: modality.turnaroundMinutes || 60,
            accessionNumber: `ACC-${Date.now().toString(36).toUpperCase()}`,
        });

        patient.currentStatus = pendingStatusForModality(normalizedType);

        patient.timeline.push({
            action: 'RADIOLOGY ORDERED',
            department: 'Radiology',
            performedBy: orderedBy,
            details: `Ordered ${normalizedType} for ${bodyPart}. Order ID: ${orderId}. Queue token: ${token}`,
        });

        try {
            const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
            const reportType = medicalHistoryTypeForModality(normalizedType);
            await MedicalHistory.create({
                patientId,
                type: reportType,
                title: `Radiology Request: ${normalizedType} of ${bodyPart}`,
                doctor: orderedBy || 'Attending Staff',
                hospital: patient.currentDepartment ? `${patient.currentDepartment} Ward` : 'Bharat Health Bridge',
                ocrText: `${normalizedType} scan successfully requested. Imaging results pending. Token: ${token}`,
            });
        } catch (mirrorErr) {
            console.error('Failed to seed pending radiology to MedicalHistory:', mirrorErr);
        }

        await patient.save();
        const io = req.app.get('io');
        if (io) {
            io.emit('serviceUpdate', { type: 'radiology', patientId });
            io.emit('radiologyOrderCreated', { patientId, orderId, token });
            emitQueueUpdated(req, 'Radiology');
        }
        logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Diagnostic Radiology Order', `Ordered radiology scan (${normalizedType} - ${bodyPart}) for patient ${patient.patientName} (Order ID: ${orderId}, Token: ${token})`);
        res.json({ message: 'Radiology order placed', orderId, tokenNumber: token, queueId });
    } catch (err) {
        console.error('Radiology order failed:', err);
        res.status(500).json({ error: 'Radiology order failed', details: err.message });
    }
});

// ==========================================
// 9. SPECIALIZED ACTIONS (Surgery, Dialysis, Chemo)
// ==========================================
router.post('/schedule-surgery', authenticate, validatePermission('canConfigureOT'), async (req, res) => {
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
        logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Surgery Scheduled', `Scheduled surgery (${procedure}) for patient ${patient.patientName} with surgeon ${surgeon} in OT ${otNumber}`);
        res.json({ message: 'Surgery scheduled' });
    } catch (err) {
        res.status(500).json({ error: 'Surgery scheduling failed' });
    }
});

router.post('/start-session', authenticate, validatePermission('canViewEMR'), async (req, res) => {
    try {
        const { patientId, type, notes } = req.body;
        const performedBy = req.body.performedBy || req.body.orderedBy || 'Doctor';
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
        logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Specialized Session Started', `Started session (${type}) for patient ${patient.patientName}. Notes: ${notes}`);
        res.json({ message: `${type} session started` });
    } catch (err) {
        res.status(500).json({ error: 'Session start failed' });
    }
});

export default router;
