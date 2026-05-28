import { Router } from 'express'
import Patient from '../models/Patient.js'
import QueueNode from '../models/QueueNode.js'
import { emitPrescriptionUpdate, emitPatientEvent } from '../lib/realtime.js'
import { authenticate, validatePermission } from '../middleware/auth.js'
import { logAuditAction } from '../lib/auditLogger.js'

const router = Router()

// ========================
// PATIENT ENDPOINTS
// ========================

// @route   POST /api/clinical/patients
// @desc    Register a new patient
router.post('/patients', authenticate, validatePermission('canRegisterPatient'), async (req, res) => {
  try {
    const newPatient = new Patient(req.body)
    const saved = await newPatient.save()
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Patient Registration', `Registered patient ${saved.patientName} (MRN: ${saved.mrn})`);
    res.status(201).json(saved)
  } catch (error) {
    console.error('Patient Registration Error:', error)
    res.status(500).json({ message: 'Server Error during patient registration', error: error.message })
  }
})

// @route   GET /api/clinical/patients
// @desc    Get all patients
router.get('/patients', authenticate, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 })
    res.json(patients)
  } catch (error) {
    console.error('Fetch Patients Error:', error)
    res.status(500).json({ message: 'Server Error fetching patients' })
  }
})

// @route   GET /api/clinical/patients/:id
// @desc    Get a single patient
router.get('/patients/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
    if (!patient) return res.status(404).json({ message: 'Patient not found' })
    res.json(patient)
  } catch (error) {
    console.error('Fetch Patient Error:', error)
    res.status(500).json({ message: 'Server Error fetching patient' })
  }
})

