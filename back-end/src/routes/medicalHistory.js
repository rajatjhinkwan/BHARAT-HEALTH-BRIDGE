import { Router } from 'express';
import { MedicalHistory, Patient } from '../models/index.js';
import { clinicalUpload, clinicalFileUrl } from '../lib/uploadClinical.js';
import { emitPrescriptionUpdate } from '../lib/realtime.js';
import { escapeRegExp } from '../lib/regexHelpers.js';
import { addRecordBlock } from '../lib/blockchain.js';

const router = Router();

const LAB_TYPES = new Set([
  'lab_report', 'blood_test', 'mri', 'ct_scan', 'x_ray', 'ultrasound', 'ecg',
]);

// ==========================================
// 1. GET PATIENT MEDICAL HISTORY (TIMELINE)
// ==========================================
// Supports filtering by type, query search, and access control checks
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type, query, doctorId } = req.query;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let dbQuery = { patientId };

    // Filter by type
    if (type) {
      dbQuery.type = type;
    }

    // Smart search system (doctor name, hospital name, medicine name, disease, report type, symptoms)
    if (query) {
      const regex = new RegExp(escapeRegExp(query), 'i');
      dbQuery.$or = [
        { title: regex },
        { hospital: regex },
        { doctor: regex },
        { ocrText: regex },
        { 'prescriptionDetails.diagnosis': regex },
        { 'prescriptionDetails.notes': regex },
        { 'prescriptionDetails.medicines.name': regex }
      ];
    }

    // Access control check: If queried by a doctor, check if the record is locked or if the doctor is approved
    let records = await MedicalHistory.find(dbQuery).sort({ createdAt: -1 });

    if (doctorId) {
      records = records.filter(record => {
        const isLocked = record.accessControl?.locked;
        if (!isLocked) return true; // Unlocked records are accessible

        // If locked, check if doctorId is in approved list
        const isApproved = record.accessControl?.approvedDoctors?.includes(doctorId);
        return isApproved;
      });
    }

    res.json(records);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Server error fetching medical history' });
  }
});

// ==========================================
// 2. CREATE PRESCRIPTION
// ==========================================
router.post('/prescription', async (req, res) => {
  try {
    const { patientId, title, hospital, doctor, prescriptionDetails, ocrText } = req.body;

    if (!patientId || !title || !prescriptionDetails) {
      return res.status(400).json({ error: 'Missing required prescription fields' });
    }

    const newRecord = new MedicalHistory({
      patientId,
      type: 'prescription',
      title,
      hospital,
      doctor,
      prescriptionDetails,
      ocrText
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for prescription:', bcErr);
    }

    // Trigger Timeline updates on Patient Model (compatibility)
    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'PRESCRIPTION',
          department: 'General Medicine',
          performedBy: doctor,
          details: `Prescription added by ${doctor} at ${hospital}.`
        }
      }
    });

    const io = req.app.get('io');
    emitPrescriptionUpdate(io, patientId, saved);

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Server error creating prescription' });
  }
});

// ==========================================
// 3a. MULTIPART REPORT UPLOAD
// ==========================================
router.post('/report/upload', clinicalUpload.single('file'), async (req, res) => {
  try {
    const { patientId, title, type, hospital, doctor } = req.body;
    if (!patientId || !req.file) {
      return res.status(400).json({ error: 'patientId and file are required' });
    }

    const reportType = LAB_TYPES.has(type) ? type : 'lab_report';
    const fileUrl = clinicalFileUrl(req, req.file.filename);

    const newRecord = new MedicalHistory({
      patientId,
      type: reportType,
      title: title || req.file.originalname,
      hospital: hospital || 'Bharat Health Bridge',
      doctor: doctor || 'Attending Physician',
      fileUrl,
      ocrText: `Uploaded file: ${req.file.originalname}`,
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for report upload:', bcErr);
    }

    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'REPORT_UPLOAD',
          department: 'Diagnostics',
          performedBy: doctor || 'System',
          details: `${saved.title} uploaded.`,
        },
      },
    });

    req.app.get('io')?.emit('realtimeUpdate', { type: 'report_uploaded', patientId, title: saved.title });
    res.status(201).json(saved);
  } catch (error) {
    console.error('Report upload error:', error);
    res.status(500).json({ error: 'Server error uploading report' });
  }
});

// ==========================================
// 3b. DISCHARGE SUMMARY RECORD
// ==========================================
router.post('/discharge', async (req, res) => {
  try {
    const { patientId, title, hospital, doctor, diagnosis, medicines, followUp, notes } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    const newRecord = new MedicalHistory({
      patientId,
      type: 'discharge_summary',
      title: title || 'Discharge Summary',
      hospital: hospital || 'Bharat Health Bridge',
      doctor: doctor || 'Attending Physician',
      prescriptionDetails: {
        diagnosis: diagnosis || '',
        notes: notes || '',
        followUpDate: followUp ? new Date(followUp) : undefined,
        medicines: Array.isArray(medicines) ? medicines : [],
      },
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for discharge summary:', bcErr);
    }

    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'DISCHARGE_SUMMARY',
          department: 'General',
          performedBy: doctor || 'Doctor',
          details: diagnosis || 'Patient discharged with summary on file.',
        },
      },
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Discharge summary error:', error);
    res.status(500).json({ error: 'Server error saving discharge summary' });
  }
});

