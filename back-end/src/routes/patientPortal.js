import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User, Patient, Appointment, MedicalHistory, QueueNode } from '../models/index.js';

const router = Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

async function authPatient(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.sub;
    next();
  } catch (err) {
    if (err.message === 'JWT_SECRET is not configured') {
      return res.status(500).json({ error: 'Server authentication is not configured' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function resolvePatientProfile(user) {
  if (user.patientProfileId) {
    const p = await Patient.findById(user.patientProfileId);
    if (p) return p;
  }
  if (user.phone) {
    const byPhone = await Patient.findOne({ phone: user.phone });
    if (byPhone) return byPhone;
  }
  if (user.email) {
    const byEmail = await Patient.findOne({ email: user.email });
    if (byEmail) return byEmail;
  }
  return null;
}

function buildPatientJourney(patient, queueNodes = []) {
  if (!patient) return { steps: [], branches: [] };

  const steps = [];
  const branches = [];

  const timeline = Array.isArray(patient.timeline) ? [...patient.timeline] : [];
  timeline.sort((a, b) => new Date(a?.timestamp || 0) - new Date(b?.timestamp || 0));

  timeline.forEach((event, idx) => {
    if (!event?.action) return;
    steps.push({
      id: `timeline-${idx}`,
      type: 'timeline',
      action: event.action,
      department: event.department || 'Clinical',
      details: event.details || '',
      performedBy: event.performedBy || 'System',
      timestamp: event.timestamp || null,
    });
  });

  const pushServiceBranches = (orders = [], serviceType, labelBuilder) => {
    (orders || []).forEach((order, idx) => {
      branches.push({
        id: `${serviceType}-${idx}`,
        type: serviceType,
        label: labelBuilder(order),
        status: order?.status || 'Pending',
        priority: order?.priority || 'Normal',
        orderedBy: order?.orderedBy || order?.doctorName || 'Doctor',
        tokenNumber: order?.tokenNumber || null,
        queueId: order?.queueId || null,
        createdAt: order?.orderDate || order?.createdAt || null,
      });
    });
  };

  pushServiceBranches(patient.labOrders, 'LABORATORY', (order) => {
    const tests = Array.isArray(order?.tests) ? order.tests.join(', ') : 'Lab tests';
    return tests || 'Lab tests';
  });

  pushServiceBranches(patient.radiologyOrders, 'RADIOLOGY', (order) => {
    const scan = order?.type || 'Imaging';
    const bodyPart = order?.bodyPart ? ` (${order.bodyPart})` : '';
    return `${scan}${bodyPart}`;
  });

  pushServiceBranches(patient.surgeryOrders, 'SURGERY', (order) => order?.procedure || 'Procedure');
  pushServiceBranches(patient.specializedSessions, 'SESSION', (order) => order?.type || 'Specialized session');

  const queueTransitions = (queueNodes || []).map((node, idx) => ({
    id: `queue-${idx}`,
    tokenNumber: node?.tokenNumber,
    queueId: node?.queueId,
    department: node?.department,
    status: node?.status,
    updatedAt: node?.updatedAt || node?.createdAt || null,
  }));

  return { steps, branches, queueTransitions };
}

router.get('/dashboard', authPatient, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const patient = await resolvePatientProfile(user);
    if (patient && !patient.uniqueToken) {
      let token = '';
      for (let i = 0; i < 16; i++) {
        token += Math.floor(Math.random() * 10).toString();
      }
      patient.uniqueToken = token;
      await patient.save();
    }
    const patientId = patient?._id;

    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    const [appointments, prescriptions, upcoming, queueNode, queueNodesForPatient] = await Promise.all([
      patientId
        ? Appointment.find({ patientId })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .limit(20)
            .lean()
        : [],
      patientId
        ? MedicalHistory.find({ patientId, type: 'prescription' })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        : [],
      patientId
        ? Appointment.find({
            patientId,
            status: { $in: ['BOOKED', 'CHECKED_IN'] },
            appointmentDate: { $gte: today },
          })
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .limit(5)
            .lean()
        : [],
      patientId
        ? QueueNode.findOne({
            patientId,
            $or: [
              { status: { $in: ['WAITING', 'IN_CONSULTATION'] } },
              { date: today }
            ]
          })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean()
        : null,
      patientId
        ? QueueNode.find({ patientId })
            .sort({ createdAt: 1 })
            .limit(50)
            .lean()
        : [],
    ]);

    let queueStatus = null;
    if (queueNode) {
      const waitingAhead = await QueueNode.countDocuments({
        date: today,
        department: queueNode.department,
        status: 'WAITING',
        createdAt: { $lt: queueNode.createdAt },
      });
      queueStatus = {
        queueId: queueNode.queueId,
        tokenNumber: queueNode.tokenNumber,
        department: queueNode.department,
        status: queueNode.status,
        priorityLevel: queueNode.priorityLevel,
        position: queueNode.status === 'WAITING' ? waitingAhead + 1 : null,
        estimatedWaitMins: queueNode.status === 'WAITING' ? waitingAhead * 12 : 0,
        updatedAt: queueNode.updatedAt,
      };
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patientProfileId: patientId || user.patientProfileId,
      },
      patient: patient
        ? {
            id: patient._id,
            patientName: patient.patientName,
            mrn: patient.mrn,
            uniqueToken: patient.uniqueToken,
            dob: patient.dob,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            aadharCardId: patient.aadharCardId,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            allergies: patient.allergies,
            chronicIllness: patient.chronicIllness,
            profileImage: patient.profileImage,
            healthCardImage: patient.healthCardImage,
            healthCardType: patient.healthCardType,
            aadharCardImage: patient.aadharCardImage,
            symptoms: patient.symptoms,
            organDonor: patient.organDonor,
            currentStatus: patient.currentStatus,
            currentDepartment: patient.currentDepartment,
          }
        : null,
      appointments,
      upcomingAppointments: upcoming,
      recentPrescriptions: prescriptions,
      queueStatus,
      patientJourney: buildPatientJourney(patient, queueNodesForPatient),
    });
  } catch (err) {
    console.error('Patient dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.post('/link-profile', authPatient, async (req, res) => {
  try {
    const { patientId, phone, mrn } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let patient = null;
    if (patientId) patient = await Patient.findById(patientId);
    else if (phone) patient = await Patient.findOne({ phone });
    else if (mrn) patient = await Patient.findOne({ mrn });

    if (!patient) return res.status(404).json({ error: 'Patient record not found' });

    user.patientProfileId = patient._id;
    await user.save();

    res.json({ ok: true, patientProfileId: patient._id, patient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to link profile' });
  }
});

export default router;