// @route   PUT /api/clinical/patients/:id
// @desc    Update a patient (add vitals, encounters, labs, etc.)
router.put('/patients/:id', authenticate, async (req, res) => {
  try {
    const patientBefore = await Patient.findById(req.params.id);
    if (!patientBefore) return res.status(404).json({ message: 'Patient not found' });

    const body = req.body;
    const hasOperators = body && (body.$push || body.$set || body.$pull);
    const updated = hasOperators
      ? await Patient.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' })
      : await Patient.findByIdAndUpdate(req.params.id, { $set: body }, { returnDocument: 'after' });
      
    if (!updated) return res.status(404).json({ message: 'Patient not found' });

    // Detect completed radiology orders and process them automatically
    if (req.body.radiologyOrders && Array.isArray(req.body.radiologyOrders)) {
      const oldOrders = patientBefore.radiologyOrders || [];
      const newOrders = req.body.radiologyOrders;
      
      for (const newOrder of newOrders) {
        const oldOrder = oldOrders.find(o => o.orderId === newOrder.orderId);
        if (
          ['Completed', 'Verified', 'Critical'].includes(newOrder.status) &&
          (!oldOrder || !['Completed', 'Verified', 'Critical'].includes(oldOrder.status))
        ) {
          // 1. PUSH TIMELINE EVENT
          updated.timeline.push({
            action: 'RADIOLOGY RESULT READY',
            department: 'Radiology',
            performedBy: newOrder.orderedBy || 'Radiologist',
            details: `Radiology report for ${newOrder.type} (${newOrder.bodyPart}) is ready. Results: ${newOrder.results || 'Imaging successfully performed and verified.'}`,
            timestamp: new Date()
          });
          
          if (updated.currentStatus.includes('PENDING')) {
            updated.currentStatus = 'IN CONSULTATION';
          }
          await updated.save();
          
          // 2. SEED/UPDATE MEDICAL HISTORY
          try {
            const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
            
            const reportType = newOrder.type.toLowerCase() === 'mri' ? 'mri' : 
                               newOrder.type.toLowerCase() === 'ct' ? 'ct_scan' : 
                               newOrder.type.toLowerCase() === 'x-ray' ? 'x_ray' : 'ultrasound';
            
            const summaryText = `Radiology scan completed: ${newOrder.type} of ${newOrder.bodyPart}\n\nRESULT REMARKS:\n${newOrder.results || 'Imaging successfully performed and verified.'}`;
            
            const existingRequest = await MedicalHistory.findOne({
              patientId: updated._id,
              type: reportType,
              title: { $regex: /Radiology Request:/i }
            }).sort({ createdAt: -1 });
            
            if (existingRequest) {
              existingRequest.title = `Radiology Report: ${newOrder.type} of ${newOrder.bodyPart}`;
              existingRequest.ocrText = summaryText;
              existingRequest.doctor = newOrder.orderedBy || 'Radiologist';
              await existingRequest.save();
              console.log(`Radiology: updated existing medical history for patient ${updated._id}`);
            } else {
              await MedicalHistory.create({
                patientId: updated._id,
                type: reportType,
                title: `Radiology Report: ${newOrder.type} of ${newOrder.bodyPart}`,
                doctor: newOrder.orderedBy || 'Radiologist',
                hospital: updated.currentDepartment ? `${updated.currentDepartment} Ward` : 'Bharat Health Bridge',
                ocrText: summaryText
              });
              console.log(`Radiology: created new medical history record for patient ${updated._id}`);
            }
            
            // Auto-trigger a realtime prescription/report update on patient app
            const io = req.app.get('io');
            if (io) {
              const latestHistory = await MedicalHistory.findOne({ patientId: updated._id }).sort({ updatedAt: -1 });
              if (latestHistory) {
                emitPrescriptionUpdate(io, updated._id, latestHistory);
              }
            }
          } catch (mirrorErr) {
            console.error('Failed to mirror radiology results to MedicalHistory:', mirrorErr);
          }
        }
      }
    }

    // Auto-Mirroring to MedicalHistory for complete timeline compatibility
    try {
      const { default: MedicalHistory } = await import('../models/MedicalHistory.js');

      // Mirror EMR Consultation / Prescription
      if (body.$push && (body.$push.prescriptions || body.$push.encounters)) {
        const pres = body.$push.prescriptions || {};
        const enc = body.$push.encounters || {};
        const medications = Array.isArray(pres.medications) ? pres.medications : [];
        const canvas = pres.prescriptionCanvas || enc.prescriptionCanvas || null;

        if (medications.length > 0 || enc.diagnosis || enc.notes || canvas) {
          const record = await MedicalHistory.create({
            patientId: updated._id,
            type: 'prescription',
            title: medications.length > 0 ? 'Doctor Prescription' : 'Clinical EMR Consultation',
            doctor: pres.prescribedBy || enc.prescribedBy || 'Assigned Doctor',
            hospital: updated.currentDepartment ? `${updated.currentDepartment} Ward` : 'General Clinic',
            fileUrl: canvas, // Store the handwritten digital canvas JSON strokes in fileUrl
            prescriptionDetails: {
              medicines: medications.map(m => ({
                name: m.name,
                dosage: m.dosage || m.dose,
                duration: m.duration || m.days
              })),
              diagnosis: pres.diagnosis || enc.diagnosis || 'General OPD Consult',
              notes: enc.notes || 'Clinical consultation saved.'
            }
          });
          const io = req.app.get('io');
          emitPrescriptionUpdate(io, updated._id, record);
        }
      }

      // Mirror Lab Orders / Radiology
      if (body.$push && body.$push.labOrders) {
        const lab = body.$push.labOrders;
        const tests = Array.isArray(lab.tests) ? lab.tests : [];
        await MedicalHistory.create({
          patientId: updated._id,
          type: 'lab_report',
          title: `Lab Request: ${tests.join(', ') || 'Diagnostics'}`,
          doctor: lab.orderedBy || 'Clinical Staff',
          hospital: updated.currentDepartment ? `${updated.currentDepartment} Ward` : 'General Clinic',
          ocrText: 'Lab order successfully requested. Results pending.'
        });
      }
    } catch (mirrorErr) {
      console.error('Error mirroring patient records to MedicalHistory:', mirrorErr);
    }

    const io = req.app.get('io');
    if (req.body.prescriptions || req.body.labOrders || req.body.radiologyOrders) {
      io?.emit('serviceUpdate', { type: 'patient-update', patientId: req.params.id });
      emitPatientEvent(io, req.params.id, 'patientRecordUpdate', { type: 'clinical_update' });
    }
    
    // Log EMR / patient updates
    if (body && (body.$push?.prescriptions || body.prescriptions)) {
      logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'EMR Prescription Added', `Patient: ${updated.patientName} (MRN: ${updated.mrn})`);
    } else if (body && (body.$push?.encounters || body.encounters)) {
      logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'EMR Encounter Recorded', `Patient: ${updated.patientName} (MRN: ${updated.mrn})`);
    } else {
      logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Patient Record Updated', `Patient: ${updated.patientName} (MRN: ${updated.mrn})`);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update Patient Error:', error);
    res.status(500).json({ message: 'Server Error updating patient' });
  }
});