// ==========================================
// 3. UPLOAD / ATTACH LAB OR SCAN REPORT (OCR Supported)
// ==========================================
router.post('/report', async (req, res) => {
  try {
    const { patientId, type, title, hospital, doctor, fileUrl, ocrText } = req.body;

    if (!patientId || !type || !title) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    // Auto extraction / OCR parsing simulation
    let extractedText = ocrText || '';
    if (!extractedText) {
      extractedText = `Extracted Text from OCR: Patient MRN checked, ${type} successfully recorded. Normal physiological parameters detected.`;
    }

    const newRecord = new MedicalHistory({
      patientId,
      type,
      title,
      hospital,
      doctor,
      fileUrl,
      ocrText: extractedText
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for report:', bcErr);
    }

    // Auto-link report to Patient Timeline
    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'REPORT_UPLOAD',
          department: 'Diagnostics',
          performedBy: doctor || 'System',
          details: `${title} (${type.toUpperCase()}) report uploaded.`
        }
      }
    });

    req.app.get('io')?.emit('realtimeUpdate', {
      type: 'report_uploaded',
      patientId,
      title
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error adding report:', error);
    res.status(500).json({ error: 'Server error adding report' });
  }
});

// ==========================================
// 4a. MULTIPART VOICE NOTE UPLOAD
// ==========================================
router.post('/voicenote/upload', clinicalUpload.single('file'), async (req, res) => {
  try {
    const { patientId, title, hospital, doctor, duration, transcript } = req.body;
    if (!patientId || !req.file) {
      return res.status(400).json({ error: 'patientId and audio file are required' });
    }

    const audioUrl = clinicalFileUrl(req, req.file.filename);
    const voiceNoteDetails = {
      audioUrl,
      duration: duration ? Number(duration) : undefined,
      transcript:
        transcript ||
        'AI Clinical Transcription: Patient present with symptoms of lumbar spasm and moderate discomfort. Recommended taking Aceclofenac twice daily after food, maintaining light bed posture, and avoiding sudden stress weight lifting. Regular follow-up session scheduled in one week.',
    };

    const newRecord = new MedicalHistory({
      patientId,
      type: 'voice_note',
      title: title || 'Doctor Consultation Note',
      hospital: hospital || 'Bharat Health Bridge',
      doctor: doctor || 'Attending Physician',
      voiceNoteDetails,
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for voicenote upload:', bcErr);
    }

    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'VOICE_NOTE',
          department: 'OPD Consultation',
          performedBy: doctor || 'Doctor',
          details: 'Voice consultation note uploaded.',
        },
        encounters: {
          type: 'VOICE_NOTE',
          notes: voiceNoteDetails.transcript,
          voiceNoteUrl: audioUrl,
          timestamp: new Date(),
        },
      },
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Voice note upload error:', error);
    res.status(500).json({ error: 'Server error uploading voice note' });
  }
});

// ==========================================
// 4. ADD VOICE NOTE CONSULTATION
// ==========================================
router.post('/voicenote', async (req, res) => {
  try {
    const { patientId, title, hospital, doctor, voiceNoteDetails } = req.body;

    if (!patientId || !title || !voiceNoteDetails) {
      return res.status(400).json({ error: 'Missing required voice note fields' });
    }

    // Simulate Speech-to-Text / AI transcription if transcript not provided
    if (!voiceNoteDetails.transcript) {
      voiceNoteDetails.transcript = "AI Transcription: Patient reports general weakness and muscular pain. Advised full bed rest and high fluid intake.";
    }

    const newRecord = new MedicalHistory({
      patientId,
      type: 'voice_note',
      title,
      hospital,
      doctor,
      voiceNoteDetails
    });

    const saved = await newRecord.save();

    try {
      await addRecordBlock(saved._id, saved.patientId, saved);
    } catch (bcErr) {
      console.error('[Blockchain-Integration] Failed to add block for voicenote:', bcErr);
    }

    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        timeline: {
          action: 'VOICE_NOTE',
          department: 'OPD Consultation',
          performedBy: doctor,
          details: `Doctor Consultation voice note recorded.`
        }
      }
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error adding voice note:', error);
    res.status(500).json({ error: 'Server error adding voice note' });
  }
});

// ==========================================
// 5. UPDATE PRIVACY & ACCESS CONTROL (PATIENT CONSENT)
// ==========================================
router.patch('/:recordId/access', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { locked, approvedDoctors, approvedHospitals } = req.body;

    let updateFields = {};
    if (locked !== undefined) updateFields['accessControl.locked'] = locked;
    if (approvedDoctors !== undefined) updateFields['accessControl.approvedDoctors'] = approvedDoctors;
    if (approvedHospitals !== undefined) updateFields['accessControl.approvedHospitals'] = approvedHospitals;

    const updatedRecord = await MedicalHistory.findByIdAndUpdate(
      recordId,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating access control:', error);
    res.status(500).json({ error: 'Server error updating access control' });
  }
});

export default router;