// @route   POST /api/clinical/vitals
router.post('/vitals', authenticate, validatePermission('canRecordVitals'), async (req, res) => {
  try {
    const { patientId, vitals } = req.body
    if (!patientId || !vitals) {
      return res.status(400).json({ message: 'patientId and vitals required' })
    }

    const patient = await Patient.findById(patientId)
    if (!patient) return res.status(404).json({ message: 'Patient not found' })

    const bp = vitals.bp || vitals.bloodPressure
    const heartRate = vitals.heartRate || vitals.hr
    const spo2 = vitals.spo2 || vitals.oxygenSat
    const temp = vitals.temp || vitals.temperature
    const respiratoryRate = vitals.respiratoryRate
    const recordedBy = vitals.recordedBy || 'Nurse'

    patient.vitals.push({
      bp,
      heartRate,
      temp,
      spo2,
      respiratoryRate,
      recordedBy,
      timestamp: new Date(),
    })

    const spo2Num = parseInt(spo2, 10)
    if (!Number.isNaN(spo2Num)) {
      if (spo2Num < 90) patient.currentStatus = 'CRITICAL'
      else if (spo2Num < 95) patient.currentStatus = 'UNDER OBSERVATION'
    }

    patient.timeline.push({
      action: 'VITALS UPDATE',
      department: patient.currentWard || patient.currentDepartment || 'General',
      performedBy: recordedBy,
      details: `Vitals: BP ${bp}, SpO2 ${spo2}%, HR ${heartRate}`,
    })

    await patient.save()
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Recorded Vitals', `Patient: ${patient.patientName} (MRN: ${patient.mrn}) - BP: ${bp}, SpO2: ${spo2}%, HR: ${heartRate} bpm`);
    req.app.get('io')?.emit('criticalUpdate', { patientId, type: 'vitals' })
    res.json(patient)
  } catch (error) {
    console.error('Vitals Error:', error)
    res.status(500).json({ message: 'Server Error recording vitals' })
  }
})

// ========================
// QUEUE ENDPOINTS
// ========================

// @route   POST /api/clinical/queue
// @desc    Add a patient to the queue
router.post('/queue', authenticate, validatePermission('canRegisterPatient'), async (req, res) => {
  try {
    const newQueueNode = new QueueNode(req.body)
    const saved = await newQueueNode.save()
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Queue Node Added', `Patient: ${saved.patientName} (Token: ${saved.tokenNumber})`);
    res.status(201).json(saved)
  } catch (error) {
    console.error('Queue Addition Error:', error)
    res.status(500).json({ message: 'Server Error adding to queue', error: error.message })
  }
})

// @route   GET /api/clinical/queue
// @desc    Get the current active queue (supports department filtering)
router.get('/queue', authenticate, async (req, res) => {
  try {
    const { department } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const query = { date: today };
    if (department) query.department = department;
    const queue = await QueueNode.find(query).sort({ createdAt: 1 }).populate('patientId')
    res.json(queue)
  } catch (error) {
    console.error('Fetch Queue Error:', error)
    res.status(500).json({ message: 'Server Error fetching queue' })
  }
})

// @route   PUT /api/clinical/queue/:queueId
// @desc    Update queue status by queueId string
router.put('/queue/:queueId', authenticate, async (req, res) => {
  try {
    const updated = await QueueNode.findOneAndUpdate({ queueId: req.params.queueId }, req.body, { returnDocument: 'after' })
    if (!updated) return res.status(404).json({ message: 'Queue node not found' })
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Queue Node Updated', `Patient: ${updated.patientName} (Token: ${updated.tokenNumber}) -> Status: ${updated.status}`);
    res.json(updated)
  } catch (error) {
    console.error('Update Queue Error:', error)
    res.status(500).json({ message: 'Server Error updating queue status' })
  }
})

export default router
